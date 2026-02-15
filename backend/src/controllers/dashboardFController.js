import { Op, fn, col, literal } from "sequelize";
import {
  Commande,
  SousCommande,
  LigneCommande,
  Produit,
  Client,
  Media,
  Pickup,
} from "../models/index.js";

// --- UTIL : convertit (start,end) en filtre Sequelize between
const makeDateFilter = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  return { [Op.between]: [startDate, endDate] };
};

// ============================
// Fonctions réutilisables CORRIGÉES
// ============================

export const getProfit = async (fournisseurId, dateFilter = null) => {
  try {
    const whereSousCommande = { 
      id_fournisseur: fournisseurId,
      statut: { [Op.in]: ["livree", "Livrée payée"] }
    };
    
    if (dateFilter) whereSousCommande.cree_le = dateFilter;

    // Approche simplifiée sans jointures complexes
    const sousCommandes = await SousCommande.findAll({
      where: whereSousCommande,
      attributes: ['id'],
      raw: true
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);

    if (sousCommandeIds.length === 0) return 0;

    const lignes = await LigneCommande.findAll({
      where: {
        id_sous_commande: { [Op.in]: sousCommandeIds }
      },
      attributes: ["prix_vente", "prix_gros", "quantite"],
      raw: true
    });

    let profit = 0;
    for (const l of lignes) {
      const fraisPlateforme = (l.prix_gros * l.quantite) * 0.10;
      const marge = ((l.prix_vente - l.prix_gros) * l.quantite) - fraisPlateforme;
      profit += marge;
    }
    return Number(profit.toFixed(2));
  } catch (error) {
    console.error("Erreur dans getProfit:", error);
    return 0;
  }
};

export const getCA = async (fournisseurId, dateFilter = null) => {
  try {
    const whereSousCommande = { 
      id_fournisseur: fournisseurId,
      statut: { [Op.in]: ["livree", "Livrée payée"] }
    };
    
    if (dateFilter) whereSousCommande.cree_le = dateFilter;

    const sousCommandes = await SousCommande.findAll({
      where: whereSousCommande,
      attributes: ['id'],
      raw: true
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);

    if (sousCommandeIds.length === 0) return 0;

    const lignes = await LigneCommande.findAll({
      where: {
        id_sous_commande: { [Op.in]: sousCommandeIds }
      },
      attributes: ["prix_gros", "quantite"],
      raw: true
    });

    let total = 0;
    for (const l of lignes) total += l.prix_gros * l.quantite;
    console.log('total::', total)
    return Number(total.toFixed(2));
  } catch (error) {
    console.error("Erreur dans getCA:", error);
    return 0;
  }
};

export const getCAEnCours = async (fournisseurId, dateFilter = null) => {
  try {
    const whereCondition = {
      id_fournisseur: fournisseurId,
      statut: { [Op.in]: ["en_cours_livraison", "en_attente_enlevement", "Colis enlevé", "emballage_en_cours",
      "Tentative de confirmation 1", "Tentative de confirmation 2", "Tentative de confirmation 3", "Tentative de confirmation 4", "Tentative de confirmation 5",] }
    };
    
    if (dateFilter) whereCondition.cree_le = dateFilter;

    const sousCommandes = await SousCommande.findAll({
      where: whereCondition,
      attributes: ['id'],
      raw: true
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);

    if (sousCommandeIds.length === 0) return 0;

    const lignes = await LigneCommande.findAll({
      where: {
        id_sous_commande: { [Op.in]: sousCommandeIds }
      },
      attributes: ["prix_gros", "quantite"],
      raw: true
    });

    let caTotal = 0;
    for (const ligne of lignes) {
      caTotal += ligne.prix_gros * ligne.quantite;
    }
    console.log("caTotal", caTotal)
    return Number(caTotal.toFixed(2));
  } catch (error) {
    console.error("Erreur dans getCAEnCours:", error);
    return 0;
  }
};

export const getChiffreAffairePotentiel = async (fournisseurId, dateFilter = null) => {
  try {
    // On cherche les sous-commandes du fournisseur
    const whereSousCommande = { id_fournisseur: fournisseurId };
    if (dateFilter) whereSousCommande.cree_le = dateFilter;

    // On inclut les commandes associées, mais uniquement celles dont l’état de confirmation est "en_attente"
    const sousCommandes = await SousCommande.findAll({
      where: whereSousCommande,
      include: [
        {
          model: Commande,
          as: "commande",
          where: { etat_confirmation: "en_attente" },
          attributes: ["id", "etat_confirmation"],
        },
      ],
      attributes: ["id"],
      raw: true,
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);
    if (sousCommandeIds.length === 0) return 0;

    // On calcule le chiffre d’affaires potentiel sur les lignes correspondantes
    const lignes = await LigneCommande.findAll({
      where: { id_sous_commande: { [Op.in]: sousCommandeIds } },
      attributes: ["prix_vente", "quantite"],
      raw: true,
    });

    // Total des ventes potentielles
    const chiffreAffaire = lignes.reduce(
      (sum, l) => sum + parseFloat(l.prix_vente) * l.quantite,
      0
    );

    return Number(chiffreAffaire.toFixed(2));
  } catch (error) {
    console.error("Erreur dans getChiffreAffairePotentiel:", error);
    return 0;
  }
};
export const getPenalitesRetour = async (fournisseurId, dateFilter = null, penalite = 5) => {
  try {
    const whereSC = {
      id_fournisseur: fournisseurId,
      statut: { [Op.in]: ["Colis retourné", "Retournée payée", "annulee"] },
    };
    if (dateFilter) whereSC.cree_le = dateFilter;

    const nb = await SousCommande.count({
      where: whereSC,
    });
    return nb * penalite;
  } catch (error) {
    console.error("Erreur dans getPenalitesRetour:", error);
    return 0;
  }
};

const getMainStats = async (fournisseurId, dateFilter = null) => {
  try {
    const whereBase = { id_fournisseur: fournisseurId };
    if (dateFilter) whereBase.cree_le = dateFilter;

    // Récupérer toutes les sous-commandes pour les statistiques
    const toutesSousCommandes = await SousCommande.findAll({
      where: whereBase,
      raw: true
    });

    // Compter par statut
    const livrees = toutesSousCommandes.filter(sc => 
      ["livree", "Livrée payée"].includes(sc.statut)
    ).length;
    
    const enCours = toutesSousCommandes.filter(sc => 
      ["en_cours_livraison", "en_attente_enlevement", "Colis enlevé"].includes(sc.statut)
    ).length;
    
    const retournees = toutesSousCommandes.filter(sc => 
      ["Colis retourné", "Retournée payée"].includes(sc.statut)
    ).length;
    
    const annuleesSous = toutesSousCommandes.filter(sc => 
      sc.statut === "annulee"
    ).length;
    
    const livreesPayees = toutesSousCommandes.filter(sc => 
      ["livree", "Livrée payée"].includes(sc.statut)
    ).length;

    // Compter les commandes uniques
    const commandeIds = [...new Set(toutesSousCommandes.map(sc => sc.id_commande))];
    
    const commandes = await Commande.findAll({
      where: { 
        id: { [Op.in]: commandeIds }
      },
      raw: true
    });

    const totalCommandes = commandes.length;
    const nonConfirmees = commandes.filter(c => c.etat_confirmation === "en_attente").length;
    const annuleesCommandes = commandes.filter(c => c.etat_confirmation === "annulee").length;

    const livreesNonPayees = livrees - livreesPayees;
    const totalLivreRetour = livrees + retournees;
    const tauxRetour = totalLivreRetour > 0 ? Number(((retournees / totalLivreRetour) * 100).toFixed(2)) : 0;

    return {
      totalCommandes,
      livrees,
      enCours,
      retournees,
      nonConfirmees,
      annulees: annuleesCommandes + annuleesSous,
      livreesPayees,
      livreesNonPayees,
      tauxRetour,
    };
  } catch (error) {
    console.error("Erreur dans getMainStats:", error);
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

const getMonthlyData = async (fournisseurId, dateFilter = null) => {
  try {
    const now = new Date();
    const startDateDefault = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    let whereCondition = { id_fournisseur: fournisseurId };
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    } else {
      whereCondition.cree_le = { [Op.gte]: startDateDefault };
    }

    // Récupérer les sous-commandes
    const sousCommandes = await SousCommande.findAll({
      where: whereCondition,
      attributes: ['id', 'cree_le'],
      raw: true
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);

    if (sousCommandeIds.length === 0) {
      // Retourner des données vides pour les 6 derniers mois
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const moisNom = date.toLocaleString("fr-FR", { month: "short" });
        result.push({
          name: moisNom,
          profits: 0,
          commandes: 0,
        });
      }
      return result;
    }

    // Récupérer les lignes de commande
    const lignes = await LigneCommande.findAll({
      where: {
        id_sous_commande: { [Op.in]: sousCommandeIds }
      },
      attributes: ["id_sous_commande", "prix_vente", "prix_gros", "quantite"],
      raw: true
    });

    // Créer un mapping des dates des sous-commandes
    const sousCommandeDates = {};
    sousCommandes.forEach(sc => {
      sousCommandeDates[sc.id] = sc.cree_le;
    });

    const monthlyData = {};
    
    for (const l of lignes) {
      const dateSousCommande = sousCommandeDates[l.id_sous_commande];
      if (!dateSousCommande) continue;
      
      const d = new Date(dateSousCommande);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      
      const fraisPlateforme = (l.prix_gros * l.quantite) * 0.10;
      const profit = ((l.prix_vente - l.prix_gros) * l.quantite) - fraisPlateforme;
      
      monthlyData[key] = monthlyData[key] || { profits: 0, commandes: 0 };
      monthlyData[key].profits += profit;
    }

    // Compter les commandes par mois
    sousCommandes.forEach(sc => {
      const d = new Date(sc.cree_le);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[key] = monthlyData[key] || { profits: 0, commandes: 0 };
      monthlyData[key].commandes += 1;
    });

    // Construire le résultat pour les 6 derniers mois
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const moisNom = date.toLocaleString("fr-FR", { month: "short" });
      result.push({
        name: moisNom,
        profits: monthlyData[key] ? Number(monthlyData[key].profits.toFixed(2)) : 0,
        commandes: monthlyData[key] ? monthlyData[key].commandes : 0,
      });
    }

    return result;
  } catch (error) {
    console.error("Erreur dans getMonthlyData:", error);
    // Retourner des données vides en cas d'erreur
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisNom = date.toLocaleString("fr-FR", { month: "short" });
      result.push({
        name: moisNom,
        profits: 0,
        commandes: 0,
      });
    }
    return result;
  }
};

const getDailyData = async (fournisseurId, dateFilter = null) => {
  try {
    const now = new Date();
    const startDateDefault = new Date(now);
    startDateDefault.setDate(now.getDate() - 9);
    startDateDefault.setHours(0, 0, 0, 0);

    let whereCondition = { id_fournisseur: fournisseurId };
    if (dateFilter) {
      whereCondition.cree_le = dateFilter;
    } else {
      whereCondition.cree_le = { [Op.gte]: startDateDefault };
    }

    // Récupérer les sous-commandes
    const sousCommandes = await SousCommande.findAll({
      where: whereCondition,
      attributes: ['id', 'cree_le'],
      raw: true
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);

    // Récupérer les lignes de commande
    const lignes = await LigneCommande.findAll({
      where: {
        id_sous_commande: { [Op.in]: sousCommandeIds }
      },
      attributes: ["id_sous_commande", "prix_vente", "prix_gros", "quantite"],
      raw: true
    });

    // Créer un mapping des dates des sous-commandes
    const sousCommandeDates = {};
    sousCommandes.forEach(sc => {
      sousCommandeDates[sc.id] = sc.cree_le;
    });

    const dailyMap = {};
    
    // Initialiser les 10 derniers jours
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { profits: 0, commandes: 0 };
    }

    // Calculer les profits par jour
    for (const l of lignes) {
      const dateSousCommande = sousCommandeDates[l.id_sous_commande];
      if (!dateSousCommande) continue;
      
      const key = new Date(dateSousCommande).toISOString().split("T")[0];
      if (dailyMap[key]) {
        const fraisPlateforme = (l.prix_gros * l.quantite) * 0.10;
        const profit = ((l.prix_vente - l.prix_gros) * l.quantite) - fraisPlateforme;
        dailyMap[key].profits += profit;
      }
    }

    // Compter les commandes par jour
    sousCommandes.forEach(sc => {
      const key = new Date(sc.cree_le).toISOString().split("T")[0];
      if (dailyMap[key]) {
        dailyMap[key].commandes += 1;
      }
    });

    return Object.entries(dailyMap)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, val]) => ({
        date,
        name: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        profits: Number(val.profits.toFixed(2)),
        commandes: val.commandes,
      }));
  } catch (error) {
    console.error("Erreur dans getDailyData:", error);
    // Retourner des données vides en cas d'erreur
    const now = new Date();
    const dailyMap = {};
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { profits: 0, commandes: 0 };
    }
    return Object.entries(dailyMap)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, val]) => ({
        date,
        name: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        profits: 0,
        commandes: 0,
      }));
  }
};

