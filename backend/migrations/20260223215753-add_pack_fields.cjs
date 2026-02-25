'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'vendeurs';
    
    // Récupérer les colonnes existantes
    const tableInfo = await queryInterface.describeTable(tableName);
    const columns = Object.keys(tableInfo);
    
    console.log('📊 Colonnes existantes dans vendeurs:', columns);
    
    // Ajouter pack_demande s'il n'existe pas
    if (!columns.includes('pack_demande')) {
      await queryInterface.addColumn(tableName, 'pack_demande', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Colonne pack_demande ajoutée');
    } else {
      console.log('ℹ️ Colonne pack_demande existe déjà');
    }
    
    // Ajouter statut_demande_pack s'il n'existe pas
    if (!columns.includes('statut_demande_pack')) {
      await queryInterface.addColumn(tableName, 'statut_demande_pack', {
        type: Sequelize.ENUM('en_attente', 'approuve', 'refuse', 'aucune'),
        defaultValue: 'aucune',
        allowNull: false
      });
      console.log('✅ Colonne statut_demande_pack ajoutée');
    } else {
      console.log('ℹ️ Colonne statut_demande_pack existe déjà');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'vendeurs';
    
    // Supprimer les colonnes si elles existent
    try {
      await queryInterface.removeColumn(tableName, 'pack_demande');
      console.log('✅ Colonne pack_demande supprimée');
    } catch (e) {
      console.log('ℹ️ Colonne pack_demande non trouvée ou déjà supprimée');
    }
    
    try {
      await queryInterface.removeColumn(tableName, 'statut_demande_pack');
      console.log('✅ Colonne statut_demande_pack supprimée');
      
      // Note: La suppression de l'ENUM nécessite une étape supplémentaire
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_vendeurs_statut_demande_pack";'
      );
    } catch (e) {
      console.log('ℹ️ Colonne statut_demande_pack non trouvée ou déjà supprimée');
    }
  }
};