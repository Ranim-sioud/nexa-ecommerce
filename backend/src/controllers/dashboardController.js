import logger from '../config/logger.js';
import { Op, fn, col, literal } from "sequelize";
import {
  Commande,
  SousCommande,
  LigneCommande,
  Produit,
  Client,
  Vendeur,
  MesProduit,
  Media,
} from "../models/index.js";
import sequelize from "../config/database.js";

// ============================
// 🔹 Fonctions de base avec gestion d'erreur améliorée
// ============================
export const getProfit = async (userId, dateFilter = null) => {
  try {
    const whereCondition = {};
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const lignes = await LigneCommande.findAll({
      include: [
        {
          model: SousCommande,
          as: "sous_commande",
          required: true,
          where: { statut: "livree" },
          include: [
            {
              model: Commande,
              as: "commande",
              where: { id_vendeur: userId },
              attributes: [],
            },
          ],
        },
      ],
      where: whereCondition,
      attributes: ["prix_vente", "prix_gros", "quantite"],
    });

    let profit = 0;
    for (const ligne of lignes) {
      const fraisPlateforme = (ligne.prix_gros * ligne.quantite) * 0.10;
      const marge = ((ligne.prix_vente - ligne.prix_gros) * ligne.quantite) - fraisPlateforme;
      profit += marge;
    }

    return Number(profit.toFixed(2));
  } catch (error) {
    logger.error("Erreur dans getProfit:", error);
    return 0;
  }
};

export const getCA = async (userId, dateFilter = null) => {
  try {
    const whereCondition = {};
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const lignes = await LigneCommande.findAll({
      include: [
        {
          model: SousCommande,
          as: "sous_commande",
          required: true,
          where: { statut: "livree" },
          include: [
            {
              model: Commande,
              as: "commande",
              where: { id_vendeur: userId },
              attributes: [],
            },
          ],
        },
      ],
      where: whereCondition,
      attributes: ["prix_vente", "quantite"],
    });

    let totalCA = 0;
    for (const ligne of lignes) {
      totalCA += ligne.prix_vente * ligne.quantite;
    }
    return Number(totalCA.toFixed(2));
  } catch (error) {
    logger.error("Erreur dans getCA:", error);
    return 0;
  }
};

export const getProfitEnCours = async (userId, dateFilter = null) => {
  try {
    const whereCondition = {};
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const lignes = await LigneCommande.findAll({
      include: [
        {
          model: SousCommande,
          as: "sous_commande",
          required: true,
          where: { statut: "en_cours_livraison" },
          include: [
            {
              model: Commande,
              as: "commande",
              where: { id_vendeur: userId },
              attributes: [],
            },
          ],
        },
      ],
      where: whereCondition,
      attributes: ["prix_vente", "prix_gros", "quantite"],
    });

    let profit = 0;
    for (const ligne of lignes) {
      const fraisPlateforme = (ligne.prix_gros * ligne.quantite) * 0.10;
      const marge = ((ligne.prix_vente - ligne.prix_gros) * ligne.quantite) - fraisPlateforme;
      profit += marge;
    }
    return Number(profit.toFixed(2));
  } catch (error) {
    logger.error("Erreur dans getProfitEnCours:", error);
    return 0;
  }
};

export const getPenalitesRetour = async (userId, dateFilter = null) => {
  try {
    const penalite = 5;
    const whereCondition = { 
      statut: { [Op.in]: ["Colis retourné", "Retournée payée", "annulée"] }
    };
    
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const retournees = await SousCommande.count({
      include: [
        {
          model: Commande,
          as: "commande",
          where: { id_vendeur: userId },
          attributes: [],
        },
      ],
      where: whereCondition,
    });

    return retournees * penalite;
  } catch (error) {
    logger.error("Erreur dans getPenalitesRetour:", error);
    return 0;
  }
};

