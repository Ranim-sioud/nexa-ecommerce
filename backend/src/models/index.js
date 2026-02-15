import sequelize from '../config/database.js';
import User from './User.js';
import Vendeur from './Vendeur.js';
import Fournisseur from './Fournisseur.js';
import Pack from './Pack.js';
import Transaction from './Transaction.js';
import Parrainage from './Parrainage.js';
import DemandeRetrait from './DemandeRetrait.js';
import Produit from './Produit.js';
import Variation from './Variation.js';
import Categorie from './Categorie.js';
import Media from './Media.js';
import MesProduit from './MesProduit.js';
import Tickets from './Tickets.js';
import TicketsType from './TicketsType.js';
import TicketsMessage from './TicketsMessage.js';
import Permission from './Permission.js';
import Task from './Task.js';
import Commande from './Commande.js';
import Client from './Client.js';
import SousCommande from './SousCommande.js';
import LigneCommande from './LigneCommande.js';
import Tracking from './Tracking.js';
import Pickup from './Pickup.js';

/// Associations

// User ↔ Vendeur
User.hasOne(Vendeur, { foreignKey: "id_user", onDelete: "CASCADE", as: "vendeur" });
Vendeur.belongsTo(User, { foreignKey: "id_user", as: "utilisateur" });

// Parrainage (vendeurs filleuls)
Vendeur.belongsTo(User, { foreignKey: "parraine_par", as: "parrain" });
User.hasMany(Vendeur, { foreignKey: "parraine_par", as: "filleuls" });

// User ↔ Fournisseur
User.hasOne(Fournisseur, { foreignKey: "id_user", onDelete: "CASCADE", as: "fournisseur" });
Fournisseur.belongsTo(User, { foreignKey: "id_user" , as: "user" });
Produit.belongsTo(Fournisseur, { foreignKey: "id_fournisseur", as: "fournisseur" });
Fournisseur.hasMany(Produit, { foreignKey: "id_fournisseur", as: "produits"});


// User ↔ Transaction
User.hasMany(Transaction, { foreignKey: "id_utilisateur", as: "transactions" });
Transaction.belongsTo(User, { foreignKey: "id_utilisateur" });

// User ↔ DemandeRetrait
User.hasMany(DemandeRetrait, { foreignKey: "id_user" });
DemandeRetrait.belongsTo(User, { foreignKey: "id_user", as: "user" });

User.hasMany(Produit, { foreignKey: "id_fournisseur", as: "produits" });

Pack.hasMany(Vendeur, { foreignKey: "pack_cle", sourceKey: "cle", as: "vendeurs" });
Vendeur.belongsTo(Pack, { foreignKey: "pack_cle", targetKey: "cle", as: "pack" });
MesProduit.belongsTo(Produit, { foreignKey: "id_produit" , as: "produit" });
Produit.hasMany(MesProduit, { foreignKey: "id_produit", as: "vendeurs" });

MesProduit.belongsTo(User, { foreignKey: "id_vendeur" }); //
User.hasMany(MesProduit, { foreignKey: "id_vendeur" }); //

Produit.hasMany(Variation, { foreignKey: "id_produit", as: "variations", onDelete: "CASCADE" });
Variation.belongsTo(Produit, { foreignKey: "id_produit", as: "produit" });

Categorie.hasMany(Produit, { foreignKey: "id_categorie" });
Produit.belongsTo(Categorie, { foreignKey: "id_categorie", as: "categorie" });

Produit.hasMany(Media, { foreignKey: "id_produit", as: "medias", onDelete: "CASCADE" });
Media.belongsTo(Produit, { foreignKey: "id_produit", as: "produit" , onDelete: "CASCADE" });

Produit.belongsTo(User, { foreignKey: "id_user", as: "user" });


// tickets chat

User.hasMany(Tickets, { foreignKey: "creator_id" });
Tickets.belongsTo(User, { foreignKey: "creator_id", as: "creator" });

