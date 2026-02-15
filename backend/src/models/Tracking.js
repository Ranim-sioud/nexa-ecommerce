import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Tracking = sequelize.define("Tracking", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_commande: { type: DataTypes.INTEGER, allowNull: true },
  id_sous_commande: { type: DataTypes.INTEGER, allowNull: true },
  statut: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  tentatives_livraison: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: "trackings",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
});

export default Tracking;