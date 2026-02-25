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

/* const runMigrations = async () => {
  const migrator = new Umzug({
    migrations: {
      glob: 'migrations/*.js',  // Chemin vers vos fichiers de migration
      resolve: ({ name, path, context }) => {
        const migration = require(path);
        return {
          name,
          up: async () => migration.up(context, Sequelize),
          down: async () => migration.down(context, Sequelize),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ 
      sequelize,
      tableName: 'SequelizeMeta'  // Table qui garde l'historique des migrations
    }),
    logger: console,
  });

  try {
    const migrations = await migrator.up();
    console.log('Migrations exécutées avec succès :', migrations.map(m => m.name).join(', '));
  } catch (error) {
    console.error('Erreur lors des migrations :', error);
    throw error;
  }
};
 */
// Initialisation de la base de données
(async () => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    
    // Authentification
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');
    
    if (!isProd) {
      // EN DÉVELOPPEMENT : synchronisation automatique (pratique mais risquée)
      console.log('⚠️ Mode développement : utilisation de sync()');
      
      // Option 1 : sync simple (crée les tables si elles n'existent pas)
      // await sequelize.sync({ alter: true });
      console.log('✅ Synchronisation des modèles effectuée');
      
      // Option 2 : migrations en développement (recommandé pour tester)
      // await runMigrations();
    } else {
      // EN PRODUCTION : migrations uniquement !
      console.log('🚀 Mode production : exécution des migrations');
      await runMigrations();
    }
    
    console.log('✅ Base de données prête');
    
  } catch (err) {
    console.error('❌ Erreur de base de données :', err);
    process.exit(1);
  }
})();

export default app;