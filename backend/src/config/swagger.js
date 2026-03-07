import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Nexa Ecommerce API',
      version: '1.0.0',
      description: `
## Nexa — Multi-role Marketplace API

REST API for the Nexa ecommerce platform. Supports four user roles:
- **Vendeur** — Seller: creates orders, manages clients, requests withdrawals
- **Fournisseur** — Supplier: manages product catalog, handles pickups
- **Spécialiste** — Specialist: manages products & users under admin supervision
- **Admin** — Full platform management

### Authentication
All protected endpoints use an **httpOnly cookie** (\`accessToken\`). After a successful \`POST /auth/login\`, the cookie is set automatically by the browser. Use \`POST /auth/refresh\` to renew the token silently.

### Rate limiting
200 requests per minute per IP.
      `,
      contact: {
        name: 'Nexa Support',
        url: 'https://nexa-tn.com',
      },
    },
    servers: [
      { url: 'https://nexa-tn.com/api', description: 'Production' },
      { url: 'http://localhost:4001/api', description: 'Development' },
    ],
    tags: [
      { name: 'Auth', description: 'Registration, login, token management, password reset' },
      { name: 'Users', description: 'Profile management, wallet, pack change requests' },
      { name: 'Packs', description: 'Subscription pack catalog' },
      { name: 'Products', description: 'Product catalog (Fournisseur scope)' },
      { name: 'Orders', description: 'Order lifecycle (Vendeur & Fournisseur)' },
      { name: 'Withdrawals', description: 'Wallet withdrawal requests' },
      { name: 'Tickets', description: 'Support ticket system' },
      { name: 'Notifications', description: 'In-app notification feed' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Dashboard', description: 'Vendeur dashboard statistics' },
      { name: 'Dashboard Fournisseur', description: 'Supplier dashboard statistics' },
      { name: 'Admin', description: 'Admin-only management endpoints' },
      { name: 'Specialist', description: 'Specialist-role endpoints (requires permissions)' },
      { name: 'Parrainage', description: 'Referral / sponsorship program' },
      { name: 'Pickup', description: 'Fournisseur pickup scheduling' },
      { name: 'MesProduits', description: 'Vendeur personal product list' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT stored in httpOnly cookie. Set automatically after login.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Erreur serveur' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 1 },
            nom:          { type: 'string', example: 'Ahmed Ben Ali' },
            email:        { type: 'string', format: 'email', example: 'ahmed@example.com' },
            telephone:    { type: 'string', example: '20123456' },
            role:         { type: 'string', enum: ['vendeur', 'fournisseur', 'admin', 'specialiste'] },
            gouvernorat:  { type: 'string', example: 'Tunis' },
            ville:        { type: 'string', example: 'Tunis' },
            adresse:      { type: 'string', example: 'Rue de la Liberté' },
            facebook_url: { type: 'string', nullable: true },
            instagram_url:{ type: 'string', nullable: true },
            actif:        { type: 'boolean', example: true },
            validation:   { type: 'boolean', example: true },
            image_url:    { type: 'string', nullable: true },
          },
        },
        Pack: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            cle:         { type: 'string', example: 'starter' },
            titre:       { type: 'string', example: 'Pack Starter' },
            prix:        { type: 'number', format: 'decimal', example: 99.00 },
            description: { type: 'string', example: 'Pack de démarrage idéal pour les nouveaux vendeurs' },
          },
        },
        Produit: {
          type: 'object',
          properties: {
            id:               { type: 'integer', example: 10 },
            nom:              { type: 'string', example: 'Montre connectée' },
            description:      { type: 'string', nullable: true },
            livraison:        { type: 'string', nullable: true },
            prix_gros:        { type: 'number', format: 'decimal', example: 85.00 },
            stock:            { type: 'integer', example: 150 },
            variantes_actives:{ type: 'boolean', example: false },
            id_fournisseur:   { type: 'integer', example: 3 },
            id_categorie:     { type: 'integer', nullable: true },
            rupture_stock:    { type: 'boolean', example: false },
            medias:           { type: 'array', items: { $ref: '#/components/schemas/Media' } },
          },
        },
        Media: {
          type: 'object',
          properties: {
            id:      { type: 'integer' },
            url:     { type: 'string', example: 'https://res.cloudinary.com/...' },
            type:    { type: 'string', example: 'image' },
          },
        },
        Commande: {
          type: 'object',
          properties: {
            id:                   { type: 'integer', example: 55 },
            code:                 { type: 'string', example: 'CMD-a1b2c3d4e' },
            id_client:            { type: 'integer' },
            id_vendeur:           { type: 'integer' },
            statut:               { type: 'string', enum: ['en_attente', 'confirmee', 'annulee'] },
            etat_commande:        { type: 'string', example: 'livrée' },
            total:                { type: 'number', format: 'decimal', example: 250.00 },
            frais_livraison:      { type: 'number', format: 'decimal', example: 8.00 },
            colis_ouvrable:       { type: 'boolean' },
            colis_fragile:        { type: 'boolean' },
            demande_confirmation: { type: 'boolean' },
            commentaire:          { type: 'string', nullable: true },
            collis_date:          { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 7 },
            code:         { type: 'string', example: 'TKT-xyz123' },
            title:        { type: 'string', example: 'Problème de livraison' },
            product_code: { type: 'string', nullable: true },
            status:       { type: 'string', enum: ['ouvert', 'en_attente', 'ferme'] },
            creator_id:   { type: 'integer' },
            type_id:      { type: 'integer' },
          },
        },
        DemandeRetrait: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 3 },
            code_retrait: { type: 'string', example: 'RTR-001' },
            montant:      { type: 'number', format: 'decimal', example: 500.00 },
            statut:       { type: 'string', enum: ['en_attente', 'approuve', 'refuse'] },
            date_paiement:{ type: 'string', format: 'date-time', nullable: true },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id:        { type: 'integer' },
            message:   { type: 'string', example: 'Votre commande a été confirmée' },
            lu:        { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Categorie: {
          type: 'object',
          properties: {
            id:  { type: 'integer', example: 2 },
            nom: { type: 'string', example: 'Électronique' },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id:            { type: 'integer' },
            specialist_id: { type: 'integer' },
            resource:      { type: 'string', example: 'products' },
            action:        { type: 'string', example: 'manage' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            title:       { type: 'string', example: 'Valider 50 produits' },
            description: { type: 'string', nullable: true },
            status:      { type: 'string', enum: ['pending', 'in_progress', 'done'] },
            assigned_to: { type: 'integer' },
          },
        },
        Pickup: {
          type: 'object',
          properties: {
            id:           { type: 'integer' },
            id_fournisseur:{ type: 'integer' },
            date_pickup:  { type: 'string', format: 'date-time' },
            statut:       { type: 'string', example: 'planifie' },
          },
        },
        Parrainage: {
          type: 'object',
          properties: {
            id:              { type: 'integer' },
            parrain_id:      { type: 'integer' },
            filleul_id:      { type: 'integer' },
            bonus_applique:  { type: 'boolean' },
          },
        },
      },
    },
  },
  apis: [join(__dirname, '../routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
