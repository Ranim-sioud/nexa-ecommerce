// models/Vendeur.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js'; // assure-toi que ce fichier exporte le modèle 'User'

const Vendeur = sequelize.define('Vendeur', {
  // clé étrangère vers la table users (id)
  id_user: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },

  code_parrainage: {
    type: DataTypes.STRING(50),
    unique: true
  },

  // champ manquant : référence vers users(id) du parrain
  parraine_par: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    // onDelete ne peut pas être défini directement ici pour toutes les versions de Sequelize,
    // la contrainte est gérée côté BD (voir SQL plus bas)
  },

  solde_portefeuille: {
    type: DataTypes.DECIMAL(12,2),
    defaultValue: 0.00
  },

  pack_cle: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  nom_boutique: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'vendeurs',
  timestamps: true,
  createdAt: 'cree_le',
  updatedAt: 'modifie_le',
  indexes: [
    { unique: true, fields: ["code_parrainage"] },
    { fields: ["parraine_par"] },
  ],
});



export default Vendeur;