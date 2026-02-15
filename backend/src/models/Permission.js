import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Permission = sequelize.define("Permission", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  specialist_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  module: {
    type: DataTypes.ENUM(
      "users", 
      "products", 
      "tickets", 
      "finance", 
      "logistics", 
      "training",
      "features",
      "stock"
    ),
    allowNull: false
  },
  can_view: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_edit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_delete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_manage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  assigned_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: "permissions",
  timestamps: true,
  createdAt: "assigned_at",
  updatedAt: "updated_at"
});

export default Permission;