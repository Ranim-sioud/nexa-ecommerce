require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dbConfig = {
  username: process.env.POSTGRES_USER || 'nexa_user',
  password: process.env.POSTGRES_PASSWORD || 'supersecurepass2026!',
  database: process.env.POSTGRES_DB || 'nexa',
  host: process.env.DB_HOST || 'db',  // docker service name
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: false,  // no SSL in local/docker usually
  },
};

module.exports = {
  development: { ...dbConfig },
  test: { ...dbConfig },
  production: { ...dbConfig },
};