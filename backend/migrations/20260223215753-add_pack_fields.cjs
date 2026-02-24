'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter les colonnes
    await queryInterface.addColumn('vendeurs', 'pack_demande', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('vendeurs', 'statut_demande_pack', {
      type: Sequelize.ENUM('accepte', 'refuse', 'en_attente'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes si rollback
    await queryInterface.removeColumn('vendeurs', 'pack_demande');
    await queryInterface.removeColumn('vendeurs', 'statut_demande_pack');

    // Supprimer l’enum de PostgreSQL
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_vendeurs_statut_demande_pack";'
    );
  },
};