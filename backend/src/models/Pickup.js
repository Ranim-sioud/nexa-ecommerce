import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Pickup = sequelize.define("Pickup", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  id_fournisseur: { type: DataTypes.INTEGER, allowNull: false },
  id_livreur: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM("demandé", "planifié", "récupéré"), defaultValue: "demandé" },
  // meta contiendra : { sousCommandeIds: [...], notes?: string, poids?: number, nb_colis?: number, etc. }
  meta: { type: DataTypes.JSONB, allowNull: true },
  cree_le: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "pickups",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
});

export default Pickup;