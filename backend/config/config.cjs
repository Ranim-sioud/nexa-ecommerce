require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const isDocker = process.env.DOCKER_ENV === 'true' || !!process.env.DATABASE_URL;

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'nexa_user',
    password: process.env.POSTGRES_PASSWORD || 'supersecurepass2026!',
    database: process.env.POSTGRES_DB || 'nexa',
    host: isDocker ? 'db' : 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    username: process.env.POSTGRES_USER || 'nexa_user',
    password: process.env.POSTGRES_PASSWORD || 'supersecurepass2026!',
    database: process.env.POSTGRES_DB || 'nexa',
    host: isDocker ? 'db' : 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  },
  production: {
    username: process.env.POSTGRES_USER || 'nexa_user',
    password: process.env.POSTGRES_PASSWORD || 'supersecurepass2026!',
    database: process.env.POSTGRES_DB || 'nexa',
    host: 'db',                            // <=== forced for production in Docker
    port: 5432,
    dialect: 'postgres',
    logging: false,                        // no spam in prod
    dialectOptions: {
      ssl: false,
    },
  }
};