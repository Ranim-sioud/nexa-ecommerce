'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cette migration va créer une table SequelizeMeta 
    // pour tracker les migrations futures
    // Comme ta base existe déjà, on ne crée rien ici
    console.log('Migration init: OK - base existante reconnue');
  },

  async down(queryInterface, Sequelize) {
    // Rien à rollback
    console.log('Rollback init migration');
  }
};