const getTopProducts = async (fournisseurId, dateFilter = null) => {
  try {
    let whereCondition = { id_fournisseur: fournisseurId };
    if (dateFilter) whereCondition.cree_le = dateFilter;

    // Récupérer les sous-commandes
    const sousCommandes = await SousCommande.findAll({
      where: whereCondition,
      attributes: ['id'],
      raw: true
    });

    const sousCommandeIds = sousCommandes.map(sc => sc.id);

    if (sousCommandeIds.length === 0) return [];

    // Récupérer les lignes de commande avec les quantités
    const lignes = await LigneCommande.findAll({
      where: {
        id_sous_commande: { [Op.in]: sousCommandeIds }
      },
      attributes: ["id_produit", "quantite"],
      raw: true
    });

    // Compter les ventes par produit
    const ventesParProduit = {};
    
    for (const ligne of lignes) {
      const produitId = ligne.id_produit;
      if (!ventesParProduit[produitId]) {
        ventesParProduit[produitId] = {
          id: produitId,
          ventes: 0
        };
      }
      ventesParProduit[produitId].ventes += ligne.quantite;
    }

    // Récupérer les informations des produits
    const productIds = Object.keys(ventesParProduit);
    const produits = await Produit.findAll({
      where: { id: { [Op.in]: productIds } },
      include: [{ 
        model: Media, 
        as: "medias",
        attributes: ["id", "url"], 
        required: false 
      }],
      attributes: ["id", "nom"],
      raw: false
    });

    // Construire le résultat final
    const result = Object.values(ventesParProduit)
      .map(item => {
        const produit = produits.find(p => p.id === item.id);
        return {
          id: item.id,
          nom: produit?.nom || "Produit inconnu",
          ventes: item.ventes,
          medias: produit?.medias || []
        };
      })
      .sort((a, b) => b.ventes - a.ventes)
      .slice(0, 50);

    return result;
  } catch (error) {
    console.error("Erreur dans getTopProducts:", error);
    return [];
  }
};

