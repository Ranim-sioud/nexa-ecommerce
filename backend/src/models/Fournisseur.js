import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Fournisseur = sequelize.define("Fournisseur", {
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  identifiant_public: { type: DataTypes.STRING, unique: true, allowNull: false },
  solde_portefeuille: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
}, {
    tableName: "fournisseurs",
    timestamps: false,
});


export default Fournisseur;