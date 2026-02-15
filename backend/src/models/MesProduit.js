// models/MesProduit.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Produit from "./Produit.js";

const MesProduit = sequelize.define("MesProduit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_vendeur: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: "users", key: "id" } 
  },
  id_produit: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: "produits", key: "id" } 
  },
}, { 
  tableName: "mes_produits", 
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
  indexes: [
    { unique: true, fields: ["id_vendeur", "id_produit"] }
  ]
});

// Associations
MesProduit.belongsTo(User, { foreignKey: "id_vendeur" });
MesProduit.belongsTo(Produit, { foreignKey: "id_produit" });

export default MesProduit;