const getCommandesParSource = async (fournisseurId, dateFilter = null) => {
  try {
    const whereSC = { id_fournisseur: fournisseurId };
    if (dateFilter) whereSC.cree_le = dateFilter;

    const sousCommandes = await SousCommande.findAll({
      where: whereSC,
      attributes: ['id_commande'],
      group: ['id_commande'],
      raw: true
    });

    const commandeIds = sousCommandes.map(sc => sc.id_commande);

    if (commandeIds.length === 0) return [];

    const rows = await Commande.findAll({
      where: { 
        id: { [Op.in]: commandeIds },
      },
      attributes: ["source", [fn("COUNT", col("id")), "count"]],
      group: ["source"],
      order: [[literal("count"), "DESC"]],
      raw: true
    });

    return rows.map(row => ({ 
      source: row.source || "Inconnue", 
      count: parseInt(row.count, 10) || 0 
    }));
  } catch (error) {
    console.error("Erreur dans getCommandesParSource:", error);
    return [];
  }
};

const getPickupsCount = async (fournisseurId, dateFilter = null) => {
  try {
    const whereP = { id_fournisseur: fournisseurId };
    if (dateFilter) whereP.cree_le = dateFilter;
    const count = await Pickup.count({ where: whereP });
    return count;
  } catch (error) {
    console.error("Erreur dans getPickupsCount:", error);
    return 0;
  }
};

