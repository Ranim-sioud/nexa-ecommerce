import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Tickets = sequelize.define("Tickets", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  product_code: { type: DataTypes.STRING(100), allowNull: true },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  type_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM("ouvert","en_attente","ferme"), defaultValue: "ouvert" },
  assigned_to: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "tickets",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default Tickets;