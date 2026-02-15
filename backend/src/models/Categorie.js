import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Categorie = sequelize.define("Categorie", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  parent_id: { type: DataTypes.INTEGER, allowNull: true } // pour sous-catégories
}, { tableName: "categories", timestamps: false, createdAt: "created_at",
  updatedAt: "updated_at" });

export default Categorie;