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
import { httpLogger } from './middlewares/httpLogger.js';
import logger from './config/logger.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import jwt from 'jsonwebtoken';

const app = express();
app.set('trust proxy', 1);
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
app.use(httpLogger);
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

// Guard: admin-only access to API docs
const requireAdminDocs = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).send('401 — Admin authentication required to access API docs. Login at /api/auth/login first.');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).send('403 — Admin role required to access API docs.');
    }
    next();
  } catch {
    return res.status(401).send('401 — Invalid or expired token. Login at /api/auth/login first.');
  }
};

// Raw spec must be registered before swagger-ui middleware to avoid interception
app.get('/api/docs/spec.json', requireAdminDocs, (req, res) => res.json(swaggerSpec));
// Admin-only API documentation
app.use('/api/docs', requireAdminDocs, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Nexa API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

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

// Global error handler — catches anything thrown by controllers
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    status,
    userId: req.user?.id,
    ip: req.ip,
  });
  res.status(status).json({ message: status >= 500 ? 'Erreur serveur' : err.message });
});

// Verify DB connection on boot. Migrations are run by the Dockerfile CMD
// before `npm start` (npx sequelize-cli db:migrate && npm start).
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  }
})();

export default app;