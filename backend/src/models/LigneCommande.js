import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const LigneCommande = sequelize.define("LigneCommande", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sous_commande: { type: DataTypes.INTEGER, allowNull: false },
  id_produit: { type: DataTypes.INTEGER, allowNull: false },
  id_variation: { type: DataTypes.INTEGER, allowNull: true },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  prix_vente: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  prix_gros: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  profit_unitaire: { type: DataTypes.DECIMAL(10,2), allowNull: false }
}, {
  tableName: "lignes_commande",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
});

export default LigneCommande;