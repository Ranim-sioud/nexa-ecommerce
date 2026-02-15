// models/Notification.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Produit from "./Produit.js";

const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" }
  },

  id_produit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "produits", key: "id" }
  },

  message: {
    type: DataTypes.STRING,
    allowNull: false
  },

  vu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  tableName: "notifications",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: false
});

// Relations
Notification.belongsTo(User, { foreignKey: "id_user" });
Notification.belongsTo(Produit, { foreignKey: "id_produit" });

export default Notification;