// ============================
// 🔹 2️⃣ Récupérer les statistiques principales
// ============================
const getMainStats = async (userId, dateFilter = null) => {
  try {
    const commandeWhere = { id_vendeur: userId };
    const sousCommandeWhere = {};

    if (dateFilter) {
      sousCommandeWhere.cree_le = dateFilter;
      commandeWhere.cree_le = dateFilter;
    }

    const [livrees, enCours, retournees, annuleesSousCommandes] = await Promise.all([
      SousCommande.count({
        include: [{ model: Commande, as: "commande", where: { id_vendeur: userId }, attributes: [] }],
        where: { 
          statut: { [Op.in]: ["livree", "Livrée payée"] },
          ...sousCommandeWhere
        }
      }),
      SousCommande.count({
        include: [{ model: Commande, as: "commande", where: { id_vendeur: userId }, attributes: [] }],
        where: { 
          statut: "en_cours_livraison",
          ...sousCommandeWhere
        }
      }),
      SousCommande.count({
        include: [{ model: Commande, as: "commande", where: { id_vendeur: userId }, attributes: [] }],
        where: { 
          statut: { [Op.in]: ["Colis retourné", "Retournée payée"] },
          ...sousCommandeWhere
        }
      }),
      SousCommande.count({
        include: [{ model: Commande, as: "commande", where: { id_vendeur: userId }, attributes: [] }],
        where: { 
          statut: "annulee",
          ...sousCommandeWhere
        }
      }),
    ]);

    const [totalCommandes, nonConfirmees, annuleesCommandes] = await Promise.all([
      Commande.count({ where: commandeWhere }),
      Commande.count({ where: { ...commandeWhere, etat_confirmation: "en_attente" } }),
      Commande.count({ where: { ...commandeWhere, etat_confirmation: "annulee" } }),
    ]);

    const annulees = annuleesCommandes + annuleesSousCommandes;
    const livreesPayees = await SousCommande.count({
      include: [{ model: Commande, as: "commande", where: { id_vendeur: userId }, attributes: [] }],
      where: { 
        statut: "Livrée payée",
        ...sousCommandeWhere
      },
    });
    const livreesNonPayees = livrees - livreesPayees;
    
    const totalLivreRetour = livrees + retournees;
    const tauxRetour = totalLivreRetour > 0 
      ? Number(((retournees / totalLivreRetour) * 100).toFixed(2))
      : 0;

    return {
      totalCommandes,
      livrees,
      enCours,
      retournees,
      nonConfirmees,
      annulees,
      livreesPayees,
      livreesNonPayees,
      tauxRetour,
    };
  } catch (error) {
    logger.error("Erreur dans getMainStats:", error);
    return {
      totalCommandes: 0,
      livrees: 0,
      enCours: 0,
      retournees: 0,
      nonConfirmees: 0,
      annulees: 0,
      livreesPayees: 0,
      livreesNonPayees: 0,
      tauxRetour: 0,
    };
  }
};

// ============================
// 🔹 3️⃣ Données mensuelles (6 derniers mois)
// ============================
const getMonthlyData = async (userId) => {
  const now = new Date();

  // 📆 On calcule la date de départ : il y a 5 mois avant le mois courant
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 🧾 Récupérer toutes les lignes de commande depuis startDate
  const lignes = await LigneCommande.findAll({
    include: [
      {
        model: SousCommande,
        as: "sous_commande",
        required: true,
        include: [
          {
            model: Commande,
            as: "commande",
            where: { id_vendeur: userId },
            attributes: ["cree_le"],
          },
        ],
      },
    ],
    where: { cree_le: { [Op.gte]: startDate } },
    attributes: ["prix_vente", "prix_gros", "quantite", "cree_le"],
  });

  // 🧮 Calcul des profits et commandes réels
  const monthlyData = {};
  for (const ligne of lignes) {
    const d = new Date(ligne.cree_le);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const fraisPlateforme = (ligne.prix_gros * ligne.quantite) * 0.10;
    const profit = ((ligne.prix_vente - ligne.prix_gros) * ligne.quantite) - fraisPlateforme;

    if (!monthlyData[key]) monthlyData[key] = { profits: 0, commandes: 0 };
    monthlyData[key].profits += profit;
    monthlyData[key].commandes += 1;
  }

  // 🗓️ Construire les 6 derniers mois même si 0 données
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const moisNom = date.toLocaleString("fr", { month: "short" });

    result.push({
      name: moisNom,
      profits: monthlyData[key] ? Number(monthlyData[key].profits.toFixed(2)) : 0,
      commandes: monthlyData[key] ? monthlyData[key].commandes : 0,
    });
  }

  return result;
};

