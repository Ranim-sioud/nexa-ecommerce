'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'vendeurs';

    // 1. Créer la table si elle n'existe pas (structure complète du model Vendeur + champs manquants)
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        "id" SERIAL PRIMARY KEY,
        "id_user" INTEGER NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        "pack_cle" VARCHAR(50) REFERENCES "packs"(cle),
        "pack_demande" VARCHAR(255),
        "statut_demande_pack" VARCHAR(20) NOT NULL DEFAULT 'aucune',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Créer l'ENUM si absent
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_vendeurs_statut_demande_pack') THEN
          CREATE TYPE enum_vendeurs_statut_demande_pack AS ENUM ('en_attente', 'approuve', 'refuse', 'aucune');
        END IF;
      END $$;
    `);

    // 3. Convertir la colonne en ENUM (safe même si déjà VARCHAR)
    await queryInterface.sequelize.query(`
      ALTER TABLE "${tableName}"
        ALTER COLUMN "statut_demande_pack" TYPE enum_vendeurs_statut_demande_pack
        USING ("statut_demande_pack"::enum_vendeurs_statut_demande_pack);
    `);

    console.log('✅ Table vendeurs créée (ou déjà présente) + colonnes pack ajoutées + ENUM géré');
  },

  async down(queryInterface, Sequelize) {
    // On ne drop pas en prod par sécurité — mais pour dev/test tu peux
    console.log('ℹ️ Down : rien droppé pour protéger les données vendeurs');
    // Si tu veux vraiment rollback (dev only) :
    // await queryInterface.dropTable('vendeurs', { cascade: true });
  }
};