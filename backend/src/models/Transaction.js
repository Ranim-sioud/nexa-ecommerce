import { DataTypes } from 'sequelize';
import sequelize from "../config/database.js";

const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilisateur: { type: DataTypes.INTEGER },
    code_transaction: { type: DataTypes.STRING(50), unique: true },
    type: DataTypes.STRING(50),
    montant: DataTypes.DECIMAL(12,2),
    meta: DataTypes.JSONB
  }, { tableName: 'transactions', timestamps: true, createdAt: 'cree_le', updatedAt: false });
 
export default Transaction;

