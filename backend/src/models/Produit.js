import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Categorie from "./Categorie.js";
import Variation from "./Variation.js";
import Media from "./Media.js";


const Produit = sequelize.define("Produit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: {
    type: DataTypes.STRING,
    unique: true,
  },
  nom: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  livraison: { type: DataTypes.TEXT, allowNull: true },
  prix_gros: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  id_externe: { type: DataTypes.STRING, unique: true, allowNull: true, },
  variantes_actives: { type: DataTypes.BOOLEAN, defaultValue: false },
  id_fournisseur: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id"} },
  id_categorie: { type: DataTypes.INTEGER, allowNull: true },
  rupture_stock: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: "produits", timestamps: true });



Produit.addHook("beforeSave", (produit) => {
  produit.rupture_stock = produit.stock <= 5;
});

export default Produit;