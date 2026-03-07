import logger from '../config/logger.js';
import { Commande, SousCommande, LigneCommande, Client, Produit, Variation, User, MesProduit, Media, Categorie, Tracking, Vendeur, Fournisseur, Transaction } from "../models/index.js";
import { Op } from "sequelize";
import { createStockNotification } from "./notificationsController.js";


// Générer un code unique
function genererCode(prefix) {
  return prefix + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export const creerCommande = async (req, res) => {
  try {
    const { client, produits, commentaire, source, collis_date, demande_confirmation, colis_ouvrable, colis_fragile } = req.body;
    const id_vendeur = req.user.id;

    // ✅ 1. Vérifier ou créer le client
    let clientRecord;
    if (client?.id) {
      clientRecord = await Client.findOne({ where: { id: client.id, id_vendeur } });
    } else {
      clientRecord = await Client.create({ ...client, id_vendeur });
    }

    if (!clientRecord) {
      return res.status(400).json({ message: "Client non trouvé ou invalide" });
    }

    // ✅ 2. Regrouper les produits par fournisseur et valider les stocks
    const produitsParFournisseur = {};
    let totalQuantite = 0;

    for (const item of produits) {
     const produit = await Produit.findByPk(item.id_produit);
   
     if (!produit) {
       return res.status(400).json({ message: `Produit #${item.id_produit} non trouvé` });
     }
   
     // ⚠️ Si une variation est sélectionnée, on vérifie le stock de la variation
     if (item.id_variation) {
       const variation = await Variation.findByPk(item.id_variation);
       if (!variation) {
         return res.status(400).json({ message: `Variation non trouvée pour "${produit.nom}"` });
       }
   
       // 🔴 Vérifier la rupture de stock de la variation
       if (variation.stock <= 5) {
         return res.status(400).json({
           message: `La variation "${variation.couleur || '-'} / ${variation.taille || '-'}" du produit "${produit.nom}" est en rupture de stock (stock actuel: ${variation.stock}).`
         });
       }
   
       // 🔴 Vérifier le stock disponible de la variation
       if (variation.stock < item.quantite) {
         return res.status(400).json({
           message: `Stock insuffisant pour la variation "${variation.couleur || '-'} / ${variation.taille || '-'}" du produit "${produit.nom}". Stock disponible: ${variation.stock}, quantité demandée: ${item.quantite}.`
         });
       }
     } 
     else {
       // Sinon on vérifie le stock du produit principal
       if (produit.stock <= 5) {
         return res.status(400).json({
           message: `Le produit "${produit.nom}" est en rupture de stock (stock actuel: ${produit.stock}).`
         });
       }

    if (produit.stock < item.quantite) {
      return res.status(400).json({
        message: `Stock insuffisant pour "${produit.nom}". Stock disponible: ${produit.stock}, quantité demandée: ${item.quantite}.`
      });
    }
  }

      const id_fournisseur = produit.id_fournisseur;

      if (!produitsParFournisseur[id_fournisseur]) {
        produitsParFournisseur[id_fournisseur] = [];
      }

      produitsParFournisseur[id_fournisseur].push({
        ...item,
        produit, // Inclure les infos complètes du produit
        prix_gros: item.prix_gros || produit.prix_gros,
      });

      totalQuantite += item.quantite;
    }

    // ✅ 3. Créer la commande principale
    const commande = await Commande.create({
      code: genererCode("ENO"),
      id_client: clientRecord.id,
      id_vendeur,
      commentaire,
      source,
      collis_date,
      colis_ouvrable,
      colis_fragile,
      demande_confirmation,
      etat_confirmation: demande_confirmation ? "en_attente" : "confirmee",
      // Initialiser à 0, sera mis à jour après calcul
      total: 0,
      frais_livraison: 0,
      frais_plateforme: 0,  
      total_general: 0
    });

    let totalProduits = 0;
    let totalProduitsGros = 0;
    const sousCommandes = [];

    // ✅ 4. Créer les sous-commandes et lignes de commande
    for (const [id_fournisseur, produitsFournisseur] of Object.entries(produitsParFournisseur)) {
      const sousCommande = await SousCommande.create({
        code: genererCode("ENSO"),
        id_commande: commande.id,
        id_fournisseur: parseInt(id_fournisseur),
        statut: "en_attente",
        total: 0 // Initialiser à 0
      });

      await Tracking.create({
        id_sous_commande: sousCommande.id,
        statut: "en_attente",
        description: "Sous-commande créée et en attente de traitement."
      });

      let totalSousCommande = 0;
      let totalGros = 0;

      // Créer les lignes de commande pour ce fournisseur
      for (const item of produitsFournisseur) {
        const profit_unitaire_brut = item.prix_vente - item.prix_gros;
        
        await LigneCommande.create({
          id_sous_commande: sousCommande.id,
          id_produit: item.id_produit,
          id_variation: item.id_variation || null,
          quantite: item.quantite,
          prix_vente: item.prix_vente,
          prix_gros: item.prix_gros,
          profit_unitaire: profit_unitaire_brut, // Profit brut pour l'instant
        });

        totalSousCommande += item.prix_vente * item.quantite;
        totalGros += (item.prix_gros * item.quantite);
      }

      // Mettre à jour le total de la sous-commande
      await sousCommande.update({ total: totalSousCommande });
      sousCommandes.push(sousCommande);
      totalProduitsGros += totalGros ;
      totalProduits += totalSousCommande;
    }

    // ✅ 5. CALCUL CORRECT DES FRAIS
    const nbFournisseurs = Object.keys(produitsParFournisseur).length;
    
    // Frais de livraison : 8 TND pour 1 fournisseur, 7.5 TND par fournisseur au-delà
    const frais_livraison = nbFournisseurs === 1 ? 8 : 7.5 * nbFournisseurs;
    
    // Frais de plateforme : 10% du total des produits
    const frais_plateforme = totalProduitsGros * 0.1;
    
    // Total général = produits + tous les frais
    const totalGeneral = totalProduits + frais_livraison ;

    // ✅ 6. MISE À JOUR CORRECTE DE LA COMMANDE
    await commande.update({
      total: totalGeneral ,          // Total des produits seulement
      frais_livraison,
      frais_plateforme,
      total_general: totalGeneral    // Total final avec tous frais
    });

    // ✅ 7. CALCUL DU PROFIT NET (OPTIONNEL - plus simple et précis)
    // Si vous voulez vraiment calculer un profit net, voici une version simplifiée :
    for (const [id_fournisseur, produitsFournisseur] of Object.entries(produitsParFournisseur)) {
      const sousCommande = await SousCommande.findOne({
        where: { id_commande: commande.id, id_fournisseur: parseInt(id_fournisseur) },
      });

      for (const item of produitsFournisseur) {
        // Calcul proportionnel des frais pour ce produit
        const proportionProduit = (item.prix_vente * item.quantite) / totalProduits;
        const fraisProportionnels = frais_plateforme  * proportionProduit;
        
        const profit_unitaire_net = item.prix_vente - item.prix_gros - (fraisProportionnels / item.quantite);
        
        await LigneCommande.update(
          { profit_unitaire: profit_unitaire_net },
          {
            where: { 
              id_sous_commande: sousCommande.id, 
              id_produit: item.id_produit 
            },
          }
        );
      }
    }

    // ✅ 8. MISE À JOUR DES STOCKS
    for (const item of produits) {
      await Produit.decrement('stock', {
        by: item.quantite,
        where: { id: item.id_produit }
      });
      logger.info('item.id_variation', item.id_variation)
      // Décrémenter le stock de la variation si elle existe
      if (item.id_variation) {
        logger.info('item.id_variation', item.id_variation)
        await Variation.decrement('stock', {
          by: item.quantite,
          where: { id: item.id_variation }
        });
      }
      if (item.id_variation) {
        const variation = await Variation.findByPk(item.id_variation);
        if (!variation || variation.stock < item.quantite) {
          return res.status(400).json({
            message: `Stock insuffisant pour la variation sélectionnée de "${item.produit.nom}".`
          });
        }
      }
    }

    // ✅ 9. RÉCUPÉRATION DE LA COMMANDE COMPLÈTE
    const commandeComplete = await Commande.findByPk(commande.id, {
      include: [
        { model: Client, as: "client" },
        {
          model: SousCommande,
          as: "sous_commandes",
          include: [
            { model: User, as: "fournisseur" },
            {
              model: LigneCommande,
              as: "lignes",
              include: [
                { model: Produit, as: "produit" },
                { model: Variation, as: "variation" },
              ],
            },
          ],
        },
      ],
    });

    return res.status(201).json(commandeComplete);
    
  } catch (error) {
    logger.error("Erreur création commande:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const modifierCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const id_vendeur = req.user.id;
    const { commentaire, source, colis_ouvrable, colis_fragile, etat_confirmation, client } = req.body;

    const commande = await Commande.findOne({
      where: { id, id_vendeur },
      include: [{ model: Client, as: "client" }],
    });

    if (!commande) {
      return res.status(404).json({ message: "Commande non trouvée ou non autorisée" });
    }

    // ⚠️ Si déjà confirmée ou annulée → pas de modification possible
    if (commande.etat_confirmation !== "en_attente") {
      return res.status(400).json({ message: "Commande déjà confirmée ou annulée" });
    }

    // Mise à jour client
    if (client && commande.client) {
      await commande.client.update(client);
    }

    // Mise à jour commande
    await commande.update({
      commentaire,
      source,
      colis_ouvrable,
      colis_fragile,
      etat_confirmation, // ✅ maj ici
    });

    if (etat_confirmation === "annulee") {
    // Récupérer toutes les sous-commandes et lignes
    const sousCommandes = await SousCommande.findAll({
      where: { id_commande: commande.id },
      include: [
        {
          model: LigneCommande,
          as: "lignes",
          include: [{ model: Produit, as: "produit" }],
        },
      ],
    });
  
    for (const sousCommande of sousCommandes) {
      for (const ligne of sousCommande.lignes) {
        await Produit.increment("stock", {
          by: ligne.quantite,
          where: { id: ligne.id_produit },
        });
      }
    }

  await Tracking.create({
    id_sous_commande: null,
    statut: "annulee",
    description: `Commande ${commande.code} annulée — stock rétabli.`,
  });
}

    await Tracking.create({
      id_sous_commande: null, // car c’est le statut global de la commande
      statut: etat_confirmation,
      description: `État de confirmation de la commande ${commande.code} mis à jour à : ${etat_confirmation}`
    });

    const commandeMaj = await Commande.findByPk(id, {
      include: [{ model: Client, as: "client" }],
    });

    res.status(200).json({
      message: "Commande et client mis à jour avec succès",
      commande: commandeMaj,
    });
  } catch (error) {
    logger.error("Erreur modification commande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getFraisCommande = async (req, res) => {
  try {
    const { produits } = req.body;

    if (!produits || produits.length === 0) {
      return res.status(400).json({ message: "Aucun produit fourni" });
    }

    // ✅ Gérer toutes les structures possibles
    const fournisseurs = new Set(
      produits
        .map(
          (p) =>
            p.produit?.id_fournisseur ||
            p.produit?.fournisseur?.id ||
            p.fournisseur?.id
        )
        .filter((id) => id !== undefined && id !== null)
    );

    const nbFournisseurs = fournisseurs.size || 1;

    // 🟩 Frais de livraison
    const frais_livraison = nbFournisseurs === 1 ? 8 : 7.5 * nbFournisseurs;

    return res.status(200).json({
      frais_livraison,
    });
  } catch (error) {
    logger.error("Erreur calcul frais commande:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
// Lister les commandes pour le vendeur
export const listerCommandesVendeur = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      statut,
      tracking,
      produit,
      dateCreationStart,
      dateCreationEnd,
    } = req.query;

    const id_vendeur = req.user.id;
    let where = { id_vendeur };

    logger.info("📋 Paramètres reçus:", {
      page, limit, search, statut, tracking, produit, 
      dateCreationStart, dateCreationEnd
    });

    // 🔍 Recherche simple sur le code de commande seulement
    if (search && search.trim() !== "") {
      // Recherche dans commande.code ET client (prénom, nom, téléphone)
      const clients = await Client.findAll({
        where: {
          [Op.or]: [
            { prenom: { [Op.iLike]: `%${search}%` } },
            { nom: { [Op.iLike]: `%${search}%` } },
            { telephone: { [Op.iLike]: `%${search}%` } },
          ],
        },
        attributes: ['id'],
        raw: true
      });

      const clientIds = clients.map(c => c.id);
      
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { id_client: { [Op.in]: clientIds } }
      ];
    }

    // 🗓️ Dates de création
    if (dateCreationStart || dateCreationEnd) {
      where.cree_le = {};
      if (dateCreationStart) where.cree_le[Op.gte] = new Date(dateCreationStart);
      if (dateCreationEnd) where.cree_le[Op.lte] = new Date(dateCreationEnd);
    }

    // Configuration des includes de base
    const includes = [
      {
        model: Client,
        as: "client",
        attributes: ["prenom", "nom", "telephone"],
        
      },
      {
        model: SousCommande,
        as: "sous_commandes",
        attributes: ["code", "statut", "modifie_le"],
        include: [
          {
            model: LigneCommande,
            as: "lignes",
            include: [
              {
                model: Produit,
                as: "produit",
                include: [{ 
                  model: Media, 
                  as: "medias"
                }]
              }
            ]
          }
        ]
      }
    ];

    // 🔹 RÉCUPÉRATION DE TOUTES LES COMMANDES (sans pagination pour le filtrage)
    const allCommandes = await Commande.findAll({
      where,
      include: includes,
      order: [["cree_le", "DESC"]],
    });

    logger.info(`📊 Commandes récupérées (avant filtrage): ${allCommandes.length}`);

    // 🔹 FILTRAGE MANUEL POUR LES FILTRES COMPLEXES
    let filteredCommandes = allCommandes;

    // Filtre statut/tracking
    if ((statut && statut !== "tous") || tracking) {
      filteredCommandes = filteredCommandes.filter(commande => {
        const sousCommandes = commande.sous_commandes || [];
        return sousCommandes.some(sousCommande => {
          if (statut && statut !== "tous" && sousCommande.statut === statut) return true;
          if (tracking) {
            const trackingArray = tracking.split(",").map(t => t.trim());
            if (trackingArray.includes(sousCommande.statut)) return true;
          }
          return false;
        });
      });
    }

    // Filtre produit
    if (produit) {
      const produitsArray = produit.split(",").map(p => p.trim());
      filteredCommandes = filteredCommandes.filter(commande => {
        const sousCommandes = commande.sous_commandes || [];
        return sousCommandes.some(sousCommande => {
          const lignes = sousCommande.lignes || [];
          return lignes.some(ligne => {
            const nomProduit = ligne.produit?.nom;
            return nomProduit && produitsArray.includes(nomProduit);
          });
        });
      });
    }

    // 🔹 PAGINATION INTELLIGENTE
    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);
    const totalCount = filteredCommandes.length;
    
    // Calcul du nombre total de pages
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Ajustement de la page courante si elle dépasse le nombre total de pages
    const adjustedPage = Math.min(Math.max(1, currentPage), totalPages);
    
    // Calcul de l'offset et du limit pour la pagination
    const startIndex = (adjustedPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    
    // Récupération des commandes pour la page courante
    const commandesPaginated = filteredCommandes.slice(startIndex, endIndex);

    logger.info(`✅ Commandes après filtrage: ${totalCount}, page: ${adjustedPage}/${totalPages}, affichées: ${commandesPaginated.length}`);

    res.json({
      commandes: commandesPaginated,
      total: totalCount,
      page: adjustedPage, // Retourne la page ajustée
      totalPages: totalPages,
      hasNextPage: adjustedPage < totalPages,
      hasPrevPage: adjustedPage > 1,
    });
  } catch (error) {
    logger.error("❌ Erreur liste commandes:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir les détails d'une commande
export const obtenirDetailsCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const id_vendeur = req.user.id;

    const commande = await Commande.findOne({
      where: { id, id_vendeur },
      include: [
        { model: Client, as: "client" },
        { 
          model: SousCommande, 
          as: "sous_commandes",
          include: [
            { model: User, as: "fournisseur" },
            { 
              model: LigneCommande, 
              as: "lignes",
              include: [
                { 
                  model: Produit, 
                  as: "produit",
                  include: [
                    { model: Media, as: "medias" }
                  ]
                },
                { model: Variation, as: "variation" }
              ]
            },
            { 
              model: Tracking, 
              as: "historique_tracking",
              order: [['cree_le', 'DESC']]
            }
          ]
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }
    logger.info("Commande ::", commande)
    res.json(commande);
  } catch (error) { 
    logger.error("Erreur détails commande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const listerCommandesFournisseur = async (req, res) => { 
  try {
    const fournisseurId = req.user.id;

    // 🔹 Récupérer toutes les sous-commandes du fournisseur (hors annulées)
    const sousCommandes = await SousCommande.findAll({
      where: { 
        id_fournisseur: fournisseurId,
        statut: { [Op.ne]: "annulee" }
      },
      include: [
        {
          model: Commande,
          as: "commande",
          include: [
            { 
              model: Client, 
              as: "client",
              attributes: ['prenom', 'nom', 'telephone', 'gouvernorat', 'adresse']
            }
          ]
        },
        {
          model: LigneCommande,
          as: "lignes",
          include: [
            {
              model: Produit,
              as: "produit",
              include: [{ model: Media, as: "medias" }]
            }
          ]
        }
      ],
      order: [['cree_le', 'DESC']]
    });

    // 🔹 Calcul du frais de livraison pour chaque sous-commande
    const sousCommandesWithFrais = [];

    for (const sc of sousCommandes) {
      // Compter le nombre de sous-commandes dans la même commande principale
      const nbSousCommandes = await SousCommande.count({
        where: { id_commande: sc.id_commande },
      });

      const fraisLivraison = nbSousCommandes > 1 ? 7.5 : 8.0;
      const totalSousCommande = parseFloat(sc.total || 0) + parseFloat(fraisLivraison);

      sousCommandesWithFrais.push({
        ...sc.toJSON(),
        nbSousCommandes,
        frais_livraison: fraisLivraison,
        total_avec_livraison: totalSousCommande,
      });
    }

    // 🔹 On retourne uniquement le tableau corrigé (pas besoin du doublon)
    return res.status(200).json(sousCommandesWithFrais);

  } catch (error) {
    logger.error("Erreur récupération commandes fournisseur :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const obtenirDetailsCommandeFournisseur = async (req, res) => {
  try {
    const { id } = req.params;
    const id_fournisseur = req.user.id;

    // Trouver la sous-commande qui appartient au fournisseur
    const sousCommande = await SousCommande.findOne({
      where: { id, id_fournisseur },
      include: [
        { 
          model: Commande, 
          as: "commande",
          include: [
            { model: Client, as: "client" }, // informations client
            {
              model: SousCommande,
              as: "sous_commandes", // 🔥 pour que le frontend puisse savoir combien il y en a
              attributes: ["id"]
            }
          ]
        },
        {
          model: LigneCommande,
          as: "lignes",
          include: [
            { 
              model: Produit, 
              as: "produit",
              include: [
                { model: Media, as: "medias" }
              ]
            },
            { model: Variation, as: "variation" }
          ]
        },
        {
          model: Tracking,
          as: "historique_tracking",
          order: [['cree_le', 'DESC']]
        }
      ]
    });

    if (!sousCommande) {
      return res.status(404).json({ message: "Sous-commande non trouvée pour ce fournisseur" });
    }

    res.json(sousCommande);

  } catch (error) {
    logger.error("Erreur détails commande fournisseur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


export const mettreAJourTracking = async (req, res) => { 
  try {
    const { id } = req.params;
    const { statut, details } = req.body;

    const sousCommande = await SousCommande.findByPk(id, {
      include: [
        { 
          model: Commande, 
          as: "commande",
          include: [{ model: User, as: "vendeur" }]
        },
        {
          model: LigneCommande,
          as: "lignes",
          include: [
            { model: Produit, as: "produit" },
            { model: Variation, as: "variation" } // ← IMPORTANT: inclure la variation
          ]
        },
        {
          model: User,
          as: "fournisseur"
        }
      ]
    });

    if (!sousCommande) {
      return res.status(404).json({ message: "Sous-commande introuvable" });
    }

    // Vérifier si déjà livrée (éviter les doubles paiements)
    if (sousCommande.statut === "livree") {
      return res.status(400).json({ message: "Cette sous-commande est déjà livrée" });
    }

    // Stocker l'ancien statut pour vérifier si c'était déjà "Colis retourné"
    const ancienStatut = sousCommande.statut;

    // ⚙️ Mise à jour du statut de la sous-commande
    sousCommande.statut = statut;
    if (details) sousCommande.details = details;
    await sousCommande.save();

    // 🟢 Enregistrer dans le tracking
    await Tracking.create({
      id_sous_commande: sousCommande.id,
      statut,
      description: details || `Statut mis à jour à ${statut}`
    });

    // 🧠 Vérification de l'état de confirmation de la commande
    const commande = sousCommande.commande;
    if (commande.etat_confirmation === "en_attente" && statut !== "en_attente") {
      await commande.update({ etat_confirmation: "confirmee" });

      await Tracking.create({
        id_sous_commande: sousCommande.id,
        statut: "confirmee",
        description: `La commande ${commande.code} a été confirmée automatiquement suite à la mise à jour du tracking.`
      });
    }

    // 🔄 Mettre à jour le statut global de la commande
    await majStatutCommande(sousCommande.id_commande);

    // 💰 Si livrée → mise à jour du stock + soldes
    const statutNormalise = statut.toLowerCase().trim().replace(/é/g, 'e');

    if (statutNormalise === "livree") {
      for (const ligne of sousCommande.lignes) {
        const produit = ligne.produit;
        const oldStock = produit.stock;    
        const newStock = oldStock - ligne.quantite;
        
        await produit.update({ stock: newStock });    
        await createStockNotification(produit, oldStock, newStock); // ✅ Corrigé
      }
      await mettreAJourSoldesAvecFrais(sousCommande);
    }

    // 💰💥 NOUVEAU : Si statut devient "Colis retourné" → débiter le vendeur de 4 TND + réintégrer le stock
    if (statut && statut.toLowerCase().trim() === "colis retourné") {
      // Vérifier que ce n'était pas déjà "Colis retourné" (éviter double débit)
      if (ancienStatut.toLowerCase().trim() !== "colis retourné") {
        // 1. Débiter le vendeur
        await debiterVendeurPourRetour(sousCommande);
        
        // 2. Réintégrer le stock
        await reintegrerStockPourRetour(sousCommande);
      }
    }

    // Si annulée → réintégrer le stock
    if (statut === "annulee" ) {
      for (const ligne of sousCommande.lignes) {
        await Produit.increment('stock', {
          by: ligne.quantite,
          where: { id: ligne.id_produit }
        });
        
        // Si c'est une variation, incrémenter aussi le stock de la variation
        if (ligne.id_variation) {
          await Variation.increment('stock', {
            by: ligne.quantite,
            where: { id: ligne.id_variation }
          });
        }
      }
    }

    res.status(200).json({ 
      message: "Statut mis à jour avec succès", 
      sousCommande 
    });

  } catch (error) {
    logger.error("Erreur mise à jour tracking :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Fonction pour réintégrer le stock lorsque le colis est retourné
const reintegrerStockPourRetour = async (sousCommande) => {
  try {
    logger.info(`🔄 Réintégration du stock pour le retour de la sous-commande ${sousCommande.code}`);
    
    for (const ligne of sousCommande.lignes) {
      const produit = ligne.produit;
      const variation = ligne.variation;
      const quantite = ligne.quantite;
      
      // 🔄 Incrémenter le stock du produit
      if (produit) {
        await Produit.increment('stock', {
          by: quantite,
          where: { id: ligne.id_produit }
        });
        
        const produitApres = await Produit.findByPk(ligne.id_produit);
        logger.info(`✅ Stock produit "${produit.nom}" réintégré: +${quantite} unités. Nouveau stock: ${produitApres.stock}`);
      }
      
      // 🔄 Incrémenter le stock de la variation si elle existe
      if (variation && ligne.id_variation) {
        await Variation.increment('stock', {
          by: quantite,
          where: { id: ligne.id_variation }
        });
        
        const variationApres = await Variation.findByPk(ligne.id_variation);
        logger.info(`✅ Stock variation "${variation.couleur || ''}/${variation.taille || ''}" réintégré: +${quantite} unités. Nouveau stock: ${variationApres.stock}`);
      }
    }
    
    logger.info(`🎉 Stock réintégré avec succès pour la sous-commande ${sousCommande.code}`);
    
  } catch (error) {
    logger.error("❌ Erreur lors de la réintégration du stock pour retour:", error);
    throw error;
  }
};

// Fonction pour débiter le vendeur lorsque le colis est retourné
const debiterVendeurPourRetour = async (sousCommande) => {
  try {
    const vendeur = await Vendeur.findOne({ 
      where: { id_user: sousCommande.commande.id_vendeur } 
    });
    
    if (!vendeur) {
      logger.error(`Vendeur non trouvé pour l'utilisateur ${sousCommande.commande.id_vendeur}`);
      return;
    }

    const montantDebit = 4.00; // 4 TND
    
    // Vérifier que le vendeur a suffisamment de solde
    const soldeActuel = parseFloat(vendeur.solde_portefeuille || 0);
    
    if (soldeActuel < montantDebit) {
      logger.warn(`Solde insuffisant pour le vendeur ${vendeur.id_user}: ${soldeActuel} TND < ${montantDebit} TND`);
      // Vous pouvez décider de débiter quand même (solde négatif) ou de ne pas débiter
      // Pour cet exemple, on débite même si solde insuffisant
    }
    
    // Débiter le solde
    const nouveauSolde = soldeActuel - montantDebit;
    await vendeur.update({ solde_portefeuille: nouveauSolde });

    // Créer une transaction pour tracer le débit
    await Transaction.create({
      id_utilisateur: sousCommande.commande.id_vendeur,
      code_transaction: `RET-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      type: "debit",
      montant: montantDebit,
      meta: {
        type: "frais_retour_colis",
        commande_id: sousCommande.commande.id,
        sous_commande_id: sousCommande.id,
        code_sousCommande: sousCommande.code,
        code_commande: sousCommande.commande.code,
        description: `Frais de gestion pour colis retourné (sous-commande ${sousCommande.code})`
      }
    });

    await notifierVendeurRetour(sousCommande.commande.id_vendeur, montantDebit, sousCommande.code);

    logger.info(`✅ Vendeur ${sousCommande.commande.id_vendeur} débité de ${montantDebit} TND pour colis retourné. Nouveau solde: ${nouveauSolde} TND`);

  } catch (error) {
    logger.error("❌ Erreur lors du débit du vendeur pour colis retourné:", error);
    throw error;
  }
};

const notifierVendeurRetour = async (vendeurId, montant, sousCommandeCode) => {
  try {
    // Assurez-vous d'importer le modèle Notification si nécessaire
    // import { Notification } from "../models/index.js";
    
    // Créer une notification dans votre système
    await Notification.create({
      id_utilisateur: vendeurId,
      type: "debit_retour",
      titre: "Débit pour colis retourné",
      message: `Vous avez été débité de ${montant} TND pour le retour de la sous-commande ${sousCommandeCode}`,
      lu: false
    });
    
    logger.info(`📩 Notification envoyée au vendeur ${vendeurId} pour débit retour`);
  } catch (error) {
    logger.error("❌ Erreur lors de la création de la notification:", error);
    // Ne pas bloquer le processus si la notification échoue
  }
};
const mettreAJourSoldesAvecFrais = async (sousCommande) => {
  try {
    // 1️⃣ Calcul du profit vendeur & montant fournisseur
    let profitBrutVendeur = 0;
    let montantBrutFournisseur = 0;

    for (const ligne of sousCommande.lignes) {
      profitBrutVendeur += (ligne.prix_vente - ligne.prix_gros) * ligne.quantite;
      montantBrutFournisseur += ligne.prix_gros * ligne.quantite;
    }

    // 2️⃣ Frais plateforme (10% pour chaque acteur)
    const fraisPlateforme = montantBrutFournisseur * 0.10;

    // 3️⃣ Gains nets
    const gainNetVendeur = profitBrutVendeur - fraisPlateforme;
    const gainNetFournisseur = montantBrutFournisseur - fraisPlateforme;

    // 🔹 METTRE À JOUR VENDEUR
    const vendeur = await Vendeur.findOne({ where: { id_user: sousCommande.commande.id_vendeur } });
    if (vendeur && gainNetVendeur > 0) {
      const nouveauSolde = parseFloat(vendeur.solde_portefeuille || 0) + gainNetVendeur;
      await vendeur.update({ solde_portefeuille: nouveauSolde });

      await Transaction.create({
        id_utilisateur: sousCommande.commande.id_vendeur,
        code_transaction: `CMD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        type: "credit",
        montant: gainNetVendeur,
        meta: {
          type: "profit_vente_net",
          commande_id: sousCommande.commande.id,
          sous_commande_id: sousCommande.id,
          code_sousCommande: sousCommande.code,
          profit_brut: profitBrutVendeur,
          frais_plateforme: fraisPlateforme,
          description: `Profit net vendeur pour commande ${sousCommande.commande.code}`
        }
      });
    }

    // 🔹 METTRE À JOUR FOURNISSEUR
    const fournisseur = await Fournisseur.findOne({ where: { id_user: sousCommande.id_fournisseur } });
    if (fournisseur && gainNetFournisseur > 0) {
      const nouveauSolde = parseFloat(fournisseur.solde_portefeuille || 0) + gainNetFournisseur;
      await fournisseur.update({ solde_portefeuille: nouveauSolde });

      await Transaction.create({
        id_utilisateur: sousCommande.id_fournisseur,
        code_transaction: `CMD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        type: "credit",
        montant: gainNetFournisseur,
        meta: {
          type: "vente_produit_net",
          commande_id: sousCommande.commande.id,
          sous_commande_id: sousCommande.id,
          code_sousCommande: sousCommande.code,
          montant_brut: montantBrutFournisseur,
          frais_plateforme: fraisPlateforme,
          description: `Vente nette fournisseur pour commande ${sousCommande.commande.code}`
        }
      });
    }

    logger.info(`✅ Gains enregistrés : vendeur +${gainNetVendeur} TND, fournisseur +${gainNetFournisseur} TND`);

  } catch (error) {
    logger.error("❌ Erreur mise à jour soldes avec frais:", error);
    throw error;
  }
};

export async function majStatutCommande(id_commande) {
  const sousCommandes = await SousCommande.findAll({ where: { id_commande } });
  if (!sousCommandes.length) return;

  const statuts = sousCommandes.map(sc => sc.statut);

  let etat_commande = "en_attente";

  if (statuts.every(s => s === "en_attente")) etat_commande = "en_attente";
  else if (statuts.every(s => s === "livree")) etat_commande = "livree";
  else if (statuts.every(s => s === "annulee")) etat_commande = "annulee";
  else if (statuts.some(s => s === "en_cours_livraison" || s === "emballage_en_cours")) etat_commande = "en_cours";
  else if (statuts.some(s => s === "livree") && statuts.some(s => s !== "livree")) etat_commande = "partiellement_livree";
  else if (statuts.some(s => s === "annulee") && statuts.some(s => s !== "annulee")) etat_commande = "partiellement_annulee";

  await Commande.update({ etat_commande }, { where: { id: id_commande } });
}

// Obtenir les produits du vendeur
export const obtenirProduitsVendeur = async (req, res) => {
  try {
    logger.info("=== DEBUT obtenirProduitsVendeur ===");
    logger.info("User ID:", req.user?.id);
    logger.info("Query params:", req.query);
    
    const id_vendeur = req.user?.id;
    
    if (!id_vendeur) {
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non authentifié" 
      });
    }

    const { search, page = 1, limit = 20 } = req.query;
    
    // Construction de la clause WHERE pour le produit
    const produitWhere = {};
    if (search) {
      produitWhere[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }

    logger.info("Produit where clause:", produitWhere);

    // 1. D'abord, trouver tous les MesProduit du vendeur
    const mesProduits = await MesProduit.findAll({
      where: { id_vendeur },
      attributes: ['id_produit'],
      transaction: req.transaction || undefined
    });

    const produitIds = mesProduits.map(mp => mp.id_produit);
    
    if (produitIds.length === 0) {
      return res.json({ 
        produits: [], 
        total: 0, 
        page: parseInt(page), 
        totalPages: 0 
      });
    }

    // 2. Filtrer les produits par les IDs des MesProduit
    const produitWhereWithIds = {
      ...produitWhere,
      id: { [Op.in]: produitIds }
    };

    // 3. Compter d'abord le total
    const totalProduits = await Produit.count({
      where: produitWhereWithIds,
      transaction: req.transaction || undefined
    });

    // 4. Récupérer les produits avec toutes les relations
    const produits = await Produit.findAll({
      where: produitWhereWithIds,
      include: [
        {
          model: User,
          as: "user",
          attributes: ['id', 'nom', 'email', 'telephone']
        },
        {
          model: Fournisseur,
          as: "fournisseur",
          attributes: ['id_user', 'identifiant_public', 'solde_portefeuille']
        },
        {
          model: Variation,
          as: "variations",
          attributes: ['id', 'couleur', 'taille', 'prix_gros', 'stock'],
          where: { stock: { [Op.gt]: 0 } }, // Seulement les variations avec stock > 0
          required: false
        },
        {
          model: Media,
          as: "medias",
          attributes: ['id', 'type', 'url', 'principale'],
          limit: 1,
          order: [['principale', 'DESC'], ['createdAt', 'ASC']],
          required: false
        },
        {
          model: Categorie,
          as: "categorie",
          attributes: ['id', 'nom'],
          required: false
        }
      ],
      order: [['nom', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      transaction: req.transaction || undefined
    });

    logger.info("Produits trouvés:", produits.length);
    logger.info("Total produits:", totalProduits);

    // Formater la réponse
    const produitsFormates = produits.map(produit => {
      const produitJSON = produit.toJSON();
      
      // Calculer le stock total (produit + variations)
      let stockTotal = produitJSON.stock || 0;
      if (produitJSON.variations && produitJSON.variations.length > 0) {
        stockTotal = produitJSON.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
      }

      return {
        id: produitJSON.id,
        code: produitJSON.code,
        nom: produitJSON.nom,
        description: produitJSON.description,
        prix_gros: parseFloat(produitJSON.prix_gros) || 0,
        stock: stockTotal,
        rupture_stock: stockTotal <= 5,
        id_fournisseur: produitJSON.id_fournisseur,
        id_categorie: produitJSON.id_categorie,
        id_externe: produitJSON.id_externe,
        user: produitJSON.user,
        fournisseur: produitJSON.fournisseur,
        variations: produitJSON.variations || [],
        medias: produitJSON.medias || [],
        categorie: produitJSON.categorie
      };
    });

    logger.info("Produits formatés:", produitsFormates.length);

    res.json({ 
      success: true,
      produits: produitsFormates, 
      total: totalProduits, 
      page: parseInt(page), 
      totalPages: Math.ceil(totalProduits / limit) 
    });

    logger.info("=== FIN obtenirProduitsVendeur ===");

  } catch (error) {
    logger.error("❌ Erreur produits vendeur:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors du chargement des produits", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const getClientByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const client = await Client.findOne({ where: { email } });
    if (!client) return res.status(404).json({ message: "Client non trouvé" });
    res.json({ client });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

export const supprimerCommandes = async (req, res) => { 
  try {
    const { ids } = req.body;
    const id_vendeur = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Aucune commande sélectionnée pour suppression." });
    }

    const commandes = await Commande.findAll({
      where: {
        id: ids,
        id_vendeur,
      },
      include: [{ model: SousCommande, as: "sous_commandes" }],
    });

    if (commandes.length === 0) {
      return res.status(404).json({ message: "Aucune commande trouvée pour ce vendeur." });
    }

    // Récupérer tous les ID clients concerné
    const idsClients = commandes.map(c => c.id_client);

    // 🔥 Supprimer les sous-commandes et les lignes
    for (const commande of commandes) {
      for (const sousCommande of commande.sous_commandes) {

        await LigneCommande.destroy({ where: { id_sous_commande: sousCommande.id } });
        await Tracking.destroy({ where: { id_sous_commande: sousCommande.id } });
        await SousCommande.destroy({ where: { id: sousCommande.id } });
      }

      // Supprimer la commande principale
      await Commande.destroy({ where: { id: commande.id } });
    }

    // 🔥 Supprimer les clients qui n'ont plus aucune commande
    for (const idClient of idsClients) {
      const countCommandes = await Commande.count({ where: { id_client: idClient } });

      if (countCommandes === 0) {
        await Client.destroy({ where: { id: idClient } });
      }
    }

    return res.status(200).json({
      message: `${commandes.length} commande(s) supprimée(s) avec succès.`,
    });

  } catch (error) {
    logger.error("Erreur suppression commandes:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la suppression des commandes",
      error: error.message,
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // récupéré grâce au middleware d’authentification

    const transactions = await Transaction.findAll({
      where: {
        id_utilisateur: userId,
        type: { [Op.in]: ["credit", "debit"] }, // ✅ ne garde que crédit & débit
      },
      order: [["cree_le", "DESC"]],
    });

    res.json(transactions);
  } catch (error) {
    logger.error("Erreur lors de la récupération des transactions:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
