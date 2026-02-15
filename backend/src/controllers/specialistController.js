import { Task, Permission, User, Tickets, TicketsType, Produit, Media, Variation, Categorie, Fournisseur, MesProduit, LigneCommande, SousCommande, Commande, Client } from '../models/index.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { Op } from 'sequelize';
import { sequelize } from '../models/index.js'; // Import correct de sequelize


// Tableau de bord spécialiste
export const getDashboard = async (req, res) => {
  try {
    const specialistId = req.user.id;

    // Statistiques
    const pendingTasks = await Task.count({
      where: { 
        assigned_to: specialistId, 
        status: 'pending' 
      }
    });

    const inProgressTasks = await Task.count({
      where: { 
        assigned_to: specialistId, 
        status: 'in_progress' 
      }
    });

    const completedTasks = await Task.count({
      where: { 
        assigned_to: specialistId, 
        status: 'completed' 
      }
    });

    // Permissions
    const permissions = await Permission.findAll({
      where: { specialist_id: specialistId }
    });

    // Tâches récentes
    const recentTasks = await Task.findAll({
      where: { assigned_to: specialistId },
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'email']
        }
      ]
    });

    res.json({
      stats: {
        pending_tasks: pendingTasks,
        in_progress_tasks: inProgressTasks,
        completed_tasks: completedTasks,
        total_tasks: pendingTasks + inProgressTasks + completedTasks
      },
      permissions: permissions,
      recent_tasks: recentTasks
    });

  } catch (error) {
    console.error('Erreur getDashboard:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Gestion des utilisateurs - VERSION CORRIGÉE
export const manageUsers = async (req, res) => {
  try {
    // Vérifier si l'utilisateur a la permission de voir les users
    // Cette vérification est déjà faite par le middleware, mais on peut ajouter une logique métier
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      role: { [Op.in]: ['vendeur', 'fournisseur'] }
    };
    
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      attributes: [
        "id", "nom", "email", "telephone", "role", "gouvernorat", 
        "ville", "adresse", "actif", "validation", "cree_le"
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['cree_le', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });

  } catch (error) {
    console.error('Erreur manageUsers:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const manageProducts = async (req, res) => {
  try {
    console.log("=== DEBUT manageProducts ===");

    // 1. Récupérer l'ID de l'admin
    const adminUser = await User.findOne({
      where: { role: 'admin' },
      attributes: ['id'],
      order: [['id', 'ASC']]
    });

    if (!adminUser) {
      return res.json({
        produits: [],
        pagination: {
          totalPages: 0,
          currentPage: 1,
          totalItems: 0,
        }
      });
    }

    // 2. Récupérer les produits avec pagination
    let { page = 1, limit = 50 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const produits = await Produit.findAll({
      where: {
        id_fournisseur: adminUser.id
      },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      attributes: [
        "id", "code", "nom", "description", "livraison", 
        "prix_gros", "stock", "rupture_stock", "id_categorie", 
        "id_fournisseur", "id_externe", "createdAt"
      ]
    });

    console.log(`✓ ${produits.length} produits admin trouvés`);

    if (produits.length === 0) {
      return res.json({
        produits: [],
        pagination: {
          totalPages: 0,
          currentPage: page,
          totalItems: 0,
        }
      });
    }

    // 3. Récupérer toutes les relations en parallèle
    const produitIds = produits.map(p => p.id);
    const categorieIds = produits.map(p => p.id_categorie).filter(id => id);

    const [allMedias, allVariations, allCategories] = await Promise.all([
      // Tous les médias
      Media.findAll({
        where: { id_produit: produitIds },
        attributes: ['id', 'url', 'type', 'principale', 'id_produit'],
        order: [['id_produit', 'ASC']]
      }),
      
      // Toutes les variations
      Variation.findAll({
        where: { id_produit: produitIds },
        attributes: ['id', 'couleur', 'taille', 'prix_gros', 'stock', 'id_externe', 'id_produit'],
        order: [['id_produit', 'ASC']]
      }),
      
      // Toutes les catégories
      Categorie.findAll({
        where: { id: categorieIds },
        attributes: ['id', 'nom']
      })
    ]);

    // 4. Récupérer le fournisseur (admin)
    const fournisseur = await Fournisseur.findOne({
      where: { id_user: adminUser.id },
      include: [{
        model: User,
        as: "user",
        attributes: ['id', 'nom', 'email']
      }]
    });

    // 5. Compter le total pour la pagination
    const totalItems = await Produit.count({
      where: { id_fournisseur: adminUser.id }
    });

    // 6. Assembler les données
    const produitsFormatted = produits.map(produit => {
      const produitJSON = produit.toJSON();
      
      // Ajouter les médias du produit
      produitJSON.medias = allMedias
        .filter(m => m.id_produit === produit.id)
        .map(m => m.toJSON());
      
      // Ajouter les variations du produit
      produitJSON.variations = allVariations
        .filter(v => v.id_produit === produit.id)
        .map(v => v.toJSON());
      
      // Ajouter la catégorie
      produitJSON.categorie = allCategories
        .find(c => c.id === produit.id_categorie)
        ?.toJSON() || null;
      
      // Ajouter le fournisseur (admin)
      produitJSON.fournisseur = fournisseur?.user?.toJSON() || null;
      produitJSON.createdByAdmin = true;
      
      return produitJSON;
    });

    res.json({
      produits: produitsFormatted,
      pagination: {
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        totalItems,
      }
    });

  } catch (error) {
    console.error('❌ Erreur manageProducts:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Génération code produit unique (identique)
function generateProductCode() {
  return "PRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Création de produit - VERSION AMÉLIORÉE
export const createProductSpecialist = async (req, res) => {
  // Vérifier si sequelize est disponible
  if (!sequelize) {
    console.error('❌ sequelize non défini');
    return res.status(500).json({ 
      message: "Erreur de configuration de la base de données" 
    });
  }

  const t = await sequelize.transaction();
  
  try {
    console.log("=== DEBUT createProductSpecialist ===");
    console.log("Body:", req.body);
    console.log("Files:", req.files?.length || 0, "fichiers");

    const { nom, description, livraison, prix_gros, id_categorie, id_externe } = req.body;
    const stock = req.body.stock !== undefined ? parseInt(req.body.stock, 10) : 0;

    // Validation des champs obligatoires
    if (!nom || !id_categorie) {
      await t.rollback();
      return res.status(400).json({ 
        message: "Le nom et la catégorie sont obligatoires" 
      });
    }

    // Récupérer l'ID d'un admin
    const adminUser = await User.findOne({
      where: { role: 'admin' },
      attributes: ['id'],
      order: [['id', 'ASC']],
      transaction: t
    });

    if (!adminUser) {
      await t.rollback();
      return res.status(404).json({ message: "Aucun administrateur trouvé" });
    }

    const id_fournisseur = adminUser.id;

    // Validation des variations si présentes
    let parsedVariations = [];
    if (req.body.variations) {
      try {
        parsedVariations = JSON.parse(req.body.variations);
        
        if (!Array.isArray(parsedVariations)) {
          await t.rollback();
          return res.status(400).json({ message: "Variations doit être un tableau." });
        }

        // Validation logique
        if (parsedVariations.length === 1) {
          const v = parsedVariations[0];
          if (!v.couleur && !v.taille) {
            await t.rollback();
            return res.status(400).json({
              message: "Pour une seule variation, au moins la couleur ou la taille doit être renseignée."
            });
          }
        }
        
      } catch (e) {
        await t.rollback();
        return res.status(400).json({ 
          message: "Format JSON des variations invalide.",
          error: e.message 
        });
      }
    }

    // Création du produit
    const produit = await Produit.create({
      code: generateProductCode(),
      nom: nom.trim(),
      description: description?.trim() || '',
      livraison: livraison?.trim() || '',
      prix_gros: prix_gros !== undefined && prix_gros !== '' ? parseFloat(prix_gros) : null,
      stock,
      id_categorie: parseInt(id_categorie),
      id_fournisseur,
      rupture_stock: stock <= 5,
      ...(id_externe ? { id_externe: id_externe.trim() } : {})
    }, { transaction: t });

    console.log(`✅ Produit créé: ${produit.id}`);

    // Gestion des médias Cloudinary
    if (req.files && req.files.length > 0) {
      console.log(`📁 Création de ${req.files.length} médias`);
      
      const mediasToCreate = req.files.map((file) => ({
        id_produit: produit.id,
        type: file.mimetype.startsWith("video") ? "video" : "image",
        url: file.path,                     // URL Cloudinary directe ✔
        public_id: file.filename || file.public_id,
        principale: false,
      }));
      
      await Media.bulkCreate(mediasToCreate, { transaction: t });
      console.log(`✅ ${req.files.length} médias créés`);
    }

    // Création des variations
    if (parsedVariations.length > 0) {
      console.log(`🔄 Création de ${parsedVariations.length} variations`);
      
      const variationsToCreate = parsedVariations.map((v) => {
        const isSingle = parsedVariations.length === 1;
        const vStock = isSingle
          ? (v.stock !== undefined && String(v.stock).trim() !== "" ? parseInt(v.stock, 10) : stock)
          : parseInt(v.stock, 10);

        const vPrix = v.prix_gros !== undefined && String(v.prix_gros).trim() !== ""
          ? parseFloat(v.prix_gros)
          : (prix_gros !== undefined ? parseFloat(prix_gros) : null);

        return {
          id_produit: produit.id,
          couleur: v.couleur?.trim() || null,
          taille: v.taille?.trim() || null,
          prix_gros: vPrix,
          stock: vStock,
          ...(v.id_externe ? { id_externe: v.id_externe.trim() } : {}),
        };
      });
      
      await Variation.bulkCreate(variationsToCreate, { transaction: t });
      console.log(`✅ ${parsedVariations.length} variations créées`);
    }

    // Charger les relations de manière optimisée
    const [medias, variations, categorie, fournisseur] = await Promise.all([
      Media.findAll({
        where: { id_produit: produit.id },
        attributes: ['id', 'url', 'type', 'principale'],
        transaction: t
      }),
      
      Variation.findAll({
        where: { id_produit: produit.id },
        attributes: ['id', 'couleur', 'taille', 'prix_gros', 'stock', 'id_externe'],
        transaction: t
      }),
      
      Categorie.findByPk(id_categorie, {
        attributes: ['id', 'nom'],
        transaction: t
      }),
      
      Fournisseur.findOne({
        where: { id_user: id_fournisseur },
        include: [{
          model: User,
          as: "user",
          attributes: ['id', 'nom', 'email']
        }],
        transaction: t
      })
    ]);

    await t.commit();

    // Assembler la réponse
    const response = {
      id: produit.id,
      code: produit.code,
      nom: produit.nom,
      description: produit.description,
      livraison: produit.livraison,
      prix_gros: produit.prix_gros,
      stock: produit.stock,
      rupture_stock: produit.rupture_stock,
      id_categorie: produit.id_categorie,
      id_fournisseur: produit.id_fournisseur,
      id_externe: produit.id_externe,
      medias: medias.map(m => m.toJSON()),
      variations: variations.map(v => v.toJSON()),
      categorie: categorie?.toJSON() || null,
      fournisseur: fournisseur?.user?.toJSON() || null,
      createdByAdmin: true
    };

    console.log(`✅ Produit ${produit.id} créé avec succès`);

    res.status(201).json({ 
      message: "Produit créé avec succès", 
      produit: response 
    });

  } catch (error) {
    await t.rollback();
    console.error('❌ Erreur createProductSpecialist:', error);
    
    // Erreur spécifique pour les doublons d'ID externe
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: "Cet ID externe est déjà utilisé" 
      });
    }
    
    // Erreur de validation
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: "Erreur de validation des données",
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({ 
      message: "Erreur lors de la création du produit", 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Modification de produit - VERSION AMÉLIORÉE
export const updateProductSpecialist = async (req, res) => {
  let t;
  
  try {
    console.log("=== DEBUT updateProductSpecialist ===");
    console.log("Headers:", req.headers);
    console.log("User ID:", req.user?.id);
    console.log("Params:", req.params);
    console.log("Body keys:", Object.keys(req.body));
    console.log("Files count:", req.files?.length || 0);
    
    const { id } = req.params;
    const userId = req.user?.id;
    
    console.log(`📦 Produit ID: ${id}`);
    console.log(`👤 Utilisateur ID: ${userId}`);

    // Initialiser la transaction
    t = await sequelize.transaction();
    console.log(`✅ Transaction créée`);

    // 1. Récupérer l'utilisateur connecté
    console.log(`🔍 Recherche utilisateur ${userId}...`);
    const user = await User.findByPk(userId, { 
      attributes: ['id', 'nom', 'role'],
      transaction: t 
    });

    if (!user) {
      console.log(`❌ Utilisateur non trouvé`);
      await t.rollback();
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    console.log(`👤 Utilisateur connecté: ${user.nom}, Rôle: ${user.role}`);

    // 2. Vérifier si l'utilisateur est un spécialiste
    const userRole = user.role;
    const isSpecialist = userRole === 'specialist' || userRole === 'specialiste';
    
    if (!isSpecialist) {
      console.log(`❌ Utilisateur n'est pas un spécialiste: ${userRole}`);
      await t.rollback();
      return res.status(403).json({ 
        success: false,
        message: "Seuls les spécialistes peuvent utiliser cette fonction",
        details: { userRole: userRole }
      });
    }

    console.log(`✅ Utilisateur est un spécialiste`);

    // 3. Vérifier si le produit existe
    console.log(`🔍 Recherche produit ${id}...`);
    const produit = await Produit.findByPk(id, {
      attributes: [
        "id", "code", "nom", "description", "livraison", 
        "prix_gros", "stock", "rupture_stock", "id_fournisseur", 
        "id_categorie", "id_externe", "createdAt", "updatedAt"
      ],
      transaction: t
    });

    if (!produit) {
      console.log(`❌ Produit non trouvé`);
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Produit non trouvé" 
      });
    }

    console.log(`✅ Produit trouvé: ${produit.nom}`);
    console.log(`📋 ID Fournisseur: ${produit.id_fournisseur}`);
    
    // 4. Vérifier si le fournisseur du produit existe et est un admin
    console.log(`🔍 Recherche fournisseur ${produit.id_fournisseur}...`);
    const fournisseur = await User.findByPk(produit.id_fournisseur, {
      attributes: ['id', 'role', 'nom', 'email'],
      transaction: t
    });

    if (!fournisseur) {
      console.log(`❌ Fournisseur non trouvé`);
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Fournisseur du produit non trouvé" 
      });
    }

    console.log(`👨‍💼 Fournisseur du produit: ${fournisseur.nom}, Rôle: ${fournisseur.role}`);

    // 5. Vérifier si le produit appartient à un admin
    const fournisseurRole = fournisseur.role;
    const isAdmin = fournisseurRole === 'admin';
    
    if (!isAdmin) {
      console.log(`❌ Produit n'appartient pas à un admin`);
      await t.rollback();
      return res.status(403).json({ 
        success: false,
        message: "Les spécialistes ne peuvent modifier que les produits des administrateurs",
        details: {
          productOwnerRole: fournisseurRole,
          productOwnerName: fournisseur.nom
        }
      });
    }

    console.log(`✅ Produit appartient à un administrateur`);
    console.log(`✅ Autorisation accordée`);

    // 6. VALIDATION DES DONNÉES
    console.log("=== VALIDATION DES DONNÉES ===");
    console.log("Body reçu:", JSON.stringify(req.body, null, 2));
    console.log("Files reçus:", req.files?.length || 0);

    const { nom, description, livraison, prix_gros } = req.body;
    const stock = req.body.stock !== undefined ? parseInt(req.body.stock, 10) : produit.stock;
    const id_externe = req.body.id_externe;
    const id_categorie = req.body.id_categorie;

    console.log("Champs extraits:", { nom, description, livraison, prix_gros, stock, id_externe, id_categorie });

    // Validation des champs obligatoires
    if (!nom || !nom.trim()) {
      console.log(`❌ Nom manquant`);
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Le nom du produit est requis" 
      });
    }

    if (!id_categorie) {
      console.log(`❌ Catégorie manquante`);
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "La catégorie est requise" 
      });
    }

    // 7. VALIDATION DES VARIATIONS
    let parsedVariations = [];
    if (req.body.variations) {
      console.log(`🔍 Validation des variations...`);
      try {
        parsedVariations = JSON.parse(req.body.variations);
        console.log(`✅ Variations parsées:`, parsedVariations);
        
        if (!Array.isArray(parsedVariations)) {
          console.log(`❌ Variations n'est pas un tableau`);
          await t.rollback();
          return res.status(400).json({ 
            success: false,
            message: "Variations doit être un tableau." 
          });
        }

        // Validation selon le nombre de variations
        if (parsedVariations.length === 1) {
          const v = parsedVariations[0];
          if (!v.couleur && !v.taille) {
            console.log(`❌ Une variation nécessite couleur ou taille`);
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: "Pour une seule variation, au moins la couleur ou la taille doit être renseignée."
            });
          }
          
          if (v.stock !== undefined && String(v.stock).trim() !== "") {
            const vStock = parseInt(v.stock, 10);
            if (isNaN(vStock)) {
              console.log(`❌ Stock variation invalide`);
              await t.rollback();
              return res.status(400).json({ 
                success: false,
                message: "Stock de la variation invalide." 
              });
            }
            if (vStock !== stock) {
              console.log(`❌ Stock variation ≠ stock global`);
              await t.rollback();
              return res.status(400).json({
                success: false,
                message: `Le stock de la seule variation (${vStock}) doit être égal au stock global (${stock}).`
              });
            }
          }
        } else if (parsedVariations.length > 1) {
          let sommeStock = 0;
          for (const v of parsedVariations) {
            if (!v.couleur || !v.taille || v.prix_gros === undefined || v.stock === undefined || String(v.stock).trim() === "") {
              console.log(`❌ Champs variation manquants`);
              await t.rollback();
              return res.status(400).json({
                success: false,
                message: "Toutes les propriétés (couleur, taille, prix_gros, stock) sont obligatoires lorsque plusieurs variations sont ajoutées."
              });
            }
            const vStock = parseInt(v.stock, 10);
            if (isNaN(vStock)) {
              console.log(`❌ Stock variation invalide`);
              await t.rollback();
              return res.status(400).json({ 
                success: false,
                message: "Un stock de variation est invalide." 
              });
            }
            sommeStock += vStock;
          }
          if (sommeStock !== stock) {
            console.log(`❌ Somme stocks ≠ stock global`);
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: `La somme des stocks des variations (${sommeStock}) ne correspond pas au stock global (${stock}).`
            });
          }
        }
        
      } catch (e) {
        console.log(`❌ Erreur parsing variations:`, e.message);
        await t.rollback();
        return res.status(400).json({ 
          success: false,
          message: "Format JSON des variations invalide.",
          error: e.message 
        });
      }
    }

    // 8. VÉRIFICATION ID EXTERNE UNIQUE
    if (id_externe !== undefined && id_externe !== null && id_externe !== produit.id_externe) {
      console.log(`🔍 Vérification ID externe: ${id_externe}`);
      const idExterneStr = String(id_externe).trim();
      if (idExterneStr !== "") {
        const existingProduct = await Produit.findOne({
          where: { 
            id_externe: idExterneStr,
            id: { [Op.ne]: id }
          },
          transaction: t
        });
        
        if (existingProduct) {
          console.log(`❌ ID externe déjà utilisé`);
          await t.rollback();
          return res.status(400).json({ 
            success: false,
            message: "Cet ID externe est déjà utilisé par un autre produit" 
          });
        }
      }
    }

    // 9. VÉRIFICATION ID EXTERNE DES VARIATIONS
    if (parsedVariations.length > 0) {
      console.log(`🔍 Vérification IDs externes variations`);
      for (const v of parsedVariations) {
        if (v.id_externe !== undefined && v.id_externe !== null && v.id_externe !== "") {
          const idExterneVariation = String(v.id_externe).trim();
          if (idExterneVariation !== "") {
            const existingVariation = await Variation.findOne({
              where: { 
                id_externe: idExterneVariation,
                id_produit: { [Op.ne]: id }
              },
              transaction: t
            });
            
            if (existingVariation) {
              console.log(`❌ ID externe variation déjà utilisé: ${idExterneVariation}`);
              await t.rollback();
              return res.status(400).json({ 
                success: false,
                message: `L'ID externe ${idExterneVariation} est déjà utilisé par une autre variation` 
              });
            }
          }
        }
      }
    }

    // 10. PRÉPARATION DES DONNÉES DE MISE À JOUR
    console.log(`📝 Préparation données mise à jour...`);
    const updateData = {
      nom: nom.trim(),
      description: description?.trim() || "",
      livraison: livraison?.trim() || "",
      prix_gros: prix_gros !== undefined && prix_gros !== "" ? parseFloat(prix_gros) : null,
      stock,
      id_categorie: parseInt(id_categorie),
      rupture_stock: stock <= 5,
    };

    // Gestion id_externe
    if (id_externe !== undefined) {
      if (id_externe === null || id_externe === "") {
        updateData.id_externe = null;
      } else {
        updateData.id_externe = String(id_externe).trim() || null;
      }
    }

    console.log(`📋 Données de mise à jour:`, updateData);

    // 11. MISE À JOUR DU PRODUIT
    console.log(`🔄 Mise à jour produit...`);
    await produit.update(updateData, { transaction: t });
    console.log(`✅ Produit mis à jour`);

    // 12. GESTION DES VARIATIONS
    if (parsedVariations.length > 0) {
      console.log(`🔄 Gestion de ${parsedVariations.length} variations`);
      
      // Supprimer les variations existantes
      console.log(`🗑️ Suppression variations existantes...`);
      await Variation.destroy({
        where: { id_produit: id },
        transaction: t
      });
      console.log(`🗑️ Anciennes variations supprimées`);

      // Créer les nouvelles variations
      console.log(`➕ Création nouvelles variations...`);
      const variationsToCreate = parsedVariations.map((v) => {
        const isSingle = parsedVariations.length === 1;
        
        // Stock de la variation
        const vStock = isSingle
          ? (v.stock !== undefined && String(v.stock).trim() !== "" ? parseInt(v.stock, 10) : stock)
          : parseInt(v.stock, 10);

        // Prix de la variation
        const vPrix = v.prix_gros !== undefined && String(v.prix_gros).trim() !== ""
          ? parseFloat(v.prix_gros)
          : (prix_gros !== undefined ? parseFloat(prix_gros) : null);

        // ID externe de la variation
        const vIdExterne = v.id_externe !== undefined && v.id_externe !== null && v.id_externe !== ""
          ? String(v.id_externe).trim() || null
          : null;

        return {
          id_produit: id,
          couleur: v.couleur?.trim() || null,
          taille: v.taille?.trim() || null,
          prix_gros: vPrix,
          stock: vStock,
          id_externe: vIdExterne,
        };
      });

      await Variation.bulkCreate(variationsToCreate, { transaction: t });
      console.log(`✅ ${variationsToCreate.length} variations créées`);
    } else {
      // Si pas de variations, supprimer les existantes
      console.log(`🗑️ Suppression toutes variations...`);
      await Variation.destroy({
        where: { id_produit: id },
        transaction: t
      });
      console.log(`🗑️ Toutes variations supprimées`);
    }

    // 13. GESTION DES MÉDIAS (Cloudinary)
    // Ajouter de nouveaux médias
    if (req.files && req.files.length > 0) {
      console.log(`📁 Ajout de ${req.files.length} nouveaux médias`);
      
      const mediasToCreate = req.files.map((file) => {
        const isVideo = file.mimetype.startsWith("video");
        
        return {
          id_produit: id,
          type: isVideo ? "video" : "image",
          url: file.path,
          public_id: file.filename,
          principale: false,
        };
      });

      await Media.bulkCreate(mediasToCreate, { transaction: t });
      console.log(`✅ ${mediasToCreate.length} nouveaux médias créés`);
    }

    // Supprimer les médias marqués pour suppression
    let cloudinaryDeletions = [];
    if (req.body.mediasToDelete) {
      try {
        const mediasToDelete = JSON.parse(req.body.mediasToDelete);
        
        if (Array.isArray(mediasToDelete) && mediasToDelete.length > 0) {
          console.log(`🗑️ Suppression de ${mediasToDelete.length} médias`);
          
          // Récupérer les médias à supprimer
          console.log(`🔍 Récupération médias à supprimer...`);
          const medias = await Media.findAll({
            where: { id: mediasToDelete, id_produit: id },
            attributes: ['id', 'type'],
            transaction: t
          });

          console.log(`📋 Médias trouvés:`, medias.map(m => m.id));

          // Stocker pour suppression Cloudinary
          for (const media of medias) {
            if (media?.public_id) {
              cloudinaryDeletions.push({
                public_id: media.public_id,
                resource_type: media.type === "video" ? "video" : "image"
              });
            }
          }
          
          // Supprimer de la base de données
          console.log(`🗑️ Suppression de la base...`);
          await Media.destroy({
            where: { id: mediasToDelete, id_produit: id },
            transaction: t
          });
          
          console.log(`✅ ${mediasToDelete.length} médias supprimés de la base`);
        }
      } catch (e) {
        console.warn("⚠️ Erreur lors de la suppression des médias:", e.message);
        // Continuer même en cas d'erreur
      }
    }

    // 14. CHARGER LE PRODUIT MIS À JOUR
    console.log(`📥 Chargement du produit mis à jour...`);
    
    const [medias, variations, categorie] = await Promise.all([
      Media.findAll({
        where: { id_produit: id },
        attributes: ['id', 'url', 'type', 'principale'],
        order: [['createdAt', 'ASC']],
        transaction: t
      }),
      
      Variation.findAll({
        where: { id_produit: id },
        attributes: ['id', 'couleur', 'taille', 'prix_gros', 'stock', 'id_externe'],
        order: [['createdAt', 'ASC']],
        transaction: t
      }),
      
      Categorie.findByPk(produit.id_categorie, {
        attributes: ['id', 'nom'],
        transaction: t
      })
    ]);

    console.log(`✅ Données chargées:`, {
      medias: medias.length,
      variations: variations.length,
      categorie: !!categorie
    });

    // COMMIT
    console.log(`💾 Commit transaction...`);
    await t.commit();
    console.log(`✅ Transaction commitée`);

    // 15. SUPPRIMER DE CLOUDINARY APRÈS LE COMMIT
    if (cloudinaryDeletions.length > 0) {
      console.log(`☁️ Suppression de ${cloudinaryDeletions.length} médias de Cloudinary`);
      
      for (const deletion of cloudinaryDeletions) {
        try {
          await cloudinary.uploader.destroy(deletion.public_id, {
            resource_type: deletion.resource_type
          });
          console.log(`✅ Média ${deletion.public_id} supprimé de Cloudinary`);
        } catch (cloudinaryError) {
          console.warn(`⚠️ Impossible de supprimer ${deletion.public_id} de Cloudinary:`, cloudinaryError.message);
        }
      }
    }

    // 16. PRÉPARER LA RÉPONSE
    const updatedProduit = {
      ...produit.toJSON(),
      medias: medias.map(m => m.toJSON()),
      variations: variations.map(v => v.toJSON()),
      categorie: categorie?.toJSON() || null,
      fournisseur: {
        id: fournisseur.id,
        nom: fournisseur.nom,
        email: fournisseur.email,
        role: fournisseur.role
      },
      updatedBySpecialist: true
    };

    console.log(`🎉 Produit ${id} mis à jour avec succès`);
    console.log("=== FIN updateProductSpecialist ===");

    res.json({ 
      success: true,
      message: "Produit mis à jour avec succès", 
      produit: updatedProduit 
    });

  } catch (error) {
    console.error('❌❌❌ ERREUR CRITIQUE updateProductSpecialist ❌❌❌');
    console.error('Nom erreur:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.errors) {
      console.error('Erreurs Sequelize:', error.errors);
    }
    
    // Rollback seulement si la transaction existe et n'est pas terminée
    if (t && typeof t.rollback === 'function') {
      try {
        console.log(`🔄 Tentative de rollback...`);
        await t.rollback();
        console.log(`🔄 Transaction rollbackée`);
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError);
      }
    } else {
      console.log(`ℹ️ Pas de transaction à rollback`);
    }

    // Gestion des erreurs spécifiques
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Erreur de contrainte d'unicité",
        errors: error.errors ? error.errors.map(e => e.message) : [error.message]
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: "Erreur de validation des données",
        errors: error.errors ? error.errors.map(e => e.message) : [error.message]
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Token d'authentification invalide" 
      });
    }

    // Erreur générale
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la mise à jour du produit",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// Supprimer un produit (seulement les produits admin)
export const deleteProductSpecialist = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    console.log("=== DEBUT deleteProductSpecialist ===");
    console.log(`🗑️ Suppression produit ID: ${id}`);
    console.log(`👤 Utilisateur ID: ${userId}`);

    // 1. Récupérer l'utilisateur connecté
    const user = await User.findByPk(userId, { 
      attributes: ['id', 'nom', 'role'],
      transaction: t 
    });

    if (!user) {
      await t.rollback();
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    console.log(`👤 Utilisateur connecté: ${user.nom}, Rôle: ${user.role}`);

    // 2. Vérifier si l'utilisateur est un spécialiste
    // Comparer le rôle exact comme dans la fonction de création
    const userRole = user.role;
    const isSpecialist = userRole === 'specialist' || userRole === 'specialiste';
    
    if (!isSpecialist) {
      await t.rollback();
      return res.status(403).json({ 
        success: false,
        message: "Seuls les spécialistes peuvent utiliser cette fonction",
        details: { userRole: userRole }
      });
    }

    console.log(`✅ Utilisateur est un spécialiste (rôle: ${userRole})`);

    // 3. Vérifier si le produit existe
    const produit = await Produit.findByPk(id, {
      include: [
        {
          model: Media,
          as: "medias",
          attributes: ['id', 'type']
        }
      ],
      transaction: t
    });

    if (!produit) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Produit non trouvé" 
      });
    }

    console.log(`📦 Produit trouvé: ${produit.nom}`);
    console.log(`👨‍💼 Fournisseur ID: ${produit.id_fournisseur}`);
    
    // 4. Vérifier si le fournisseur du produit existe et est un admin
    const fournisseur = await User.findByPk(produit.id_fournisseur, {
      attributes: ['id', 'role', 'nom', 'email'],
      transaction: t
    });

    if (!fournisseur) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Fournisseur du produit non trouvé" 
      });
    }

    console.log(`👨‍💼 Fournisseur du produit: ${fournisseur.nom}, Rôle: ${fournisseur.role}`);

    // 5. Vérifier si le produit appartient à un admin
    // Même logique que dans createProductSpecialist
    const fournisseurRole = fournisseur.role;
    const isAdmin = fournisseurRole === 'admin';
    
    if (!isAdmin) {
      await t.rollback();
      return res.status(403).json({ 
        success: false,
        message: "Les spécialistes ne peuvent supprimer que les produits des administrateurs",
        details: {
          productOwnerRole: fournisseurRole,
          productOwnerName: fournisseur.nom
        }
      });
    }

    console.log(`✅ Produit appartient à un administrateur (rôle: ${fournisseurRole})`);
    console.log(`✅ Autorisation accordée: Spécialiste peut supprimer le produit d'un admin`);

    // 6. Récupérer toutes les lignes de commande liées à ce produit
    console.log("\n=== Recherche des commandes liées ===");
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

    console.log(`📊 ${lignes.length} ligne(s) de commande trouvée(s) pour ce produit`);

    // 7. Grouper les données par sous-commande et commande
    const sousCommandesData = new Map();
    const commandesData = new Map();
    
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

    // 8. Supprimer toutes les lignes de commande liées au produit
    const allLigneIds = [];
    for (const ligne of lignes) {
      allLigneIds.push(ligne.id);
    }
    
    if (allLigneIds.length > 0) {
      await LigneCommande.destroy({
        where: { id: { [Op.in]: allLigneIds } },
        transaction: t
      });
      console.log(`✅ ${allLigneIds.length} ligne(s) de commande supprimée(s)`);
    }

    // 9. Vérifier chaque sous-commande pour voir si elle a encore des lignes
    console.log("\n=== Vérification des sous-commandes ===");
    const sousCommandesASupprimer = new Set();
    
    for (const [sousCommandeId, data] of sousCommandesData) {
      console.log(`🔍 Vérification sous-commande ${sousCommandeId} (statut: ${data.statut}):`);
      
      // Ne pas supprimer les sous-commandes en cours de livraison ou livrées
      if (data.statut === "livree" || data.statut === "en_cours_livraison" || 
          data.statut === "Réception_dépôt" || data.statut === "Colis enlevé") {
        console.log(`   ⚠️ Sous-commande ${sousCommandeId} en statut "${data.statut}" → CONSERVÉE`);
        continue;
      }
      
      // Vérifier si la sous-commande a d'autres lignes
      const autresLignes = await LigneCommande.count({
        where: { 
          id_sous_commande: sousCommandeId,
          id: { [Op.notIn]: Array.from(data.ligneIds) }
        },
        transaction: t
      });
      
      console.log(`   Autres lignes dans cette sous-commande: ${autresLignes}`);
      
      if (autresLignes === 0) {
        sousCommandesASupprimer.add(sousCommandeId);
        console.log(`   ❌ Sous-commande ${sousCommandeId} sera supprimée (vide)`);
      } else {
        console.log(`   ✅ Sous-commande ${sousCommandeId} conservée (contient ${autresLignes} autres lignes)`);
      }
    }

    // 10. Supprimer les sous-commandes vides
    if (sousCommandesASupprimer.size > 0) {
      await SousCommande.destroy({
        where: { id: { [Op.in]: Array.from(sousCommandesASupprimer) } },
        transaction: t
      });
      console.log(`✅ ${sousCommandesASupprimer.size} sous-commande(s) supprimée(s)`);
    }

    // 11. Vérifier chaque commande pour voir si elle a encore des sous-commandes
    console.log("\n=== Vérification des commandes ===");
    const commandesASupprimer = new Set();
    
    for (const [commandeId, data] of commandesData) {
      console.log(`🔍 Vérification commande ${commandeId} (état: ${data.etat}):`);
      
      // Ne pas supprimer les commandes livrées ou en cours de livraison
      if (data.etat === "livree" || data.etat === "en_cours_livraison" || 
          data.etat === "partiellement_livree") {
        console.log(`   ⚠️ Commande ${commandeId} en état "${data.etat}" → CONSERVÉE`);
        continue;
      }
      
      // Vérifier si la commande a d'autres sous-commandes
      const autresSousCommandes = await SousCommande.count({
        where: { 
          id_commande: commandeId,
          id: { [Op.notIn]: Array.from(data.sousCommandeIds) }
        },
        transaction: t
      });
      
      console.log(`   Autres sous-commandes dans cette commande: ${autresSousCommandes}`);
      
      // Vérifier les sous-commandes qui vont être supprimées
      const sousCommandesDeCetteCommandeASupprimer = Array.from(data.sousCommandeIds).filter(
        id => sousCommandesASupprimer.has(id)
      );
      
      // Calculer combien de sous-commandes resteront
      const sousCommandesRestantes = autresSousCommandes + 
        (data.sousCommandeIds.size - sousCommandesDeCetteCommandeASupprimer.length);
      
      console.log(`   Sous-commandes qui resteront après suppression: ${sousCommandesRestantes}`);
      
      if (sousCommandesRestantes === 0) {
        commandesASupprimer.add(commandeId);
        console.log(`   ❌ Commande ${commandeId} sera supprimée (plus de sous-commandes)`);
      } else {
        console.log(`   ✅ Commande ${commandeId} conservée (aura ${sousCommandesRestantes} sous-commandes)`);
      }
    }

    // 12. Supprimer les commandes vides
    if (commandesASupprimer.size > 0) {
      await Commande.destroy({
        where: { id: { [Op.in]: Array.from(commandesASupprimer) } },
        transaction: t
      });
      console.log(`✅ ${commandesASupprimer.size} commande(s) supprimée(s)`);
      
      // Supprimer les clients associés
      for (const commandeId of commandesASupprimer) {
        const data = commandesData.get(commandeId);
        if (data && data.clientId) {
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
            console.log(`✅ Client ${data.clientId} supprimé (plus de commandes)`);
          } else {
            console.log(`⚠️ Client ${data.clientId} conservé (a ${autresCommandesDuClient} autres commandes)`);
          }
        }
      }
    }

    // 13. Supprimer MesProduit
    await MesProduit.destroy({
      where: { id_produit: id },
      transaction: t
    });
    console.log("✅ MesProduit supprimé");

    // 14. Supprimer les médias Cloudinary
    if (produit.medias && produit.medias.length > 0) {
      console.log(`Suppression de ${produit.medias.length} médias de Cloudinary...`);
      
      for (const media of produit.medias) {
        if (media.public_id) {
          try {
            await cloudinary.uploader.destroy(media.public_id, {
              resource_type: media.type === "video" ? "video" : "image"
            });
            console.log(`✅ Média ${media.public_id} supprimé de Cloudinary`);
          } catch (cloudinaryError) {
            console.warn(`⚠️ Impossible de supprimer ${media.public_id} de Cloudinary:`, cloudinaryError.message);
          }
        }
      }
    }

    // 15. Supprimer les variations
    await Variation.destroy({
      where: { id_produit: id },
      transaction: t
    });
    console.log("✅ Variations supprimées");

    // 16. Supprimer les médias de la base
    await Media.destroy({
      where: { id_produit: id },
      transaction: t
    });
    console.log("✅ Médias supprimés de la base");

    // 17. Supprimer le produit
    await produit.destroy({ transaction: t });
    console.log(`✅ Produit ${id} supprimé`);
    
    // 18. COMMIT
    await t.commit();
    
    res.json({ 
      success: true,
      message: "Produit et dépendances supprimés avec succès",
      produitId: id,
      details: {
        produitNom: produit.nom,
        fournisseurNom: fournisseur.nom,
        fournisseurRole: fournisseur.role,
        userRole: user.role,
        lignesSupprimees: allLigneIds.length,
        sousCommandesSupprimees: sousCommandesASupprimer.size,
        commandesSupprimees: commandesASupprimer.size
      }
    });

  } catch (error) {
    await t.rollback();
    
    console.error('❌ ERREUR deleteProductSpecialist:', error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Impossible de supprimer le produit. Il est probablement référencé dans des commandes ou autres données.",
        suggestion: "Essayez de désactiver le produit plutôt que de le supprimer."
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: "Erreur de validation",
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la suppression",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProductByIdSpecialist = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 getProductByIdSpecialist optimisé pour produit: ${id}`);

    // 1. Récupérer le produit principal
    const produit = await Produit.findByPk(id, {
      attributes: [
        "id", "code", "nom", "description", "livraison", 
        "prix_gros", "stock", "rupture_stock", "id_fournisseur", 
        "id_categorie", "id_externe", "createdAt", "updatedAt"
      ]
    });

    if (!produit) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    console.log(`✅ Produit trouvé: ${produit.nom}`);

    // 2. Vérifier que le fournisseur est un admin
    const fournisseur = await Fournisseur.findOne({
      where: { id_user: produit.id_fournisseur },
      include: [{
        model: User,
        as: "user",
        attributes: ['id', 'role', 'nom', 'email']
      }]
    });

    if (!fournisseur || fournisseur.user.role !== 'admin') {
      return res.status(403).json({ message: "Non autorisé à accéder à ce produit" });
    }

    // 3. Récupérer toutes les relations en PARALLÈLE (OPTIMISATION)
    const [medias, variations, categorie] = await Promise.all([
      // Medias
      Media.findAll({
        where: { id_produit: id },
        attributes: ['id', 'url', 'type', 'principale'],
        order: [['createdAt', 'ASC']]
      }),
      
      // Variations
      Variation.findAll({
        where: { id_produit: id },
        attributes: ['id', 'couleur', 'taille', 'prix_gros', 'stock', 'id_externe'],
        order: [['createdAt', 'ASC']]
      }),
      
      // Catégorie
      Categorie.findByPk(produit.id_categorie, {
        attributes: ['id', 'nom']
      })
    ]);

    console.log(`📊 Relations chargées: ${medias.length} médias, ${variations.length} variations`);

    // 4. Assembler le résultat
    const result = {
      ...produit.toJSON(),
      medias: medias || [],
      variations: variations || [],
      categorie: categorie || null,
      fournisseur: {
        ...fournisseur.toJSON(),
        identifiant_public: fournisseur.identifiant_public
      }
    };

    console.log(`✅ Produit ${id} chargé avec succès`);
    res.json(result);

  } catch (error) {
    console.error('💥 ERREUR getProductByIdSpecialist:', {
      message: error.message,
      produitId: req.params.id
    });

    res.status(500).json({ 
      message: "Erreur lors du chargement du produit",
      error: error.message
    });
  }
};
// Mettre à jour le statut d'un utilisateur - VERSION SÉCURISÉE
export const updateUserStatusSpecialist = async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, validation } = req.body;

    // Vérifier d'abord si l'utilisateur a la permission de gérer les users
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Empêcher la modification des admins et autres spécialistes
    if (user.role === 'admin' || user.role === 'specialiste') {
      return res.status(403).json({ message: "Non autorisé à modifier cet utilisateur" });
    }

    // Vérifier que l'utilisateur est bien un vendeur ou fournisseur
    if (!['vendeur', 'fournisseur'].includes(user.role)) {
      return res.status(403).json({ message: "Type d'utilisateur non autorisé" });
    }

    if (typeof actif !== "undefined") user.actif = !!actif;
    if (typeof validation !== "undefined") user.validation = !!validation;

    await user.save();
    res.json({ message: "Mis à jour", user });

  } catch (error) {
    console.error('Erreur updateUserStatusSpecialist:', error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// Voir les tâches assignées
export const getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { assigned_to: req.user.id };
    
    if (status) where.status = status;

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: {include: ['id', 'nom', 'email'],  exclude: ["mot_de_passe", "refresh_token"] }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erreur getMyTasks:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le statut de sa propre tâche
export const updateMyTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findOne({
      where: { 
        id, 
        assigned_to: req.user.id 
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    await task.update({ status });
    res.json({ message: 'Statut mis à jour', task });

  } catch (error) {
    console.error('Erreur updateMyTaskStatus:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
