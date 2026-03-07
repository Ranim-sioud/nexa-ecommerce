import logger from '../config/logger.js';
import Produit from "../models/Produit.js";
import Variation from "../models/Variation.js";
import Media from "../models/Media.js";
import Categorie from "../models/Categorie.js";
import path from "path";
import User from "../models/User.js";
import Fournisseur from "../models/Fournisseur.js";
import { Op } from "sequelize";
import Notification from "../models/Notification.js";
import sequelize from "../config/database.js";
import Commande from "../models/Commande.js";
import MesProduit from "../models/MesProduit.js";
import { error } from "console";
import LigneCommande from "../models/LigneCommande.js";
import SousCommande from "../models/SousCommande.js";
import Client from "../models/Client.js";

// Génération code produit unique
function generateProductCode() {
  return "PRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createProduit(req, res) {
  try {
    const { nom, description, livraison, prix_gros } = req.body;
    const stock = req.body.stock !== undefined ? parseInt(req.body.stock, 10) : 0;
    const id_externe = req.body.id_externe;
    const id_categorie = req.body.id_categorie;
    const id_fournisseur = req.user.id;

    // --- Validation des variations si présentes ---
    let parsedVariations = [];
    if (req.body.variations) {
      try {
        parsedVariations = JSON.parse(req.body.variations);
      } catch (e) {
        return res.status(400).json({ message: "Format JSON des variations invalide." });
      }
      if (!Array.isArray(parsedVariations)) {
        return res.status(400).json({ message: "Variations doit être un tableau." });
      }

      if (parsedVariations.length === 1) {
        const v = parsedVariations[0];
        // couleur OU taille requis
        if (!v.couleur && !v.taille) {
          return res.status(400).json({
            message: "Pour une seule variation, au moins la couleur ou la taille doit être renseignée."
          });
        }
        // si stock fourni → doit être égal au stock global
        if (v.stock !== undefined && String(v.stock).trim() !== "") {
          const vStock = parseInt(v.stock, 10);
          if (isNaN(vStock)) {
            return res.status(400).json({ message: "Stock de la variation invalide." });
          }
          if (vStock !== stock) {
            return res.status(400).json({
              message: `Le stock de la seule variation (${vStock}) doit être égal au stock global (${stock}).`
            });
          }
        }
        // prix_gros est facultatif ici
      } else if (parsedVariations.length > 1) {
        // plusieurs variations → tous les champs obligatoires + somme des stocks = stock global
        let sommeStock = 0;
        for (const v of parsedVariations) {
          if (!v.couleur || !v.taille || v.prix_gros === undefined || v.stock === undefined || String(v.stock).trim() === "") {
            return res.status(400).json({
              message: "Toutes les propriétés (couleur, taille, prix_gros, stock) sont obligatoires lorsque plusieurs variations sont ajoutées."
            });
          }
          const vStock = parseInt(v.stock, 10);
          if (isNaN(vStock)) {
            return res.status(400).json({ message: "Un stock de variation est invalide." });
          }
          sommeStock += vStock;
        }
        if (sommeStock !== stock) {
          return res.status(400).json({
            message: `La somme des stocks des variations (${sommeStock}) ne correspond pas au stock global (${stock}).`
          });
        }
      }
    }

    // --- Création du produit ---
    const produit = await Produit.create({
      code: generateProductCode(),
      nom,
      description,
      livraison,
      prix_gros: prix_gros !== undefined ? parseFloat(prix_gros) : null,
      stock,
      id_categorie,
      id_fournisseur,
      rupture_stock: stock <= 5,
      ...(id_externe ? { id_externe } : {})
    });

    // --- Sauvegarde des médias uploadés ---
    if (req.files && req.files.length > 0) {
  const mediasToCreate = req.files.map((file) => {
    const isVideo = file.mimetype.startsWith("video");

    return {
      id_produit: produit.id,
      type: isVideo ? "video" : "image",
      url: file.path,                     // URL Cloudinary directe ✔
      public_id: file.filename || file.public_id,           // utile pour supprimer ✔
      principale: false,
    };
  });

  await Media.bulkCreate(mediasToCreate);
}

    // --- Création des variations (si any) ---
    if (parsedVariations.length > 0) {
      const variationsToCreate = parsedVariations.map((v) => {
        const isSingle = parsedVariations.length === 1;
        // pour une seule variation : si stock non fourni on met le stock global ; si fourni, il a déjà été validé égal.
        const vStock = isSingle
          ? (v.stock !== undefined && String(v.stock).trim() !== "" ? parseInt(v.stock, 10) : stock)
          : parseInt(v.stock, 10);

        const vPrix = v.prix_gros !== undefined && String(v.prix_gros).trim() !== ""
          ? parseFloat(v.prix_gros)
          : (prix_gros !== undefined ? parseFloat(prix_gros) : null);

        return {
          id_produit: produit.id,
          couleur: v.couleur,
          taille: v.taille,
          prix_gros: vPrix,
          stock: vStock,
          ...(v.id_externe ? { id_externe: v.id_externe } : {}),
        };
      });
      await Variation.bulkCreate(variationsToCreate);
    }
    // recharger produit avec ses relations
    const produitWithRels = await Produit.findByPk(produit.id, {
      include: [
        { model: Variation, as: "variations" },
        { model: Media, as: "medias" },
        { model: Categorie, as: "categorie" },
      ],
    });

    res.status(201).json({ message: "Produit créé avec succès", produit: produitWithRels });
  } catch (err) {
    logger.error("Erreur createProduit :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
}

// Récupérer tous les produits
export async function getProduits(req, res) {
  try {
    const id_fournisseur = req.user.id; // fournisseur connecté

    const produits = await Produit.findAll({
      where: { id_fournisseur }, // ✅ filtre par fournisseur
      include: [
        { model: Media, as: "medias" },
        { model: Variation, as: "variations" },
        { model: Categorie, as: "categorie" },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(produits);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function updateProduit(req, res) {
  try {
    const { id } = req.params;
    const produit = await Produit.findByPk(id, {
      include: [
        { model: Variation, as: "variations" },
        { model: Media, as: "medias" },
        { model: Categorie, as: "categorie" }
      ],
    });

    if (!produit) return res.status(404).json({ message: "Produit non trouvé" });

    // CORRECTION : Vérifier si id_externe existe et n'est pas une chaîne vide
    if (req.body.id_externe !== undefined && req.body.id_externe !== null && req.body.id_externe !== produit.id_externe) {
      const idExterneStr = String(req.body.id_externe).trim();
      if (idExterneStr !== "") {
        const existingProduct = await Produit.findOne({
          where: { 
            id_externe: idExterneStr,
            id: { [Op.ne]: id }
          }
        });
        
        if (existingProduct) {
          return res.status(400).json({ 
            message: "Cet ID externe est déjà utilisé par un autre produit" 
          });
        }
      }
    }

    const stockGlobal = req.body.stock !== undefined ? parseInt(req.body.stock, 10) : produit.stock;

    // Validation des variations (similaire à create)
    let parsedVariations = [];
    if (req.body.variations) {
      try {
        parsedVariations = JSON.parse(req.body.variations);
      } catch (e) {
        return res.status(400).json({ message: "Format JSON des variations invalide." });
      }
      if (!Array.isArray(parsedVariations)) {
        return res.status(400).json({ message: "Variations doit être un tableau." });
      }

      if (parsedVariations.length === 1) {
        const v = parsedVariations[0];
        if (!v.couleur && !v.taille) {
          return res.status(400).json({
            message: "Pour une seule variation, au moins la couleur ou la taille doit être renseignée."
          });
        }
        if (v.stock !== undefined && String(v.stock).trim() !== "") {
          const vStock = parseInt(v.stock, 10);
          if (isNaN(vStock)) return res.status(400).json({ message: "Stock de variation invalide." });
          if (vStock !== stockGlobal) {
            return res.status(400).json({
              message: `Le stock de la seule variation (${vStock}) doit être égal au stock global (${stockGlobal}).`
            });
          }
        }
      } else if (parsedVariations.length > 1) {
        let sommeStock = 0;
        for (const v of parsedVariations) {
          if (!v.couleur || !v.taille || v.prix_gros === undefined || v.stock === undefined || String(v.stock).trim() === "") {
            return res.status(400).json({
              message: "Toutes les propriétés (couleur, taille, prix_gros, stock) sont obligatoires lorsque plusieurs variations sont ajoutées."
            });
          }
          const vStock = parseInt(v.stock, 10);
          if (isNaN(vStock)) return res.status(400).json({ message: "Un stock de variation est invalide." });
          sommeStock += vStock;
        }
        if (sommeStock !== stockGlobal) {
          return res.status(400).json({
            message: `La somme des stocks des variations (${sommeStock}) ne correspond pas au stock global (${stockGlobal}).`
          });
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...req.body,
      stock: stockGlobal,
      rupture_stock: stockGlobal <= 5,
    };

    // CORRECTION : Gérer id_externe de manière sécurisée
    if (req.body.id_externe !== undefined) {
      if (req.body.id_externe === null || req.body.id_externe === "") {
        updateData.id_externe = null;
      } else {
        updateData.id_externe = String(req.body.id_externe).trim() || null;
      }
    }

    // Mise à jour produit
    await produit.update(updateData);

    // Gestion des variations (update/create)
    if (parsedVariations.length > 0) {
      for (const v of parsedVariations) {
        // CORRECTION : Vérifier id_externe de manière sécurisée
        if (v.id_externe !== undefined && v.id_externe !== null && v.id_externe !== "") {
          const idExterneVariation = String(v.id_externe).trim();
          if (idExterneVariation !== "") {
            const existingVariation = await Variation.findOne({
              where: { 
                id_externe: idExterneVariation,
                id_produit: { [Op.ne]: id }
              }
            });
            
            if (existingVariation) {
              return res.status(400).json({ 
                message: `L'ID externe ${idExterneVariation} est déjà utilisé par une autre variation` 
              });
            }
          }
        }
        
        if (v.id) {
          const variation = await Variation.findByPk(v.id);
          if (variation) {
            const variationUpdateData = {
              couleur: v.couleur,
              taille: v.taille,
              prix_gros: v.prix_gros !== undefined ? v.prix_gros : variation.prix_gros,
              stock: v.stock !== undefined && String(v.stock).trim() !== "" ? parseInt(v.stock, 10) : variation.stock,
            };

            // CORRECTION : Gérer id_externe de manière sécurisée
            if (v.id_externe !== undefined) {
              if (v.id_externe === null || v.id_externe === "") {
                variationUpdateData.id_externe = null;
              } else {
                variationUpdateData.id_externe = String(v.id_externe).trim() || null;
              }
            }

            await variation.update(variationUpdateData);
          }
        } else {
          const isSingle = parsedVariations.length === 1;
          const vStock = isSingle
            ? (v.stock !== undefined && String(v.stock).trim() !== "" ? parseInt(v.stock, 10) : stockGlobal)
            : parseInt(v.stock, 10);
          
          // CORRECTION : Gérer id_externe de manière sécurisée
          const idExterneVariation = v.id_externe !== undefined && v.id_externe !== null && v.id_externe !== "" 
            ? String(v.id_externe).trim() || null 
            : null;

          await Variation.create({
            id_produit: produit.id,
            couleur: v.couleur,
            taille: v.taille,
            prix_gros: v.prix_gros !== undefined ? v.prix_gros : null,
            stock: vStock,
            id_externe: idExterneVariation,
          });
        }
      }
    }

    // Gérer medias etc
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await Media.create({
          id_produit: id,
          url: file.path,                // URL Cloudinary ✔️
          public_id: file.filename,      // public_id Cloudinary ✔️
          type: file.mimetype.startsWith("video") ? "video" : "image",
        });
      }
    }
    if (req.body.mediasToDelete) {
      const mediasToDelete = JSON.parse(req.body.mediasToDelete);
    
      for (const mediaId of mediasToDelete) {
        const media = await Media.findByPk(mediaId);
    
        if (media?.public_id) {
          await cloudinary.uploader.destroy(media.public_id, {
            resource_type: media.type === "video" ? "video" : "image"
          });
        }
    
        await Media.destroy({ where: { id: mediaId } });
      }
    }

    const updatedProduit = await Produit.findByPk(id, {
      include: [
        { model: Variation, as: "variations" },
        { model: Media, as: "medias" }
      ],
    });

    res.json({ message: "Produit mis à jour", produit: updatedProduit });
  } catch (err) {
    logger.error("Erreur updateProduit :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
}

export const deleteProduit = async (req, res) => {
  logger.info("=== DEBUT deleteProduit ===");

  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user?.id;

    logger.info(`🗑️ Suppression produit ID: ${id}, Fournisseur ID: ${userId}`);

    // 1. Vérifier si le produit existe et appartient au fournisseur
    const produit = await Produit.findOne({
      where: { id, id_fournisseur: userId },
      transaction: t
    });

    if (!produit) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé ou ne vous appartient pas"
      });
    }

    logger.info(`✅ Produit trouvé: ${produit.nom}`);

    // 2. Récupérer toutes les lignes de commande liées à ce produit
    const lignes = await LigneCommande.findAll({
      where: { id_produit: id },
      include: [
        {
          model: SousCommande,
          as: "sous_commande",
          include: [{
            model: Commande,
            as: "commande"
          }]
        }
      ],
      transaction: t
    });

    logger.info(`📊 ${lignes.length} ligne(s) de commande trouvée(s) pour ce produit`);

    // 3. Grouper les données par sous-commande et commande
    const sousCommandesData = new Map(); // id_sous_commande -> {data}
    const commandesData = new Map(); // id_commande -> {data}
    
    for (const ligne of lignes) {
      const sousCommande = ligne.sous_commande;
      if (!sousCommande) continue;
      
      const commande = sousCommande.commande;
      if (!commande) continue;
      
      // Stocker les données de sous-commande
      if (!sousCommandesData.has(sousCommande.id)) {
        sousCommandesData.set(sousCommande.id, {
          id: sousCommande.id,
          commandeId: commande.id,
          statut: sousCommande.statut,
          ligneIds: new Set()
        });
      }
      sousCommandesData.get(sousCommande.id).ligneIds.add(ligne.id);
      
      // Stocker les données de commande
      if (!commandesData.has(commande.id)) {
        commandesData.set(commande.id, {
          id: commande.id,
          etat: commande.etat_commande,
          clientId: commande.id_client,
          sousCommandeIds: new Set()
        });
      }
      commandesData.get(commande.id).sousCommandeIds.add(sousCommande.id);
    }

    // 4. Supprimer toutes les lignes de commande liées au produit
    const allLigneIds = [];
    for (const ligne of lignes) {
      allLigneIds.push(ligne.id);
    }
    
    if (allLigneIds.length > 0) {
      await LigneCommande.destroy({
        where: { id: { [Op.in]: allLigneIds } },
        transaction: t
      });
      logger.info(`✅ ${allLigneIds.length} ligne(s) de commande supprimée(s)`);
    }

    // 5. Vérifier chaque sous-commande pour voir si elle a encore des lignes
    logger.info("\n=== Vérification des sous-commandes ===");
    const sousCommandesASupprimer = new Set();
    
    for (const [sousCommandeId, data] of sousCommandesData) {
      logger.info(`🔍 Vérification sous-commande ${sousCommandeId}:`);
      
      // Vérifier si la sous-commande a d'autres lignes (autres que celles supprimées)
      const autresLignes = await LigneCommande.count({
        where: { 
          id_sous_commande: sousCommandeId,
          id: { [Op.notIn]: Array.from(data.ligneIds) }
        },
        transaction: t
      });
      
      logger.info(`   Autres lignes dans cette sous-commande: ${autresLignes}`);
      
      if (autresLignes === 0) {
        // Sous-commande vide → à supprimer
        sousCommandesASupprimer.add(sousCommandeId);
        logger.info(`   ❌ Sous-commande ${sousCommandeId} sera supprimée (vide)`);
      } else {
        logger.info(`   ✅ Sous-commande ${sousCommandeId} conservée (contient ${autresLignes} autres lignes)`);
      }
    }

    // 6. Supprimer les sous-commandes vides
    if (sousCommandesASupprimer.size > 0) {
      await SousCommande.destroy({
        where: { id: { [Op.in]: Array.from(sousCommandesASupprimer) } },
        transaction: t
      });
      logger.info(`✅ ${sousCommandesASupprimer.size} sous-commande(s) supprimée(s)`);
    }

    // 7. Vérifier chaque commande pour voir si elle a encore des sous-commandes
    logger.info("\n=== Vérification des commandes ===");
    const commandesASupprimer = new Set();
    
    for (const [commandeId, data] of commandesData) {
      logger.info(`🔍 Vérification commande ${commandeId} (état: ${data.etat}):`);
      
      // Vérifier si la commande a d'autres sous-commandes
      const autresSousCommandes = await SousCommande.count({
        where: { 
          id_commande: commandeId,
          id: { [Op.notIn]: Array.from(data.sousCommandeIds) }
        },
        transaction: t
      });
      
      logger.info(`   Autres sous-commandes dans cette commande: ${autresSousCommandes}`);
      
      // Vérifier les sous-commandes qui vont être supprimées
      const sousCommandesDeCetteCommandeASupprimer = Array.from(data.sousCommandeIds).filter(
        id => sousCommandesASupprimer.has(id)
      );
      
      logger.info(`   Sous-commandes de cette commande à supprimer: ${sousCommandesDeCetteCommandeASupprimer.length}`);
      
      // Calculer combien de sous-commandes resteront après suppression
      const sousCommandesRestantes = autresSousCommandes + 
        (data.sousCommandeIds.size - sousCommandesDeCetteCommandeASupprimer.length);
      
      logger.info(`   Sous-commandes qui resteront après suppression: ${sousCommandesRestantes}`);
      
      // Ne pas supprimer les commandes livrées ou en cours de livraison
      if (data.etat === "livree" || data.etat === "en_cours_livraison") {
        logger.info(`   ⚠️ Commande ${commandeId} en état "${data.etat}" → CONSERVÉE`);
        continue;
      }
      
      // Si plus de sous-commandes après suppression
      if (sousCommandesRestantes === 0) {
        commandesASupprimer.add(commandeId);
        logger.info(`   ❌ Commande ${commandeId} sera supprimée (plus de sous-commandes)`);
      } else {
        logger.info(`   ✅ Commande ${commandeId} conservée (aura ${sousCommandesRestantes} sous-commandes)`);
      }
    }

    // 8. Supprimer les commandes vides
    if (commandesASupprimer.size > 0) {
      await Commande.destroy({
        where: { id: { [Op.in]: Array.from(commandesASupprimer) } },
        transaction: t
      });
      logger.info(`✅ ${commandesASupprimer.size} commande(s) supprimée(s)`);
      
      // Supprimer les clients associés aux commandes supprimées
      for (const commandeId of commandesASupprimer) {
        const data = commandesData.get(commandeId);
        if (data && data.clientId) {
          // Vérifier si le client a d'autres commandes
          const autresCommandesDuClient = await Commande.count({
            where: { 
              id_client: data.clientId,
              id: { [Op.ne]: commandeId }
            },
            transaction: t
          });
          
          if (autresCommandesDuClient === 0) {
            await Client.destroy({
              where: { id: data.clientId },
              transaction: t
            });
            logger.info(`✅ Client ${data.clientId} supprimé (plus de commandes)`);
          } else {
            logger.info(`⚠️ Client ${data.clientId} conservé (a ${autresCommandesDuClient} autres commandes)`);
          }
        }
      }
    }

    // 9. Supprimer les dépendances du produit
    logger.info("\n=== Suppression des dépendances du produit ===");
    
    // Supprimer MesProduit
    await MesProduit.destroy({ where: { id_produit: id }, transaction: t });
    logger.info("✅ MesProduit supprimé");

    // Supprimer Variations
    await Variation.destroy({ where: { id_produit: id }, transaction: t });
    logger.info("✅ Variations supprimées");

    // Supprimer Media + Cloudinary
    const medias = await Media.findAll({ where: { id_produit: id }, transaction: t });
    for (const media of medias) {
      if (media.public_id && media.public_id !== "null") {
        try {
          await cloudinary.uploader.destroy(media.public_id, {
            resource_type: media.type === "video" ? "video" : "image"
          });
        } catch (err) {
          logger.warn(`⚠️ Erreur Cloudinary: ${err.message}`);
        }
      }
    }
    await Media.destroy({ where: { id_produit: id }, transaction: t });
    logger.info("✅ Médias supprimés");

    // 10. Supprimer le produit
    await Produit.destroy({ where: { id }, transaction: t });
    logger.info(`✅ Produit ${id} supprimé`);

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Produit et dépendances supprimés avec succès",
      produitId: id
    });

  } catch (error) {
    await t.rollback();
    logger.error("❌ ERREUR deleteProduit:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du produit",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

 export async function getAllProduitsForVendeur(req, res) {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    // Récupérer tous les produits avec pagination et INCLUDE optimisé
    const produits = await Produit.findAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "code", "nom", "description", "prix_gros", "id_categorie", "id_fournisseur"],
      include: [
        // Inclure directement les médias
        {
          model: Media,
          as: 'medias',
          attributes: ["id", "url", "type", "principale"],
          separate: true, // Évite les JOIN complexes
          limit: 1 // Seulement le premier média
        },
        // Inclure directement les variations
        {
          model: Variation,
          as: 'variations', 
          attributes: ["id", "couleur", "prix_gros", "stock"],
          separate: true
        },
        // Inclure directement la catégorie
        {
          model: Categorie,
          as: 'categorie',
          attributes: ["id", "nom"]
        }
      ]
    });

    // Récupérer les fournisseurs en UNE seule requête (sans doublons)
    const fournisseurIds = [...new Set(produits.map(p => p.id_fournisseur).filter(id => id))];
    
    let fournisseurs = [];
    if (fournisseurIds.length > 0) {
      fournisseurs = await Fournisseur.findAll({
        where: { id_user: fournisseurIds },
        include: [{ 
          model: User, 
          as: "user", 
          attributes: ["id", "nom", "email"] 
        }],
      });
    }

    // Assembler les données
    const produitsAvecRelations = produits.map(produit => {
      const produitJSON = produit.toJSON();
      
      // Ajouter le fournisseur correspondant
      if (produit.id_fournisseur) {
        produitJSON.fournisseur = fournisseurs.find(f => f.id_user === produit.id_fournisseur)?.toJSON() || null;
      } else {
        produitJSON.fournisseur = null;
      }
      
      return produitJSON;
    });

    // Compter le nombre total de produits pour la pagination
    const totalItems = await Produit.count();
    const totalPages = Math.ceil(totalItems / limit);
    
    logger.info('Produits chargés:', produitsAvecRelations.length);
    logger.info('Fournisseurs uniques:', fournisseurIds);

    res.json({
      produits: produitsAvecRelations || [],
      pagination: {
        totalPages,
        currentPage: page,
        totalItems,
      },
    });

  } catch (err) {
    logger.error("Erreur getAllProduitsVendeurs:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
}

export async function getProduitById(req, res) {
  const t = await sequelize.transaction();
  
  try {
    const produitId = req.params.id;
    logger.info(`🔄 getProduitById appelé pour produit: ${produitId}`);

    // Étape 1 : récupérer le produit principal avec toutes les infos
    const produit = await Produit.findByPk(produitId, {
      attributes: [
        "id", "code", "nom", "description", "livraison", 
        "prix_gros", "stock", "rupture_stock", "id_fournisseur", "id_categorie"
      ],
      transaction: t
    });

    if (!produit) {
      await t.rollback();
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    logger.info(`✅ Produit trouvé: ${produit.nom}`);

    // Étape 2 : récupérer toutes les relations en PARALLÈLE
    const [medias, variations, categorie, fournisseur] = await Promise.all([
      // Medias
      Media.findAll({
        where: { id_produit: produitId },
        attributes: ["id", "url", "type", "principale"],
        transaction: t
      }),
      
      // Variations
      Variation.findAll({
        where: { id_produit: produitId },
        attributes: ["id", "couleur", "taille", "prix_gros", "stock", "id_externe"],
        transaction: t
      }),
      
      // Catégorie
      Categorie.findByPk(produit.id_categorie, {
        attributes: ["id", "nom"],
        transaction: t
      }),
      
      // Fournisseur + User
      Fournisseur.findOne({
        where: { id_user: produit.id_fournisseur },
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "nom", "email", "ville", "gouvernorat"]
        }],
        transaction: t
      })
    ]);

    logger.info(`📊 Relations chargées: ${medias.length} médias, ${variations.length} variations`);

    // Étape 3 : assembler le résultat
    const result = {
      ...produit.toJSON(),
      medias: medias || [],
      variations: variations || [],
      categorie: categorie || null,
      fournisseur: fournisseur ? {
        ...fournisseur.toJSON(),
        identifiant_public: fournisseur.identifiant_public
      } : null
    };

    await t.commit();
    
    logger.info(`✅ Produit ${produitId} chargé avec succès`);
    res.json(result);

  } catch (err) {
    await t.rollback();
    
    logger.error('💥 ERREUR getProduitById:', {
      message: err.message,
      name: err.name,
      produitId: req.params.id,
      stack: err.stack
    });

    res.status(500).json({ 
      message: "Erreur lors du chargement du produit",
      error: err.message
    });
  }
}