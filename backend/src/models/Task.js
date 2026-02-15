import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_by: {
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
  action_required: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("pending", "in_progress", "completed", "cancelled"),
    defaultValue: "pending"
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high", "urgent"),
    defaultValue: "medium"
  }
}, {
  tableName: "tasks",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default Task;