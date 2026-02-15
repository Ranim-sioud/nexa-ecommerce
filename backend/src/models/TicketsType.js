import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TicketsType = sequelize.define("TicketsType", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  specialist_user_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "tickets_types",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default TicketsType;