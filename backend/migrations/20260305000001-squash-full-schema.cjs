'use strict';

/**
 * SQUASHED MIGRATION — Full schema v1
 *
 * Replaces all previous migrations. Every statement uses IF NOT EXISTS / DO $$
 * so it is safe to run on an empty DB or one that was partially migrated.
 *
 * Table creation order respects FK dependencies.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;

    // ─── Helper: run raw SQL, swallow "already exists" errors ───────────────
    async function safe(sql) {
      try { await q.query(sql); } catch (e) {
        if (!e.message.includes('already exists')) throw e;
      }
    }

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
    // 3. users  (no FK deps)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_users_role AS ENUM ('vendeur','fournisseur','admin','specialiste');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
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
        "cree_le"                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await safe(`CREATE INDEX IF NOT EXISTS users_reset_token_idx ON "users"("reset_password_token");`);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. fournisseurs  (id_user → users)
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
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_vendeurs_statut_demande_pack
          AS ENUM ('aucune','en_attente','approuvee','refusee');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
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
        "cree_le"              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        "telephone"   VARCHAR(255) NOT NULL,
        "email"       VARCHAR(255),
        "adresse"     TEXT NOT NULL,
        "gouvernorat" VARCHAR(255) NOT NULL,
        "ville"       VARCHAR(255) NOT NULL,
        "id_vendeur"  INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "cree_le"     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        "created_at"          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at"          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 8. permissions  (specialist_id, assigned_by → users)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_permissions_module
          AS ENUM ('users','products','tickets','finance','logistics','training','features','stock');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id"            SERIAL PRIMARY KEY,
        "specialist_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "module"        enum_permissions_module NOT NULL,
        "can_view"      BOOLEAN DEFAULT FALSE,
        "can_edit"      BOOLEAN DEFAULT FALSE,
        "can_delete"    BOOLEAN DEFAULT FALSE,
        "can_manage"    BOOLEAN DEFAULT FALSE,
        "assigned_by"   INTEGER NOT NULL REFERENCES "users"("id"),
        "assigned_at"   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at"    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 9. tasks  (assigned_to, assigned_by → users)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_tasks_module
          AS ENUM ('users','products','tickets','finance','logistics','training','features','stock');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_tasks_status AS ENUM ('pending','in_progress','completed','cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_tasks_priority AS ENUM ('low','medium','high','urgent');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id"              SERIAL PRIMARY KEY,
        "title"           VARCHAR(255) NOT NULL,
        "description"     TEXT,
        "assigned_to"     INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "assigned_by"     INTEGER NOT NULL REFERENCES "users"("id"),
        "module"          enum_tasks_module NOT NULL,
        "action_required" VARCHAR(255) NOT NULL,
        "status"          enum_tasks_status DEFAULT 'pending',
        "due_date"        TIMESTAMP WITH TIME ZONE,
        "priority"        enum_tasks_priority DEFAULT 'medium',
        "created_at"      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at"      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 10. produits  (id_fournisseur → users, id_categorie → categories)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "produits" (
        "id"               SERIAL PRIMARY KEY,
        "code"             VARCHAR(255) UNIQUE,
        "nom"              VARCHAR(255) NOT NULL,
        "description"      TEXT,
        "livraison"        TEXT,
        "prix_gros"        DECIMAL(12,2),
        "stock"            INTEGER DEFAULT 0,
        "id_externe"       VARCHAR(255) UNIQUE,
        "variantes_actives" BOOLEAN DEFAULT FALSE,
        "id_fournisseur"   INTEGER NOT NULL REFERENCES "users"("id"),
        "id_categorie"     INTEGER REFERENCES "categories"("id") ON DELETE SET NULL,
        "rupture_stock"    BOOLEAN DEFAULT FALSE,
        "id_user"          INTEGER REFERENCES "users"("id"),
        "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        "createdAt"  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt"  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 12. medias  (id_produit → produits)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_medias_type AS ENUM ('image','video');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "medias" (
        "id"          SERIAL PRIMARY KEY,
        "id_produit"  INTEGER NOT NULL REFERENCES "produits"("id") ON DELETE CASCADE,
        "type"        enum_medias_type NOT NULL,
        "url"         VARCHAR(255) NOT NULL,
        "principale"  BOOLEAN DEFAULT FALSE,
        "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        "cree_le"     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
        "cree_le"     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        "cree_le"      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
        "cree_le"          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 17. demandes_de_retrait  (id_user → users)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_demandes_de_retrait_statut AS ENUM ('en_attente','approuve','refuse');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "demandes_de_retrait" (
        "id"           SERIAL PRIMARY KEY,
        "id_user"      INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "code_retrait" VARCHAR(50) UNIQUE NOT NULL,
        "montant"      DECIMAL(12,2) NOT NULL,
        "statut"       enum_demandes_de_retrait_statut DEFAULT 'en_attente',
        "date_paiement" TIMESTAMP WITH TIME ZONE,
        "cree_le"      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 18. commandes  (id_client → clients, id_vendeur → users)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_commandes_etat_confirmation AS ENUM ('en_attente','confirmee','annulee');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_commandes_etat_commande AS ENUM (
          'en_attente','en_cours','livree','annulee',
          'partiellement_livree','partiellement_annulee'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "commandes" (
        "id"                    SERIAL PRIMARY KEY,
        "code"                  VARCHAR(255) UNIQUE NOT NULL,
        "id_client"             INTEGER NOT NULL REFERENCES "clients"("id"),
        "id_vendeur"            INTEGER NOT NULL REFERENCES "users"("id"),
        "commentaire"           TEXT,
        "source"                VARCHAR(255),
        "colis_ouvrable"        BOOLEAN DEFAULT FALSE,
        "colis_fragile"         BOOLEAN DEFAULT FALSE,
        "demande_confirmation"  BOOLEAN DEFAULT FALSE,
        "etat_confirmation"     enum_commandes_etat_confirmation DEFAULT 'en_attente',
        "collis_date"           TIMESTAMP WITH TIME ZONE,
        "frais_livraison"       DECIMAL(10,2) DEFAULT 0,
        "frais_plateforme"      DECIMAL(10,2) DEFAULT 0,
        "total"                 DECIMAL(10,2) DEFAULT 0,
        "etat_commande"         enum_commandes_etat_commande DEFAULT 'en_attente',
        "cree_le"               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 19. sous_commandes  (id_commande → commandes, id_fournisseur → users)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_sous_commandes_statut AS ENUM (
          'en_attente','emballage_en_cours','annulee',
          'Tentative de confirmation 1','Tentative de confirmation 2',
          'Tentative de confirmation 3','Tentative de confirmation 4',
          'Tentative de confirmation 5','en_attente_enlevement','Colis enlevé',
          'Problème d''enlèvement','Réception_dépôt','en_cours_livraison',
          'Problème de livraison','livree','Livrée payée','À retourner',
          'Colis retourné','Retournée payée','Non disponible'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "sous_commandes" (
        "id"            SERIAL PRIMARY KEY,
        "code"          VARCHAR(255) UNIQUE NOT NULL,
        "id_commande"   INTEGER NOT NULL REFERENCES "commandes"("id") ON DELETE CASCADE,
        "id_fournisseur" INTEGER NOT NULL REFERENCES "users"("id"),
        "statut"        enum_sous_commandes_statut DEFAULT 'en_attente',
        "total"         DECIMAL(10,2) DEFAULT 0,
        "cree_le"       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 20. lignes_commande  (id_sous_commande → sous_commandes, id_produit → produits)
    // ═══════════════════════════════════════════════════════════════════════
    await q.query(`
      CREATE TABLE IF NOT EXISTS "lignes_commande" (
        "id"              SERIAL PRIMARY KEY,
        "id_sous_commande" INTEGER NOT NULL REFERENCES "sous_commandes"("id") ON DELETE CASCADE,
        "id_produit"      INTEGER NOT NULL REFERENCES "produits"("id"),
        "id_variation"    INTEGER REFERENCES "variations"("id") ON DELETE SET NULL,
        "quantite"        INTEGER NOT NULL,
        "prix_vente"      DECIMAL(10,2) NOT NULL,
        "prix_gros"       DECIMAL(10,2) NOT NULL,
        "profit_unitaire" DECIMAL(10,2) NOT NULL,
        "cree_le"         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 21. tickets  (creator_id, assigned_to → users; type_id → tickets_types)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_tickets_status AS ENUM ('ouvert','en_attente','ferme');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id"           SERIAL PRIMARY KEY,
        "code"         VARCHAR(50)  UNIQUE NOT NULL,
        "title"        VARCHAR(255) NOT NULL,
        "product_code" VARCHAR(100),
        "creator_id"   INTEGER NOT NULL REFERENCES "users"("id"),
        "type_id"      INTEGER NOT NULL REFERENCES "tickets_types"("id"),
        "status"       enum_tickets_status DEFAULT 'ouvert',
        "assigned_to"  INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at"   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at"   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 22. tickets_messages  (tickets_id → tickets, sender_id → users)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_tickets_messages_channel AS ENUM ('portal','phone','whatsapp','email');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tickets_messages" (
        "id"         SERIAL PRIMARY KEY,
        "tickets_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
        "sender_id"  INTEGER NOT NULL REFERENCES "users"("id"),
        "body"       TEXT NOT NULL,
        "channel"    enum_tickets_messages_channel DEFAULT 'portal',
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
        "statut"               VARCHAR(255) NOT NULL,
        "description"          TEXT,
        "tentatives_livraison" INTEGER DEFAULT 0,
        "cree_le"              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // 24. pickups  (id_fournisseur → fournisseurs)
    // ═══════════════════════════════════════════════════════════════════════
    await safe(`
      DO $$ BEGIN
        CREATE TYPE enum_pickups_status AS ENUM ('demandé','planifié','récupéré');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "pickups" (
        "id"            SERIAL PRIMARY KEY,
        "code"          VARCHAR(255) UNIQUE NOT NULL,
        "id_fournisseur" INTEGER NOT NULL REFERENCES "fournisseurs"("id") ON DELETE CASCADE,
        "id_livreur"    INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "status"        enum_pickups_status DEFAULT 'demandé',
        "meta"          JSONB,
        "cree_le"       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "modifie_le"    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Full schema migration complete — all 24 tables created (idempotent).');
  },

  async down(queryInterface, Sequelize) {
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
      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS "${t}" CASCADE;`
      );
    }
    const types = [
      'enum_users_role','enum_vendeurs_statut_demande_pack',
      'enum_permissions_module','enum_tasks_module','enum_tasks_status','enum_tasks_priority',
      'enum_medias_type','enum_demandes_de_retrait_statut',
      'enum_commandes_etat_confirmation','enum_commandes_etat_commande',
      'enum_sous_commandes_statut','enum_tickets_status',
      'enum_tickets_messages_channel','enum_pickups_status',
    ];
    for (const t of types) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${t}" CASCADE;`);
    }
  }
};
