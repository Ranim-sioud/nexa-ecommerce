import { DataTypes } from 'sequelize';
import sequelize from "../config/database.js";

const Parrainage = sequelize.define('Parrainage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_parrain: DataTypes.INTEGER,
    id_parrained: DataTypes.INTEGER,
    niveau: { type: DataTypes.INTEGER, defaultValue: 1 }
  }, { tableName: 'parrainages', timestamps: true, createdAt: 'cree_le', updatedAt: false,
    indexes: [
    { fields: ["id_parrain"] },
    { fields: ["id_parrained"] },
    { unique: true, fields: ["id_parrain", "id_parrained", "niveau"] },
  ],
   });

export default Parrainage;