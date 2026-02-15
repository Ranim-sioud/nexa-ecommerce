import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Client = sequelize.define("Client", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  prenom: { type: DataTypes.STRING, allowNull: false },
  nom: { type: DataTypes.STRING, allowNull: false },
  telephone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  adresse: { type: DataTypes.TEXT, allowNull: false },
  gouvernorat: { type: DataTypes.STRING, allowNull: false },
  ville: { type: DataTypes.STRING, allowNull: false },
  id_vendeur: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: "clients",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
});

export default Client;