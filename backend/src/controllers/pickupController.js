import SousCommande from "../models/SousCommande.js";
import Commande from "../models/Commande.js";
import Client from "../models/Client.js";
import LigneCommande from "../models/LigneCommande.js";
import Pickup from "../models/Pickup.js";
import { Op } from "sequelize";
import Produit from "../models/Produit.js";


export const createPickup = async (req, res) => {
  try {
    const { sousCommandeIds, notes, poids, nb_colis } = req.body;
    if (!Array.isArray(sousCommandeIds) || sousCommandeIds.length === 0) {
      return res.status(400).json({ message: "Aucune sous-commande sélectionnée." });
    }

    const idFournisseur = req.user.id; // adapt selon auth
    

    const newPickup = await Pickup.create({
      code: `PU-${Date.now()}`,
      id_fournisseur: idFournisseur,
      id_livreur: null,
      meta: { sousCommandeIds, notes, poids, nb_colis }
    });

    // Optionnel : mettre à jour le statut des sous-commandes
    await SousCommande.update({ statut: "en_attente_enlevement" }, { where: { id: sousCommandeIds } });

    return res.status(201).json({ message: "Pickup créé", pickup: newPickup });
  } catch (err) {
    console.error("createPickup error:", err);
    return res.status(500).json({ message: "Erreur création pickup", error: err.message });
  }
};

/**
 * Lister pickups (pagination simple)
 * Query: page, limit, q (recherche par code)
 */
export const listPickups = async (req, res) => {
  try {
    const idFournisseur = req.user.id;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const q = (req.query.q || "").trim();

    const where = { id_fournisseur: idFournisseur };
    if (q) where.code = { [Op.iLike]: `%${q}%` };

    const { count, rows } = await Pickup.findAndCountAll({
      where,
      order: [["cree_le", "DESC"]],
      limit,
      offset: (page - 1) * limit
    });

    // 🔍 Charger les sous-commandes pour chaque pickup
    const pickupsWithSousCommandes = await Promise.all(
      rows.map(async (pickup) => {
        const sousCommandeIds = pickup.meta?.sousCommandeIds || [];

        const sousCommandes = await SousCommande.findAll({
          where: { id: sousCommandeIds },
          include: [
            {
              model: Commande,
              as: "commande",
              include: [
                { model: Client, as: "client", attributes: ["prenom", "nom", "telephone"] }
              ]
            },
                { model: LigneCommande, as: "lignes", include: [{ model: Produit, as: "produit", attributes: ["id", "nom"] }] }
          ]
        });

        return {
          ...pickup.toJSON(),
          sousCommandes
        };
      })
    );

    return res.status(200).json({
      total: count,
      page,
      limit,
      pickups: pickupsWithSousCommandes
    });
  } catch (err) {
    console.error("listPickups error:", err);
    return res.status(500).json({ message: "Erreur list pickups", error: err.message });
  }
};

/**
 * Détail d'un pickup (renvoie pickup + toutes les sous-commandes liées + commande + client + lignes + produits)
 */
export const getPickupDetail = async (req, res) => {
  try {
    const pickupId = parseInt(req.params.id);
    if (!pickupId) return res.status(400).json({ message: "Pickup id manquant" });

    const pickup = await Pickup.findByPk(pickupId);
    if (!pickup) return res.status(404).json({ message: "Pickup introuvable" });

    const sousCommandeIds = pickup.meta?.sousCommandeIds || [];

    const sousCommandes = await SousCommande.findAll({
      where: { id: sousCommandeIds },
      include: [
        {
          model: Commande,
          as: "commande",
          include: [
            {
              model: Client,
              as: "client",
              attributes: ["id", "prenom", "nom", "telephone", "adresse", "gouvernorat"],
            },
          ],
        },
        {
          model: LigneCommande,
          as: "lignes",
          attributes: ["prix_vente", "quantite"],
          include: [{ model: Produit, as: "produit", attributes: ["id", "nom"] }],
        },
      ],
    });

    const sousCommandesWithFrais = [];

    for (const sc of sousCommandes) {
      // 🔍 On récupère le nombre total de sous-commandes de la même commande (tous fournisseurs confondus)
      const nbSousCommandes = await SousCommande.count({
        where: { id_commande: sc.id_commande },
      });

      const fraisLivraison = nbSousCommandes > 1 ? 7.5 : 8.0;
      const totalSousCommande = parseFloat(sc.total || 0) + parseFloat(fraisLivraison);

      sousCommandesWithFrais.push({
        ...sc.toJSON(),
        nbSousCommandes,
        fraisLivraison,
        totalAvecLivraison: totalSousCommande,
      });
    }

    return res.status(200).json({ pickup, sousCommandes: sousCommandesWithFrais });
  } catch (err) {
    console.error("getPickupDetail error:", err);
    return res.status(500).json({ message: "Erreur get pickup", error: err.message });
  }
};
export const listEnAttenteEnlevement = async (req, res) => {
  try {
    const user = req.user || {}; // middleware auth devrait populater req.user
    const role = user.role || "vendeur";
    const whereSous = { statut: "en_attente_enlevement" };

    // si fournisseur => on renvoie uniquement les sous-commandes qui lui appartiennent
    if (role === "fournisseur") {
      whereSous.id_fournisseur = user.id;
    }

    // si vendeur, on veut les sous-commandes dont la commande appartient à ce vendeur
    // join with Commande => where commande.id_vendeur = user.id
    const includeCommande = {
      model: Commande,
      as: "commande",
      attributes: ["id", "code", "id_vendeur", "total", "colis_fragile", "colis_ouvrable", "demande_confirmation"],
      include: [
        { model: Client, as: "client", attributes: ["prenom", "nom", "telephone", "adresse"] }
      ]
    };

    const sousCommandes = await SousCommande.findAll({
      where: whereSous,
      include: [
        includeCommande,
        { model: LigneCommande, as: "lignes", attributes: ["quantite", "prix_vente", "id_produit"],
          include: [
            { model: Produit, as: "produit", attributes: ["nom"] }
          ]
         }
      ],
      order: [["cree_le", "DESC"]]
    });

    // si vendeur: filtrer coté app pour garder seulement les sousCommandes dont commande.id_vendeur = user.id
    if (role === "vendeur") {
      const filtered = sousCommandes.filter(sc => sc.commande && sc.commande.id_vendeur === user.id);
      return res.json(filtered);
    }

    return res.json(sousCommandes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
