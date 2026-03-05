import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Use DATABASE_URL (set by docker-compose) or fall back to individual POSTGRES_* vars.
// SSL is disabled for Docker-internal connections (postgres container has no SSL cert).
const dbUrl = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DB_HOST || 'db'}:5432/${process.env.POSTGRES_DB}`;

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 15, min: 2, acquire: 60000, idle: 30000, evict: 1000 },
  dialectOptions: { ssl: false },
});

export default sequelize;