// 📆 --- Données quotidiennes (10 derniers jours)
const getDailyData = async (userId) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 9);

  const lignes = await LigneCommande.findAll({
    include: [
      {
        model: SousCommande,
        as: "sous_commande",
        required: true,
        include: [
          {
            model: Commande,
            as: "commande",
            where: { id_vendeur: userId },
            attributes: ["cree_le"],
          },
        ],
      },
    ],
    where: { cree_le: { [Op.gte]: startDate } },
    attributes: ["prix_vente", "prix_gros", "quantite", "cree_le"],
  });

  // initialiser les 10 jours avec 0
  const dailyData = {};
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyData[key] = { profits: 0, commandes: 0 };
  }

  // remplir avec les vraies ventes
  for (const ligne of lignes) {
    const date = new Date(ligne.cree_le).toISOString().split("T")[0];
    const fraisPlateforme = (ligne.prix_gros * ligne.quantite) * 0.10;
    const profit = ((ligne.prix_vente - ligne.prix_gros) * ligne.quantite) - fraisPlateforme;
    dailyData[date].profits += profit;
    dailyData[date].commandes += 1;
  }

  return Object.entries(dailyData).map(([date, val]) => ({
    date,
    name: new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    }),
    profits: Number(val.profits.toFixed(2)),
    commandes: val.commandes,
  }));
};
// ============================
// 🔹 4️⃣ Produits les plus vendus
// ============================
const getTopProducts = async (userId, dateFilter = null) => {
  try {
    const mesProduits = await MesProduit.findAll({
      where: { id_vendeur: userId },
      attributes: ["id_produit"],
    });

    const idsProduitsFavoris = mesProduits.map((p) => p.id_produit);

    if (idsProduitsFavoris.length === 0) {
      return [];
    }

    // APPROCHE SIMPLIFIÉE - Deux requêtes séparées
    logger.info("IDs produits favoris:", idsProduitsFavoris);

    // 1. Récupérer les ventes par produit
    const whereCondition = {
      id_produit: { [Op.in]: idsProduitsFavoris }
    };
    
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const ventesProduits = await LigneCommande.findAll({
      attributes: [
        "id_produit",
        [fn("SUM", col("quantite")), "ventes"],
      ],
      include: [
        {
          model: SousCommande,
          as: "sous_commande",
          attributes: [],
          required: true,
          include: [
            {
              model: Commande,
              as: "commande",
              where: { id_vendeur: userId },
              attributes: [],
              required: true
            },
          ],
        },
      ],
      where: whereCondition,
      group: ["LigneCommande.id_produit"],
      order: [[literal("ventes"), "DESC"]],
      limit: 50,
      raw: true // Important pour éviter les problèmes de sérialisation
    });

    logger.info("Ventes produits trouvées:", ventesProduits.length);

    if (ventesProduits.length === 0) {
      return [];
    }

    // 2. Récupérer les détails des produits avec leurs médias
    const idsProduitsVendus = ventesProduits.map(v => v.id_produit);
    
    const produitsDetails = await Produit.findAll({
      where: { 
        id: { [Op.in]: idsProduitsVendus } 
      },
      include: [{
        model: Media,
        as: "medias",
        attributes: ["id", "url"],
        required: false
      }],
      attributes: ["id", "nom"]
    });

    logger.info("Détails produits trouvés:", produitsDetails.length);

    // 3. Combiner les données
    const result = ventesProduits.map(vente => {
      const produitDetail = produitsDetails.find(p => p.id === vente.id_produit);
      const medias = produitDetail?.medias || [];
      
      logger.info(`Produit ${vente.id_produit}:`, {
        nom: produitDetail?.nom,
        ventes: vente.ventes,
        mediasCount: medias.length
      });

      return {
        id: vente.id_produit,
        nom: produitDetail?.nom || "Produit inconnu",
        ventes: parseInt(vente.ventes, 10) || 0,
        medias: medias
      };
    });

    // Trier par ventes décroissantes
    result.sort((a, b) => b.ventes - a.ventes);

    logger.info("Résultat final:", result.length, "produits");
    return result;

  } catch (error) {
    logger.error("Erreur détaillée dans getTopProducts:", error);
    logger.error("Stack trace:", error.stack);
    return [];
  }
};

