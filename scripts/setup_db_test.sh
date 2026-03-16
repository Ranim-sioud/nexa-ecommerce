#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# setup_db_test.sh
# Run this ONCE in WSL2 with sudo:
#   sudo bash /mnt/d/51_Smartec_Deployment_VPS/nexa-ecommerce/scripts/setup_db_test.sh
#
# What it does:
#   1. Install postgresql-client-16 (for pg_restore/pg_dump 16)
#   2. Create db_test database
#   3. Restore backup_Nexa.dump into db_test
#   4. Export plain SQL → designDocs/backup_Nexa.sql
# ─────────────────────────────────────────────────────────────
set -e

DUMP="/mnt/d/51_Smartec_Deployment_VPS/nexa-ecommerce/designDocs/backup_Nexa.dump"
OUT_SQL="/mnt/d/51_Smartec_Deployment_VPS/nexa-ecommerce/designDocs/backup_Nexa.sql"
DB_USER="ferid"
DB_NAME="db_test"

echo "==> [1/4] Installing postgresql-client-16..."
if ! command -v /usr/lib/postgresql/16/bin/pg_restore &>/dev/null; then
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -qq
  apt-get install -y postgresql-client-16
fi
PG_RESTORE=/usr/lib/postgresql/16/bin/pg_restore
PG_DUMP=/usr/lib/postgresql/16/bin/pg_dump
echo "    pg_restore: $($PG_RESTORE --version)"

echo "==> [2/4] Creating database $DB_NAME..."
psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME" 2>/dev/null || true
psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME"

echo "==> [3/4] Restoring dump..."
$PG_RESTORE -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges "$DUMP" \
  || echo "    (warnings above are normal — role ownership errors are skipped)"

echo "==> [4/4] Exporting plain SQL → $OUT_SQL"
$PG_DUMP -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges \
  --schema-only \
  -f "${OUT_SQL%.sql}_schema.sql"

$PG_DUMP -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges \
  -f "$OUT_SQL"

echo ""
echo "✓ Done."
echo "  DB:         $DB_NAME"
echo "  Full SQL:   $OUT_SQL"
echo "  Schema SQL: ${OUT_SQL%.sql}_schema.sql"
