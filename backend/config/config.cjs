// config/config.cjs
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dbConfig = {
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.DB_HOST || 'db',           // default to docker service name
  dialect: 'postgres',
  logging: false,                               // quiet in prod
};

module.exports = {
  development: { ...dbConfig },
  test: { ...dbConfig },
  production: { ...dbConfig },

  // Bonus: if you prefer direct URI (Sequelize supports it natively)
  // You can do in your sequelize instance: new Sequelize(process.env.DATABASE_URL, { ... })
};