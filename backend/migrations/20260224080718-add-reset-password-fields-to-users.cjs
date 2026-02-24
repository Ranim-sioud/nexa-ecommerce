'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');
    
    // Vérifier si reset_password_token existe déjà
    if (!tableInfo.reset_password_token) {
      await queryInterface.addColumn('users', 'reset_password_token', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false
      });
      console.log('✅ Colonne reset_password_token ajoutée');
    } else {
      console.log('ℹ️ Colonne reset_password_token existe déjà');
    }

    // Vérifier si reset_password_expires existe déjà
    if (!tableInfo.reset_password_expires) {
      await queryInterface.addColumn('users', 'reset_password_expires', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Colonne reset_password_expires ajoutée');
    } else {
      console.log('ℹ️ Colonne reset_password_expires existe déjà');
    }

    // Vérifier si l'index existe déjà
    try {
      await queryInterface.addIndex('users', ['reset_password_token'], {
        name: 'users_reset_password_token_idx',
        unique: false
      });
      console.log('✅ Index ajouté');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || 
          error.message.includes('already exists')) {
        console.log('ℹ️ Index existe déjà');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Vérifier avant de supprimer
    try {
      await queryInterface.removeIndex('users', 'users_reset_password_token_idx');
      console.log('✅ Index supprimé');
    } catch (error) {
      console.log('ℹ️ Index déjà supprimé ou inexistant');
    }
    
    try {
      await queryInterface.removeColumn('users', 'reset_password_token');
      console.log('✅ Colonne reset_password_token supprimée');
    } catch (error) {
      console.log('ℹ️ Colonne reset_password_token déjà supprimée ou inexistante');
    }
    
    try {
      await queryInterface.removeColumn('users', 'reset_password_expires');
      console.log('✅ Colonne reset_password_expires supprimée');
    } catch (error) {
      console.log('ℹ️ Colonne reset_password_expires déjà supprimée ou inexistante');
    }
  }
};
