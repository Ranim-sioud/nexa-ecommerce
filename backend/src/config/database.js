import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  /* pool: { max: 20, min: 2, acquire: 30000, idle: 10000 }, */
  pool: { max: 15, min: 2, acquire: 60000, idle: 30000 , evict: 1000,},
  dialectOptions: {
  ssl: process.env.NODE_ENV === "production"
  ? { require: true, rejectUnauthorized: false }
  : false
}
});

export default sequelize;