TicketsType.hasMany(Tickets, { foreignKey: "type_id" });
Tickets.belongsTo(TicketsType, { foreignKey: "type_id", as: "type" });

User.hasMany(Tickets, { foreignKey: "assigned_to", as: "assigned_tickets" });
Tickets.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });

Tickets.hasMany(TicketsMessage, { foreignKey: "tickets_id" });
TicketsMessage.belongsTo(Tickets, { foreignKey: "tickets_id" });

User.hasMany(TicketsMessage, { foreignKey: "sender_id" });
TicketsMessage.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

// TicketType -> specialist
TicketsType.belongsTo(User, { foreignKey: "specialist_user_id", as: "specialist" });

// Relations Permission
Permission.belongsTo(User, { foreignKey: 'specialist_id', as: 'specialist' });
Permission.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

// Relations Task
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'assigned_by', as: 'creator' });

User.hasMany(Permission, { 
  foreignKey: 'specialist_id', 
  as: 'permissions' 
});

// Relations User -> Task (tâches assignées)
User.hasMany(Task, { 
  foreignKey: 'assigned_to', 
  as: 'assigned_tasks' 
});

// Relations User -> Task (tâches créées)
User.hasMany(Task, { 
  foreignKey: 'assigned_by', 
  as: 'created_tasks' 
});


Commande.belongsTo(User, { foreignKey: "id_vendeur", as: "vendeur" });
Commande.belongsTo(Client, { foreignKey: "id_client", as: "client" });
User.hasMany(Commande, { foreignKey: "id_vendeur", as: "commandes" });
Client.hasMany(Commande, { foreignKey: "id_client", as: "commandes" });

// SousCommande associations
SousCommande.belongsTo(Commande, { foreignKey: "id_commande", as: "commande" });
SousCommande.belongsTo(User, { foreignKey: "id_fournisseur", as: "fournisseur" });
Commande.hasMany(SousCommande, { foreignKey: "id_commande", as: "sous_commandes" });
User.hasMany(SousCommande, { foreignKey: "id_fournisseur", as: "sous_commandes_fournisseur" });

// LigneCommande associations
LigneCommande.belongsTo(SousCommande, { foreignKey: "id_sous_commande", as: "sous_commande" });
LigneCommande.belongsTo(Produit, { foreignKey: "id_produit", as: "produit" });
LigneCommande.belongsTo(Variation, { foreignKey: "id_variation", as: "variation" });
Produit.hasMany(LigneCommande, {
  foreignKey: 'id_produit',
  as: 'lignes_commande'
});
SousCommande.hasMany(LigneCommande, { foreignKey: "id_sous_commande", as: "lignes" });

// Tracking associations
Tracking.belongsTo(SousCommande, { foreignKey: "id_sous_commande", as: "sous_commande" });
SousCommande.hasMany(Tracking, { foreignKey: "id_sous_commande", as: "historique_tracking" });

Tracking.belongsTo(Commande, { foreignKey: "id_commande", as: "commande" });
Commande.hasMany(Tracking, { foreignKey: "id_commande", as: "historique_commande" });

// Client associations
Client.belongsTo(User, { foreignKey: "id_vendeur", as: "vendeur" });
User.hasMany(Client, { foreignKey: "id_vendeur", as: "clients" });

Pickup.belongsTo(Fournisseur, { foreignKey: "id_fournisseur", as: "fournisseur" });
Fournisseur.hasMany(Pickup, { foreignKey: "id_fournisseur", as: "pickups" });




export {
  sequelize,
  User,
  Vendeur,
  Fournisseur,
  Pack,
  Transaction,
  Parrainage,
  DemandeRetrait,
  Produit,
  Variation,
  Media,
  Categorie,
  MesProduit,
  Tickets,
  TicketsType,
  TicketsMessage,
  Permission,
  Task,
  Commande,
  SousCommande,
  LigneCommande,
  Tracking,
  Client,
  Pickup

};