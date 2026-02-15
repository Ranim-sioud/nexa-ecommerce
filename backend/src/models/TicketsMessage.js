import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TicketsMessage = sequelize.define("TicketsMessage", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tickets_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  channel: { type: DataTypes.ENUM("portal","phone","whatsapp","email"), defaultValue: "portal" }
}, {
  tableName: "tickets_messages",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

export default TicketsMessage;