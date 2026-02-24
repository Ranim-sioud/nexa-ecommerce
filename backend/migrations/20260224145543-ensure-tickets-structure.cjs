'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier si la table existe
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('tickets')) {
      // Si la table n'existe PAS, on la crée (cas improbable)
      console.log('ℹ️ Création de la table tickets...');
      await queryInterface.createTable('tickets', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        title: { type: Sequelize.STRING(255), allowNull: false },
        product_code: { type: Sequelize.STRING(100), allowNull: true },
        creator_id: { type: Sequelize.INTEGER, allowNull: false },
        type_id: { type: Sequelize.INTEGER, allowNull: false },
        status: { 
          type: Sequelize.ENUM('ouvert', 'en_attente', 'ferme'), 
          defaultValue: 'ouvert' 
        },
        assigned_to: { type: Sequelize.INTEGER, allowNull: true },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      console.log('✅ Table tickets créée');
    } else {
      // La table existe déjà - on vérifie les colonnes
      console.log('ℹ️ La table tickets existe déjà, vérification des colonnes...');
      
      const tableInfo = await queryInterface.describeTable('tickets');
      const columns = Object.keys(tableInfo);
      
      // Liste des colonnes requises
      const requiredColumns = [
        'id', 'code', 'title', 'product_code', 'creator_id', 
        'type_id', 'status', 'assigned_to', 'created_at', 'updated_at'
      ];
      
      for (const col of requiredColumns) {
        if (!columns.includes(col)) {
          console.log(`⚠️ Colonne manquante: ${col} - À ajouter manuellement si nécessaire`);
          // Optionnel : ajouter la colonne manquante
          // Attention: ajouter des colonnes à une table existante peut être risqué
        }
      }
      
      // Vérifier spécifiquement le type ENUM de status
      try {
        // Cette requête SQL vérifie le type de la colonne status
        const [result] = await queryInterface.sequelize.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = 'tickets' AND column_name = 'status'
        `);
        
        if (result.length > 0 && result[0].data_type !== 'USER-DEFINED') {
          console.log('⚠️ La colonne status n\'est pas un ENUM - Adaptation nécessaire');
          // Pour convertir en ENUM sans perdre les données :
          // 1. Créer un type ENUM temporaire
          // 2. Mettre à jour la colonne
        }
      } catch (error) {
        console.log('ℹ️ Impossible de vérifier le type de status');
      }
      
      console.log('✅ Vérification de la table tickets terminée');
    }
  },

  async down(queryInterface, Sequelize) {
    // Ne rien faire en down pour protéger les données
    console.log('ℹ️ Opération annulée - Table tickets préservée');
  }
};