// ============================
// 🔹 5️⃣ Dernières commandes
// ============================
const getRecentOrders = async (userId, dateFilter = null) => {
  try {
    const whereCondition = { id_vendeur: userId };
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const commandes = await Commande.findAll({
      where: whereCondition,
      include: [{ model: Client, as: "client", attributes: ["prenom", "nom"] }],
      order: [["cree_le", "DESC"]],
      limit: 10,
    });

    return commandes.map((c) => ({
      id: c.id,
      client: `${c.client?.prenom || ""} ${c.client?.nom || ""}`.trim() || "Client inconnu",
      montant: c.total || 0,
      statut: c.etat_commande || "Inconnu",
      date: c.cree_le?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
    }));
  } catch (error) {
    logger.error("Erreur dans getRecentOrders:", error);
    return [];
  }
};

const getCommandesParSource = async (userId, dateFilter = null) => {
  try {
    const whereCondition = { id_vendeur: userId };
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    }

    const sources = await Commande.findAll({
      where: whereCondition,
      attributes: [
        'source',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['source'],
      order: [[literal('count'), 'DESC']],
    });

    if (!sources || sources.length === 0) {
      return [];
    }

    return sources.map(s => ({
      source: s.source || 'Inconnue', 
      count: parseInt(s.get('count'), 10) || 0
    }));
  } catch (error) {
    logger.error("Erreur dans getCommandesParSource:", error);
    return [];
  }
};

// ============================
// 🔹 6️⃣ Contrôleur principal (agrégation)
// ============================
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { dateDebut, dateFin } = req.query;

    // Validation des dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate, endDate;
    
    try {
      startDate = dateDebut ? new Date(dateDebut) : new Date(today);
      endDate = dateFin ? new Date(dateFin) : new Date(today);
      
      // Vérifier que les dates sont valides
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        startDate = new Date(today);
        endDate = new Date(today);
      }
      
      endDate.setHours(23, 59, 59, 999);
    } catch (dateError) {
      logger.error("Erreur de parsing des dates:", dateError);
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    }

    // Créer le filtre de date
    const dateFilter = { [Op.between]: [startDate, endDate] };

    logger.info(`Chargement dashboard pour userId: ${userId}, période: ${startDate.toISOString()} à ${endDate.toISOString()}`);

    const [
      profit, 
      CAffaire, 
      profitEnCours, 
      penalitesRetour, 
      mainStats, 
      monthlyData, 
      dailyData, 
      topProduits, 
      recentOrders, 
      commandesParSource
    ] = await Promise.all([
      getProfit(userId, dateFilter).catch(err => { logger.error("Error in getProfit:", err); return 0; }),
      getCA(userId, dateFilter).catch(err => { logger.error("Error in getCA:", err); return 0; }),
      getProfitEnCours(userId, dateFilter).catch(err => { logger.error("Error in getProfitEnCours:", err); return 0; }),
      getPenalitesRetour(userId, dateFilter).catch(err => { logger.error("Error in getPenalitesRetour:", err); return 0; }),
      getMainStats(userId, dateFilter).catch(err => { logger.error("Error in getMainStats:", err); return {}; }),
      getMonthlyData(userId).catch(err => { logger.error("Error in getMonthlyData:", err); return []; }),
      getDailyData(userId).catch(err => { logger.error("Error in getDailyData:", err); return []; }),
      getTopProducts(userId, dateFilter).catch(err => { logger.error("Error in getTopProducts:", err); return []; }),
      getRecentOrders(userId, dateFilter).catch(err => { logger.error("Error in getRecentOrders:", err); return []; }),
      getCommandesParSource(userId, dateFilter).catch(err => { logger.error("Error in getCommandesParSource:", err); return []; }),
    ]);

    res.json({
      cards: { 
        ...mainStats, 
        profit, 
        CAffaire, 
        profitEnCours, 
        penalitesRetour 
      },
      monthlyData,
      dailyData,
      topProduits,
      recentOrders,
      commandesParSource,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    logger.error("Erreur getDashboardStats:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};