#!/usr/bin/env node
// simple helper to run all migrations and then seeders once
import { spawnSync } from 'child_process';

function run(cmd, args) {
  const proc = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (proc.error || proc.status !== 0) {
    process.exit(proc.status || 1);
  }
}

console.log('NODE_ENV =', process.env.NODE_ENV || 'development');

// run migrations (sequelize-cli should be installed)
console.log('🛠  running migrations...');
run('npx', ['sequelize', 'db:migrate']);

// run seed script (existing `backend/seeders/seed.js` expects ESM environment)
console.log('🌱  seeding database...');
run('node', ['-r', 'dotenv/config', 'seeders/seed.js']);

console.log('✅ initial_db complete');
