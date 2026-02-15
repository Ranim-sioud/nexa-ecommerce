import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DemandeRetrait = sequelize.define(
  "DemandeRetrait",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_user: { type: DataTypes.INTEGER, allowNull: false },
    code_retrait: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    statut: {
      type: DataTypes.ENUM("en_attente", "approuve", "refuse"),
      defaultValue: "en_attente",
    },
    date_paiement: { type: DataTypes.DATE, allowNull: true }, // utile si tu veux suivre la date réelle du paiement
  },
  {
    tableName: "demandes_de_retrait",
    timestamps: true,
    createdAt: "cree_le",
    updatedAt: false,
  }
);

export default DemandeRetrait;