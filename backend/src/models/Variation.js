import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Produit from "./Produit.js";

const Variation = sequelize.define("Variation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_produit: { type: DataTypes.INTEGER, allowNull: false },
  couleur: { type: DataTypes.STRING },
  taille: { type: DataTypes.STRING },
  prix_gros: { type: DataTypes.DECIMAL(12,2) },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  id_externe: { type: DataTypes.STRING, unique: true }
}, { tableName: "variations", timestamps: true });

export default Variation;