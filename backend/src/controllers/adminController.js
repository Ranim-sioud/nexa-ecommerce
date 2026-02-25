import { Op } from "sequelize";
import { User, Vendeur, Pack, Fournisseur, Tickets, TicketsType, TicketsMessage, Permission, Task, Produit } from "../models/index.js";

export async function listUsers(req, res) { 
  try {
    const users = await User.findAll({ 
      //where: { validation: true }, // uniquement les utilisateurs validés
      attributes: [
        "id",
        "nom",
        "email", 
        "telephone",
        "role",
        "gouvernorat",
        "ville",
        "adresse",
        "facebook_url",
        "instagram_url",
        "actif",
        "validation",
        "cree_le"
      ],
      include: [
        {
          model: Vendeur,
          as: "vendeur",
          include: [
            {
              model: Pack,
              as: "pack",
              attributes: ['titre'], // juste le nom du pack
            },
          ],
          
        },
        {
          model: Fournisseur,
          as: "fournisseur",
          attributes: ["identifiant_public"], // 🔹 identifiant public seulement
        },
      ],
      
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

  export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, validation } = req.body;
    const currentUser = req.user; // L'utilisateur connecté

    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Logique de permission basée sur le rôle de l'utilisateur connecté
    if (currentUser.role === 'specialiste') {
      // Restrictions pour les spécialistes
      if (userToUpdate.role === 'admin' || userToUpdate.role === 'specialiste') {
        return res.status(403).json({ 
          message: "Non autorisé à modifier cet utilisateur" 
        });
      }
      
      if (!['vendeur', 'fournisseur'].includes(userToUpdate.role)) {
        return res.status(403).json({ 
          message: "Type d'utilisateur non autorisé" 
        });
      }
    }
    // Les admins n'ont pas de restrictions

    // Appliquer les modifications
    if (typeof actif !== "undefined") userToUpdate.actif = !!actif;
    if (typeof validation !== "undefined") userToUpdate.validation = !!validation;

    await userToUpdate.save();
    
    res.json({ 
      message: "Statut utilisateur mis à jour avec succès", 
      user: userToUpdate 
    });

  } catch (error) {
    console.error('Erreur updateUserStatus:', error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

export async function deleteUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    await user.destroy();
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getVendeurPacks(req, res) {
  try {
    const { id } = req.params; // id_user
    const vendeur = await Vendeur.findOne({ where: { id_user: id }, attributes: { exclude: ["mot_de_passe", "refresh_token"] }, });
    if (!vendeur) return res.status(404).json({ message: "Vendeur introuvable" });
    // Si vendeurs stocke pack_cle unique
    const pack = await Pack.findOne({ where: { cle: vendeur.pack_cle } });
    res.json({ vendeur, pack });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}


export async function createType(req, res) {
  try {
    const { name, description, specialist_user_id } = req.body;
    const type = await TicketsType.create({ name, description, specialist_user_id });
    res.json({ type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur create type" });
  }
}

export async function assignTickets(req, res) {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    const tickets = await Tickets.findByPk(id);
    if (!tickets) return res.status(404).json({ message: "Tickets non trouvé" });
    tickets.assigned_to = assigned_to;
    await tickets.save();
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur assignation" });
  }
}

export async function closeTickets(req, res) {
  try {
    const { id } = req.params;
    const tickets = await Tickets.findByPk(id);
    if (!tickets) return res.status(404).json({ message: "Tickets non trouvé" });
    tickets.status = "ferme";
    await tickets.save();
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur fermer tickets" });
  }
}

export async function repondreTicket(req, res) {
  try {
    const { id } = req.params; // id du ticket
    const { body } = req.body;

    const ticket = await Tickets.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });

    if (!body) return res.status(400).json({ message: "Message requis" });

    const newMessage = await TicketsMessage.create({
      tickets_id: ticket.id,
      sender_id: req.user.id, // admin ou spécialiste connecté
      body
    });

    res.status(201).json({ message: "Réponse envoyée", data: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur envoi réponse", error: err.message });
  }
}

export const assignPermission = async (req, res) => {
  try {
    const { specialist_id, module, can_view, can_edit, can_delete, can_manage } = req.body;

    // Vérifier si le spécialiste existe
    const specialist = await User.findOne({
      where: { 
        id: specialist_id, 
        role: 'specialiste' 
      }
    });

    if (!specialist) {
      return res.status(404).json({ message: 'Spécialiste non trouvé' });
    }

    // Créer ou mettre à jour la permission
    const [permission, created] = await Permission.findOrCreate({
      where: {
        specialist_id,
        module
      },
      defaults: {
        specialist_id,
        module,
        can_view: can_view || false,
        can_edit: can_edit || false,
        can_delete: can_delete || false,
        can_manage: can_manage || false,
        assigned_by: req.user.id
      }
    });

    if (!created) {
      await permission.update({
        can_view: can_view !== undefined ? can_view : permission.can_view,
        can_edit: can_edit !== undefined ? can_edit : permission.can_edit,
        can_delete: can_delete !== undefined ? can_delete : permission.can_delete,
        can_manage: can_manage !== undefined ? can_manage : permission.can_manage,
        assigned_by: req.user.id
      });
    }

    res.json({ 
      message: 'Permission assignée avec succès', 
      permission 
    });

  } catch (error) {
    console.error('Erreur assignPermission:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer toutes les permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      include: [
        {
          model: User,
          as: 'specialist',
          attributes: {include: ['id', 'nom', 'email', 'role'],  exclude: ["mot_de_passe", "refresh_token"] }
        },
        {
          model: User,
          as: 'assigner',
          attributes: {include: ['id', 'nom', 'email'],  exclude: ["mot_de_passe", "refresh_token"] }
        }
      ],
      order: [['assigned_at', 'DESC']]
    });

    res.json(permissions);
  } catch (error) {
    console.error('Erreur getPermissions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les permissions d'un spécialiste
export const getSpecialistPermissions = async (req, res) => {
  try {
    const { specialist_id } = req.params;

    const permissions = await Permission.findAll({
      where: { specialist_id },
      include: [
        {
          model: User,
          as: 'assigner',
          attributes: {include: ['id', 'nom', 'email'],  exclude: ["mot_de_passe", "refresh_token"] }
        }
      ]
    });

    res.json(permissions);
  } catch (error) {
    console.error('Erreur getSpecialistPermissions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une permission
export const removePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission non trouvée' });
    }

    await permission.destroy();
    res.json({ message: 'Permission supprimée avec succès' });

  } catch (error) {
    console.error('Erreur removePermission:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Assigner une tâche à un spécialiste
export const assignTask = async (req, res) => {
  try {
    const { 
      assigned_to, 
      title, 
      description, 
      module, 
      action_required, 
      due_date, 
      priority 
    } = req.body;

    // Vérifier si l'assigné existe et est un spécialiste
    const assignee = await User.findOne({
      where: { 
        id: assigned_to, 
        role: 'specialiste' 
      }
    });

    if (!assignee) {
      return res.status(404).json({ message: 'Spécialiste non trouvé' });
    }

    const task = await Task.create({
      assigned_to,
      assigned_by: req.user.id,
      title,
      description,
      module,
      action_required,
      due_date: due_date ? new Date(due_date) : null,
      priority: priority || 'medium',
      status: 'pending'
    });

    // Charger les relations pour la réponse
    const taskWithRelations = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'nom', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'email']
        }
      ]
    });

    res.status(201).json({ 
      message: 'Tâche assignée avec succès', 
      task: taskWithRelations 
    });

  } catch (error) {
    console.error('Erreur assignTask:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les tâches
export const getTasks = async (req, res) => {
  try {
    const { status, assigned_to } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (assigned_to) where.assigned_to = assigned_to;

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: {include: ['id', 'nom', 'email'],  exclude: ["mot_de_passe", "refresh_token"] }
        },
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
    console.error('Erreur getTasks:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'une tâche
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    await task.update({ status });
    res.json({ message: 'Statut mis à jour', task });

  } catch (error) {
    console.error('Erreur updateTaskStatus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les spécialistes
export const getSpecialists = async (req, res) => {
  try {
    const specialists = await User.findAll({
      where: { role: 'specialiste' },
      attributes: ['id', 'nom', 'email', 'telephone', 'actif', 'cree_le'],
        include: [  // ← DÉCOMMENTEZ CES LIGNES
          {
            model: Permission,
            as: 'permissions', // Assurez-vous que cet alias correspond à votre relation
            attributes: ['module', 'can_view', 'can_edit', 'can_delete', 'can_manage']
          },
          {
            model: Task,
            as: 'assigned_tasks', // Assurez-vous que cet alias correspond à votre relation
            attributes: ['id', 'title', 'status', 'priority'],
            where: { 
              // Optionnel: filtrer seulement les tâches non terminées
              status: { [Op.not]: 'completed' } 
            },
            required: false // Important: LEFT JOIN pour inclure même sans tâches
          }
        ],
        order: [['cree_le', 'DESC']]
      });

    res.json(specialists);
  } catch (error) {
    console.error('Erreur getSpecialists:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Tableau de bord admin
export const getAdminDashboard = async (req, res) => { 
  try {
    const [totalUsers, totalSpecialists, activeSpecialists, totalProducts, pendingTasks, openTickets] = await Promise.all([
      User.count({
        where: { role: { [Op.in]: ['vendeur', 'fournisseur'] } }
      }),

      User.count({
        where: { role: 'specialiste' }
      }),

      // ✅ Corrigé selon ton modèle
      User.count({
        where: { 
          role: 'specialiste',
          actif: true  // <-- remplace par le bon champ si différent
        }
      }),

      Produit.count(),

      Task.count({ where: { status: 'pending' } }),

      Tickets.count({ where: { status: 'ouvert' } })
    ]);

    const recentTasks = await Task.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'nom', 'email']
        }
      ]
    });

    const specialistsWithPermissions = await User.findAll({
      where: { role: 'specialiste' },
      attributes: ['id', 'nom', 'email', 'actif'], // <-- adapte ici aussi
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['module', 'can_view', 'can_edit', 'can_manage']
        }
      ],
      limit: 10
    });

    res.json({
      stats: {
        total_users: totalUsers,
        total_specialists: totalSpecialists,
        active_specialists: activeSpecialists,
        total_products: totalProducts,
        pending_tasks: pendingTasks,
        open_tickets: openTickets
      },
      recent_tasks: recentTasks,
      specialists: specialistsWithPermissions
    });
    
  } catch (error) {
    console.error('Erreur getAdminDashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Traiter une demande de pack (approuver/refuser) - admin
export async function traiterDemandePack(req, res) {
  try {
    const { userId } = req.params;
    const { decision } = req.body;

    if (!["approuvee", "refusee"].includes(decision)) {
      return res.status(400).json({ message: "Action invalide" });
    }

    const vendeur = await Vendeur.findOne({
      where: { id_user: userId }
    });

    if (!vendeur) {
      return res.status(404).json({ message: "Vendeur introuvable" });
    }

    if (vendeur.statut_demande_pack !== "en_attente") {
      return res.status(400).json({
        message: "Aucune demande en attente"
      });
    }

    if (decision === "approuvee") {
      vendeur.pack_cle = vendeur.pack_demande;
      vendeur.statut_demande_pack = "approuvee";
    } else {
      vendeur.statut_demande_pack = "refusee";
    }

    vendeur.pack_demande = null;

    await vendeur.save();

    res.json({ message: `Demande ${decision} avec succès ✅` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}