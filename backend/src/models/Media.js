import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Produit from "./Produit.js";

const Media = sequelize.define("Media", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_produit: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM("image","video"), allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  principale: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: "medias", timestamps: true });


export default Media;