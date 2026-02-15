import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Commande = sequelize.define("Commande", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  id_client: { type: DataTypes.INTEGER, allowNull: false },
  id_vendeur: { type: DataTypes.INTEGER, allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  source: { type: DataTypes.STRING, allowNull: true },
  colis_ouvrable: { type: DataTypes.BOOLEAN, defaultValue: false },
  colis_fragile: { type: DataTypes.BOOLEAN, defaultValue: false },
  demande_confirmation: { type: DataTypes.BOOLEAN, defaultValue: false },
  etat_confirmation: { 
    type: DataTypes.ENUM("en_attente", "confirmee", "annulee"), 
    defaultValue: "en_attente" 
  },
  collis_date: { type: DataTypes.DATE, allowNull: true },
  frais_livraison: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  frais_plateforme: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  etat_commande: { type: DataTypes.ENUM(
    "en_attente",
    "en_cours",
    "livree",
    "annulee",
    "partiellement_livree",
    "partiellement_annulee"
  ),
  defaultValue: "en_attente",
},
}, {
  tableName: "commandes",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
});

export default Commande;