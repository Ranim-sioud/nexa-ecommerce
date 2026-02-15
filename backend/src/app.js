import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from "cookie-parser";
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import packsRoutes from './routes/packsRoutes.js';
import adminRoutes from "./routes/admin.js";
import produitRoutes from "./routes/produitRoutes.js";
import mesProduitsRoutes from "./routes/mesProduitsRoutes.js";
import categoriesRoutes from "./routes/categoriesRoute.js";
import ticketsRoutes from "./routes/ticketsRoutes.js";
import specialistRoutes from "./routes/specialistRoutes.js";
import commandesRoutes from "./routes/commandesRoutes.js";
import demandeRetraitRoutes from "./routes/demandeRetraitRoutes.js";
import pickupRoute from "./routes/pickupRoute.js";
import parrainageRoutes from "./routes/parrainageRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import dashboardFRoutes from "./routes/dashboardFRoutes.js";
import notificationsRoute from "./routes/notificationsRoute.js";
import webhook from "./routes/webhook.js";
import { Produit, sequelize } from './models/index.js';
import compression from 'compression';

const app = express();
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:4001", "blob:", "*.cloudinary.com"],
      scriptSrc: ["'self'"],
      // adapter selon besoin
    }
  }
}));
app.use(helmet.hsts({ maxAge: 31536000 }));
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
//app.use(cors({ origin: FRONTEND_URL, credentials: true }));
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.get('/api/health', async (req, res) => {
  try {
    // Test connexion DB
    await sequelize.authenticate();
    
    res.json({ 
      status: 'OK', 
      database: 'connected',
      simple_query: 'working',
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: err.message 
    });
  }
});

// Rate limiter example (Redis recommended in prod)
/* if (process.env.REDIS_URL) {
  const redisClient = new Redis(process.env.REDIS_URL);
  app.use(rateLimit({
    windowMs: 60*1000,
    max: 200,
    store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) })
  }));
} else {
  app.use(rateLimit({ windowMs: 60*1000, max: 200 }));
} */
app.use(rateLimit({ windowMs: 60*1000, max: 200 }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packs', packsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/produits", produitRoutes);
app.use("/api/mesProduits", mesProduitsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/webhook", webhook);
app.use('/api/specialist', specialistRoutes);
app.use('/api/retraits', demandeRetraitRoutes);
app.use('/api/pickup', pickupRoute);
app.use("/api/parrainages", parrainageRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboardF", dashboardFRoutes);
app.use("/api/notifications", notificationsRoute);

app.use('/api/commande', commandesRoutes);
// health
app.get('/', (req,res)=> res.json({ ok: true }));

// ensure db
(async () => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    await sequelize.authenticate();
    console.log('DB OK');
     if (!isProd) {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    } // en dev; en prod utiliser migrations
  } catch (err) {
    console.error('DB connection error', err);
  }
})();

export default app;