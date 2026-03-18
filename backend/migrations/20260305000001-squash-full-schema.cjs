'use strict';

/**
 * SQUASHED MIGRATION v2 — Full schema derived from production SQL dump
 *
 * Column types mirror the actual production DB (backup_Nexa.sql):
 *  - users.role, vendeurs.statut_demande_pack, demandes_de_retrait.statut,
 *    medias.type → use real PostgreSQL ENUM types (as in production)
 *  - All other "enum-like" columns → VARCHAR + CHECK constraint (as in production)
 *
 * Every statement uses IF NOT EXISTS / DO $$ so it is safe to run on an
 * empty DB or one that was partially migrated by old individual migrations.
 *
 * Table creation order respects FK dependencies.
 */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;

    // ─── Helper: run raw SQL, swallow "already exists" errors ───────────────
    async function safe(sql) {
      try { await q.query(sql); } catch (e) {
        if (!e.message.includes('already exists')) throw e;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ENUM types actually used as column types in production
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_users_role AS ENUM ('vendeur','fournisseur','admin','specialiste');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_vendeurs_statut_demande_pack
          AS ENUM ('aucune','en_attente','approuvee','refusee');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_demandes_de_retrait_statut AS ENUM ('en_attente','approuve','refuse');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_medias_type AS ENUM ('image','video');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. packs  (no FK deps)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "packs" (
        "id"          SERIAL PRIMARY KEY,
        "cle"         VARCHAR(50)  UNIQUE,
        "titre"       VARCHAR(150),
        "prix"        DECIMAL(10,2),
        "description" TEXT
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 2. categories  (self-referencing parent_id → nullable)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id"        SERIAL PRIMARY KEY,
        "nom"       VARCHAR(255) NOT NULL,
        "parent_id" INTEGER REFERENCES "categories"("id") ON DELETE SET NULL
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. users  (no FK deps) — role uses ENUM (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"                     SERIAL PRIMARY KEY,
        "nom"                    VARCHAR(255) NOT NULL,
        "email"                  VARCHAR(255) UNIQUE NOT NULL,
        "telephone"              VARCHAR(255),
        "mot_de_passe"           VARCHAR(255) NOT NULL,
        "role"                   enum_users_role NOT NULL,
        "gouvernorat"            VARCHAR(255) NOT NULL,
        "ville"                  VARCHAR(255) NOT NULL,
        "adresse"                TEXT NOT NULL,
        "facebook_url"           VARCHAR(255),
        "instagram_url"          VARCHAR(255),
        "actif"                  BOOLEAN DEFAULT FALSE,
        "validation"             BOOLEAN DEFAULT FALSE,
        "image_url"              VARCHAR(255),
        "rib"                    VARCHAR(255),
        "refresh_token"          VARCHAR(255),
        "reset_password_token"   VARCHAR(255),
        "reset_password_expires" TIMESTAMP WITH TIME ZONE,
        "cree_le"                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "modifie_le"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    await safe(`CREATE INDEX IF NOT EXISTS users_reset_token_idx ON "users"("reset_password_token");`);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. fournisseurs  (id_user → users; id is SERIAL PK)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "fournisseurs" (
        "id"                  SERIAL PRIMARY KEY,
        "id_user"             INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "identifiant_public"  VARCHAR(255) UNIQUE NOT NULL,
        "solde_portefeuille"  DECIMAL(12,2) DEFAULT 0
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 5. vendeurs  (id_user PK → users, pack_cle → packs)
    //    statut_demande_pack uses ENUM (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "vendeurs" (
        "id_user"              INTEGER PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "code_parrainage"      VARCHAR(50) UNIQUE,
        "parraine_par"         INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "solde_portefeuille"   DECIMAL(12,2) DEFAULT 0,
        "pack_cle"             VARCHAR(50)  REFERENCES "packs"("cle") ON DELETE SET NULL,
        "pack_demande"         VARCHAR(50),
        "statut_demande_pack"  enum_vendeurs_statut_demande_pack DEFAULT 'aucune',
        "nom_boutique"         VARCHAR(255),
        "cree_le"              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "modifie_le"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    await safe(`CREATE INDEX IF NOT EXISTS vendeurs_parraine_par_idx ON "vendeurs"("parraine_par");`);

    // ═══════════════════════════════════════════════════════════════════════
    // 6. clients  (id_vendeur → users)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id"          SERIAL PRIMARY KEY,
        "prenom"      VARCHAR(255) NOT NULL,
        "nom"         VARCHAR(255) NOT NULL,
        "telephone"   VARCHAR(50)  NOT NULL,
        "email"       VARCHAR(255),
        "adresse"     TEXT NOT NULL,
        "gouvernorat" VARCHAR(100) NOT NULL,
        "ville"       VARCHAR(100) NOT NULL,
        "id_vendeur"  INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "cree_le"     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "modifie_le"  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 7. tickets_types  (specialist_user_id → users)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tickets_types" (
        "id"                  SERIAL PRIMARY KEY,
        "name"                VARCHAR(255) NOT NULL,
        "description"         TEXT,
        "specialist_user_id"  INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 8. permissions  (specialist_id, assigned_by → users)
    //    module uses VARCHAR + CHECK (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id"            SERIAL PRIMARY KEY,
        "specialist_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "module"        VARCHAR(50) NOT NULL
                          CHECK (module IN ('users','products','tickets','finance',
                                            'logistics','training','features','stock')),
        "can_view"      BOOLEAN DEFAULT FALSE,
        "can_edit"      BOOLEAN DEFAULT FALSE,
        "can_delete"    BOOLEAN DEFAULT FALSE,
        "can_manage"    BOOLEAN DEFAULT FALSE,
        "assigned_by"   INTEGER NOT NULL REFERENCES "users"("id"),
        "assigned_at"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 9. tasks  (assigned_to, assigned_by → users)
    //    module/status/priority use VARCHAR + CHECK (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id"              SERIAL PRIMARY KEY,
        "title"           VARCHAR(255) NOT NULL,
        "description"     TEXT,
        "assigned_to"     INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "assigned_by"     INTEGER NOT NULL REFERENCES "users"("id"),
        "module"          VARCHAR(50) NOT NULL
                            CHECK (module IN ('users','products','tickets','finance',
                                              'logistics','training','features','stock')),
        "action_required" VARCHAR(255) NOT NULL,
        "status"          VARCHAR(20) DEFAULT 'pending'
                            CHECK (status IN ('pending','in_progress','completed','cancelled')),
        "due_date"        TIMESTAMP WITH TIME ZONE,
        "priority"        VARCHAR(20) DEFAULT 'medium'
                            CHECK (priority IN ('low','medium','high','urgent')),
        "created_at"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 10. produits  (id_fournisseur, id_user → users, id_categorie → categories)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "produits" (
        "id"                SERIAL PRIMARY KEY,
        "code"              VARCHAR(255) UNIQUE,
        "nom"               VARCHAR(255) NOT NULL,
        "description"       TEXT,
        "livraison"         TEXT,
        "prix_gros"         DECIMAL(12,2),
        "stock"             INTEGER DEFAULT 0,
        "id_externe"        VARCHAR(255) UNIQUE,
        "variantes_actives" BOOLEAN DEFAULT FALSE,
        "id_fournisseur"    INTEGER NOT NULL REFERENCES "users"("id"),
        "id_categorie"      INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "rupture_stock"     BOOLEAN DEFAULT FALSE,
        "id_user"           INTEGER REFERENCES "users"("id"),
        "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 11. variations  (id_produit → produits)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "variations" (
        "id"         SERIAL PRIMARY KEY,
        "id_produit" INTEGER NOT NULL REFERENCES "produits"("id") ON DELETE CASCADE,
        "couleur"    VARCHAR(255),
        "taille"     VARCHAR(255),
        "prix_gros"  DECIMAL(12,2),
        "stock"      INTEGER DEFAULT 0,
        "id_externe" VARCHAR(255) UNIQUE,
        "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 12. medias  (id_produit → produits)
    //    type uses ENUM (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "medias" (
        "id"          SERIAL PRIMARY KEY,
        "id_produit"  INTEGER NOT NULL REFERENCES "produits"("id") ON DELETE CASCADE,
        "type"        enum_medias_type NOT NULL,
        "url"         VARCHAR(255) NOT NULL,
        "principale"  BOOLEAN DEFAULT FALSE,
        "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 13. mes_produits  (id_vendeur → users, id_produit → produits)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "mes_produits" (
        "id"          SERIAL PRIMARY KEY,
        "id_vendeur"  INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "id_produit"  INTEGER NOT NULL REFERENCES "produits"("id") ON DELETE CASCADE,
        "cree_le"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "modifie_le"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("id_vendeur", "id_produit")
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 14. notifications  (id_user → users, id_produit → produits)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id"          SERIAL PRIMARY KEY,
        "id_user"     INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "id_produit"  INTEGER NOT NULL REFERENCES "produits"("id") ON DELETE CASCADE,
        "message"     VARCHAR(255) NOT NULL,
        "vu"          BOOLEAN DEFAULT FALSE,
        "cree_le"     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 15. parrainages  (id_parrain, id_parrained → users)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "parrainages" (
        "id"           SERIAL PRIMARY KEY,
        "id_parrain"   INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "id_parrained" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "niveau"       INTEGER DEFAULT 1,
        "cree_le"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("id_parrain", "id_parrained", "niveau")
      );
    `);
    await safe(`CREATE INDEX IF NOT EXISTS parrainages_parrain_idx   ON "parrainages"("id_parrain");`);
    await safe(`CREATE INDEX IF NOT EXISTS parrainages_parrained_idx ON "parrainages"("id_parrained");`);

    // ═══════════════════════════════════════════════════════════════════════
    // 16. transactions  (id_utilisateur → users)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id"               SERIAL PRIMARY KEY,
        "id_utilisateur"   INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "code_transaction" VARCHAR(50) UNIQUE,
        "type"             VARCHAR(50),
        "montant"          DECIMAL(12,2),
        "meta"             JSONB,
        "cree_le"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 17. demandes_de_retrait  (id_user → users)
    //    statut uses ENUM (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "demandes_de_retrait" (
        "id"            SERIAL PRIMARY KEY,
        "id_user"       INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "montant"       DECIMAL(12,2) NOT NULL,
        "statut"        enum_demandes_de_retrait_statut DEFAULT 'en_attente',
        "cree_le"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "date_paiement" TIMESTAMP WITH TIME ZONE,
        "code_retrait"  VARCHAR(50) UNIQUE NOT NULL
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 18. commandes  (id_client → clients, id_vendeur → users)
    //    etat_confirmation + etat_commande use VARCHAR + CHECK (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "commandes" (
        "id"                    SERIAL PRIMARY KEY,
        "code"                  VARCHAR(50) UNIQUE NOT NULL,
        "id_client"             INTEGER NOT NULL REFERENCES "clients"("id"),
        "id_vendeur"            INTEGER NOT NULL REFERENCES "users"("id"),
        "commentaire"           TEXT,
        "source"                VARCHAR(100),
        "etat_confirmation"     VARCHAR(20) DEFAULT 'en_attente'
                                  CHECK (etat_confirmation IN ('en_attente','confirmee','annulee')),
        "collis_date"           TIMESTAMP WITHOUT TIME ZONE,
        "frais_livraison"       DECIMAL(10,2) DEFAULT 0,
        "frais_plateforme"      DECIMAL(10,2) DEFAULT 0,
        "total"                 DECIMAL(10,2) DEFAULT 0,
        "cree_le"               TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "modifie_le"            TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "colis_ouvrable"        BOOLEAN DEFAULT FALSE,
        "colis_fragile"         BOOLEAN DEFAULT FALSE,
        "demande_confirmation"  BOOLEAN DEFAULT FALSE,
        "etat_commande"         VARCHAR(30) DEFAULT 'en_attente'
                                  CHECK (etat_commande IN ('en_attente','en_cours','livree','annulee',
                                                           'partiellement_livree','partiellement_annulee'))
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 19. sous_commandes  (id_commande → commandes, id_fournisseur → users)
    //    statut uses VARCHAR + CHECK (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "sous_commandes" (
        "id"             SERIAL PRIMARY KEY,
        "code"           VARCHAR(50) UNIQUE NOT NULL,
        "id_commande"    INTEGER NOT NULL REFERENCES "commandes"("id") ON DELETE CASCADE,
        "id_fournisseur" INTEGER NOT NULL REFERENCES "users"("id"),
        "statut"         VARCHAR(30) DEFAULT 'en_attente'
                           CHECK (statut IN (
                             'en_attente','emballage_en_cours','annulee',
                             'Tentative de confirmation 1','Tentative de confirmation 2',
                             'Tentative de confirmation 3','Tentative de confirmation 4',
                             'Tentative de confirmation 5','en_attente_enlevement',
                             'Colis enlevé','Problème d''enlèvement','Réception_dépôt',
                             'en_cours_livraison','Problème de livraison','livree',
                             'Livrée payée','À retourner','Colis retourné',
                             'Retournée payée','Non disponible'
                           )),
        "total"          DECIMAL(10,2) DEFAULT 0,
        "cree_le"        TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "modifie_le"     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 20. lignes_commande  (id_sous_commande → sous_commandes, id_produit → produits)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "lignes_commande" (
        "id"               SERIAL PRIMARY KEY,
        "id_sous_commande" INTEGER NOT NULL REFERENCES "sous_commandes"("id") ON DELETE CASCADE,
        "id_produit"       INTEGER NOT NULL REFERENCES "produits"("id"),
        "id_variation"     INTEGER REFERENCES "variations"("id") ON DELETE SET NULL,
        "quantite"         INTEGER NOT NULL CHECK (quantite > 0),
        "prix_vente"       DECIMAL(10,2) NOT NULL,
        "prix_gros"        DECIMAL(10,2) NOT NULL,
        "profit_unitaire"  DECIMAL(10,2) NOT NULL,
        "cree_le"          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "modifie_le"       TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 21. tickets  (creator_id, assigned_to → users; type_id → tickets_types)
    //    status uses VARCHAR (matches production — no CHECK in dump)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id"           SERIAL PRIMARY KEY,
        "code"         VARCHAR(50)  UNIQUE NOT NULL,
        "title"        VARCHAR(255) NOT NULL,
        "product_code" VARCHAR(100),
        "creator_id"   INTEGER NOT NULL REFERENCES "users"("id"),
        "type_id"      INTEGER NOT NULL REFERENCES "tickets_types"("id"),
        "status"       VARCHAR(30) DEFAULT 'ouvert',
        "assigned_to"  INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at"   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at"   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 22. tickets_messages  (tickets_id → tickets, sender_id → users)
    //    channel uses VARCHAR (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tickets_messages" (
        "id"         SERIAL PRIMARY KEY,
        "tickets_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
        "sender_id"  INTEGER NOT NULL REFERENCES "users"("id"),
        "body"       TEXT NOT NULL,
        "channel"    VARCHAR(30) DEFAULT 'portal',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 23. trackings  (id_commande → commandes, id_sous_commande → sous_commandes)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "trackings" (
        "id"                   SERIAL PRIMARY KEY,
        "id_commande"          INTEGER REFERENCES "commandes"("id") ON DELETE SET NULL,
        "id_sous_commande"     INTEGER REFERENCES "sous_commandes"("id") ON DELETE SET NULL,
        "statut"               VARCHAR(100) NOT NULL,
        "description"          TEXT,
        "tentatives_livraison" INTEGER DEFAULT 0,
        "cree_le"              TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "modifie_le"           TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 24. pickups  (id_fournisseur → fournisseurs)
    //    status uses VARCHAR (matches production)
    //    modifie_le is nullable with no default (matches production)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "pickups" (
        "id"             SERIAL PRIMARY KEY,
        "code"           VARCHAR(100) UNIQUE NOT NULL,
        "id_fournisseur" INTEGER NOT NULL REFERENCES "fournisseurs"("id") ON DELETE CASCADE,
        "id_livreur"     INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "status"         VARCHAR(50) DEFAULT 'demandé',
        "meta"           JSONB,
        "cree_le"        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        "modifie_le"     TIMESTAMP WITHOUT TIME ZONE
      );
    `);

    console.log('✅ Squash migration v2 complete — all 24 tables created (idempotent, matches production schema).');
  },

  async down(queryInterface) {
    // Drop in reverse dependency order
    const tables = [
      'pickups','trackings','tickets_messages','tickets',
      'lignes_commande','sous_commandes','commandes',
      'demandes_de_retrait','transactions','parrainages',
      'notifications','mes_produits','medias','variations','produits',
      'tasks','permissions','tickets_types','clients',
      'vendeurs','fournisseurs','users','categories','packs',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
    }
    // Only drop the 4 ENUM types we actually create
    const types = [
      'enum_users_role',
      'enum_vendeurs_statut_demande_pack',
      'enum_demandes_de_retrait_statut',
      'enum_medias_type',
    ];
    for (const t of types) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${t}" CASCADE;`);
    }
  }
};
