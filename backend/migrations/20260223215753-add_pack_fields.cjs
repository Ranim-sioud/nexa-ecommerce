'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'vendeurs';

    // On tente d'ajouter les colonnes directement (PostgreSQL est idempotent ici)
    await queryInterface.sequelize.query(`
      ALTER TABLE "${tableName}"
        ADD COLUMN IF NOT EXISTS "pack_demande" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "statut_demande_pack" VARCHAR(20) NOT NULL DEFAULT 'aucune';

      -- Si on veut garder l'ENUM strict (plus propre que STRING)
      -- Mais attention : ALTER TYPE ne supporte pas IF NOT EXISTS, donc on fait en deux étapes
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'enum_vendeurs_statut_demande_pack'
        ) THEN
          CREATE TYPE enum_vendeurs_statut_demande_pack AS ENUM ('en_attente', 'approuve', 'refuse', 'aucune');
        END IF;
      END $$;

      ALTER TABLE "${tableName}"
        ALTER COLUMN "statut_demande_pack" TYPE enum_vendeurs_statut_demande_pack
        USING ("statut_demande_pack"::enum_vendeurs_statut_demande_pack);
    `, { raw: true });

    console.log('✅ Migration pack_demande / statut_demande_pack appliquée (ou déjà présente)');
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'vendeurs';

    await queryInterface.sequelize.query(`
      ALTER TABLE "${tableName}"
        DROP COLUMN IF EXISTS "pack_demande",
        DROP COLUMN IF EXISTS "statut_demande_pack";

      DROP TYPE IF EXISTS enum_vendeurs_statut_demande_pack;
    `, { raw: true });

    console.log('✅ Rollback pack_demande / statut_demande_pack effectué');
  }
};