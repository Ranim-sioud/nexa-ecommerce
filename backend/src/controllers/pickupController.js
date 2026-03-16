import sequelize from '../config/database.js';
import logger from '../config/logger.js';
import SousCommande from "../models/SousCommande.js";
import Commande from "../models/Commande.js";
import Client from "../models/Client.js";
import LigneCommande from "../models/LigneCommande.js";
import Pickup from "../models/Pickup.js";
import { Op } from "sequelize";
import Produit from "../models/Produit.js";

// ============================================
// FONCTION AUXILIAIRE POUR RÉCUPÉRER L'ID FOURNISSEUR
// ============================================
const getFournisseurId = async (userId) => {
  const [fournisseur] = await sequelize.query(
    `SELECT id FROM fournisseurs WHERE id_user = :userId`,
    { 
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT 
    }
  );
  return fournisseur?.id;
};

// ============================================
// CRÉER UN PICKUP (déjà corrigé)
// ============================================
export const createPickup = async (req, res) => {
  try {
    logger.info('🔵 [1] Début createPickup');
    const { sousCommandeIds, notes, poids, nb_colis } = req.body;
    
    if (!Array.isArray(sousCommandeIds) || sousCommandeIds.length === 0) {
      return res.status(400).json({ message: "Aucune sous-commande sélectionnée." });
    }

    const idUser = req.user?.id;
    if (!idUser) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Récupérer l'ID dans la table fournisseurs
    const idFournisseur = await getFournisseurId(idUser);
    if (!idFournisseur) {
      return res.status(403).json({ message: "Vous n'êtes pas enregistré comme fournisseur" });
    }

    // Vérifier les sous-commandes (avec id_fournisseur = users.id)
    const sousCommandes = await SousCommande.findAll({
      where: { 
        id: sousCommandeIds,
        id_fournisseur: idUser
      }
    });

    if (sousCommandes.length !== sousCommandeIds.length) {
      return res.status(403).json({ message: "Certaines sous-commandes n'existent pas ou ne vous appartiennent pas" });
    }

    // Créer le pickup
    const code = `PU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const meta = { sousCommandeIds, notes, poids, nb_colis, created_at: new Date().toISOString() };

    const newPickup = await Pickup.create({
      code,
      id_fournisseur: idFournisseur,  // ID de la table fournisseurs
      id_livreur: null,
      status: 'demandé',
      meta,
      cree_le: new Date(),
      modifie_le: new Date()
    });

    // Mettre à jour les sous-commandes
    await SousCommande.update(
      { statut: "en_attente_enlevement" }, 
      { where: { id: sousCommandeIds } }
    );

    return res.status(201).json({ message: "Pickup créé avec succès", pickup: newPickup });

  } catch (err) {
    console.error('❌ ERREUR:', err);
    logger.error("createPickup error:", err);
    return res.status(500).json({ message: "Erreur lors de la création du pickup", error: err.message });
  }
};

// ============================================
// LISTER LES PICKUPS (CORRIGÉ)
// ============================================
export const listPickups = async (req, res) => {
  try {
    const idUser = req.user.id;
    
    // ✅ Récupérer l'ID dans la table fournisseurs
    const idFournisseur = await getFournisseurId(idUser);
    if (!idFournisseur) {
      return res.status(403).json({ message: "Vous n'êtes pas enregistré comme fournisseur" });
    }

    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const q = (req.query.q || "").trim();

    const where = { id_fournisseur: idFournisseur };  // ✅ Utiliser l'ID de la table fournisseurs
    if (q) where.code = { [Op.iLike]: `%${q}%` };

    const { count, rows } = await Pickup.findAndCountAll({
      where,
      order: [["cree_le", "DESC"]],
      limit,
      offset: (page - 1) * limit
    });

    // Charger les sous-commandes pour chaque pickup
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
                { model: Client, as: "client", attributes: ["prenom", "nom", "telephone", "adresse", "gouvernorat"] }
              ]
            },
            { 
              model: LigneCommande, 
              as: "lignes", 
              include: [{ model: Produit, as: "produit", attributes: ["id", "nom"] }] 
            }
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
    logger.error("listPickups error:", err);
    return res.status(500).json({ message: "Erreur list pickups", error: err.message });
  }
};

// ============================================
// DÉTAIL D'UN PICKUP (CORRIGÉ)
// ============================================
export const getPickupDetail = async (req, res) => {
  try {
    const pickupId = parseInt(req.params.id);
    if (!pickupId) return res.status(400).json({ message: "Pickup id manquant" });

    const idUser = req.user.id;
    const idFournisseur = await getFournisseurId(idUser);
    
    const pickup = await Pickup.findOne({
      where: { 
        id: pickupId,
        id_fournisseur: idFournisseur  // ✅ Vérifier que le pickup appartient bien au fournisseur
      }
    });

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

    // Calculer les frais de livraison
    const sousCommandesWithFrais = await Promise.all(
      sousCommandes.map(async (sc) => {
        const nbSousCommandes = await SousCommande.count({
          where: { id_commande: sc.id_commande },
        });

        const fraisLivraison = nbSousCommandes > 1 ? 7.5 : 8.0;
        const totalSousCommande = parseFloat(sc.total || 0) + fraisLivraison;

        return {
          ...sc.toJSON(),
          nbSousCommandes,
          fraisLivraison,
          totalAvecLivraison: totalSousCommande,
        };
      })
    );

    return res.status(200).json({ 
      pickup, 
      sousCommandes: sousCommandesWithFrais 
    });

  } catch (err) {
    logger.error("getPickupDetail error:", err);
    return res.status(500).json({ message: "Erreur get pickup", error: err.message });
  }
};

// ============================================
// LISTER LES SOUS-COMMANDES EN ATTENTE D'ENLÈVEMENT (CORRIGÉ)
// ============================================
export const listEnAttenteEnlevement = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;

    const whereSous = { statut: "en_attente_enlevement" };

    if (role === "fournisseur" || role === "admin") {  // ✅ Admin aussi considéré comme fournisseur
      // Pour les fournisseurs, on filtre par id_fournisseur = users.id
      whereSous.id_fournisseur = user.id;
    }

    const includeCommande = {
      model: Commande,
      as: "commande",
      attributes: ["id", "code", "id_vendeur", "total", "colis_fragile", "colis_ouvrable", "demande_confirmation"],
      include: [
        { model: Client, as: "client", attributes: ["prenom", "nom", "telephone", "adresse", "gouvernorat"] }
      ]
    };

    const sousCommandes = await SousCommande.findAll({
      where: whereSous,
      include: [
        includeCommande,
        { 
          model: LigneCommande, 
          as: "lignes", 
          attributes: ["quantite", "prix_vente", "id_produit"],
          include: [
            { model: Produit, as: "produit", attributes: ["id", "nom"] }
          ]
        }
      ],
      order: [["cree_le", "DESC"]]
    });

    // Filtrer pour les vendeurs
    if (role === "vendeur") {
      const filtered = sousCommandes.filter(sc => sc.commande?.id_vendeur === user.id);
      return res.json(filtered);
    }

    return res.json(sousCommandes);

  } catch (err) {
    logger.error("listEnAttenteEnlevement error:", err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};