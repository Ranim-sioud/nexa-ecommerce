#!/usr/bin/env node
// Runs all pending migrations then seeds the database.
// Safe to run multiple times: migrations are tracked by SequelizeMeta,
// and seed.js uses findOrCreate so it never creates duplicates.
import { spawnSync } from 'child_process';

function run(cmd, args, cwd) {
  const proc = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd });
  if (proc.error || proc.status !== 0) {
    process.exit(proc.status || 1);
  }
}

const backendDir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

console.log('NODE_ENV =', process.env.NODE_ENV || 'development');

console.log('Running migrations...');
run('npx', ['sequelize-cli', 'db:migrate', '--config', 'config/config.cjs'], backendDir);

console.log('Seeding database...');
run('node', ['seeders/seed.js'], backendDir);

console.log('initial_db complete');