// ============================
// Contrôleur principal CORRIGÉ
// ============================
export const getSupplierDashboard = async (req, res) => {
  try {
    const fournisseurId = req.user?.id;
    if (!fournisseurId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { dateDebut, dateFin } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = dateDebut ? new Date(dateDebut) : new Date(today);
    let endDate = dateFin ? new Date(dateFin) : new Date(today);
    
    if (isNaN(startDate.getTime())) startDate = new Date(today);
    if (isNaN(endDate.getTime())) endDate = new Date(today);
    
    endDate.setHours(23, 59, 59, 999);

    const dateFilter = makeDateFilter(startDate, endDate);

    const [
      profit,
      CAffaire,
      CAEnCours,
      CAPotentiel,
      penalitesRetour,
      mainStats,
      monthlyData,
      dailyData,
      topProduits,
      commandesParSource,
      pickupsCount,
    ] = await Promise.all([
      getProfit(fournisseurId, dateFilter),
      getCA(fournisseurId, dateFilter),
      getCAEnCours(fournisseurId, dateFilter),
      getChiffreAffairePotentiel(fournisseurId, dateFilter),
      getPenalitesRetour(fournisseurId, dateFilter),
      getMainStats(fournisseurId, dateFilter),
      getMonthlyData(fournisseurId, dateFilter),
      getDailyData(fournisseurId, dateFilter),
      getTopProducts(fournisseurId, dateFilter),
      getCommandesParSource(fournisseurId, dateFilter),
      getPickupsCount(fournisseurId, dateFilter),
    ]);

    return res.json({
      cards: {
        ...mainStats,
        profit,
        CAffaire,
        CAEnCours,
        CAPotentiel,
        penalitesRetour,
        pickups: pickupsCount,
      },
      monthlyData,
      dailyData,
      topProduits,
      commandesParSource,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Erreur getSupplierDashboard:", error);
    return res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};