import express from "express";
import {
  creerCommande,
  listerCommandesVendeur,
  obtenirDetailsCommande,
  mettreAJourTracking,
  obtenirProduitsVendeur,
  getFraisCommande,
  getClientByEmail,
  modifierCommande,
  listerCommandesFournisseur,
  obtenirDetailsCommandeFournisseur,
  //updateStatutCommande,
  getTransactions,
  supprimerCommandes
} from "../controllers/commandeController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /commande:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order (Vendeur)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client, produits]
 *             properties:
 *               client:
 *                 type: object
 *                 description: Client info (use existing id or provide name/phone for new client)
 *                 properties:
 *                   id:        { type: integer, nullable: true }
 *                   nom:       { type: string }
 *                   telephone: { type: string }
 *                   adresse:   { type: string }
 *               produits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_produit:  { type: integer }
 *                     quantite:    { type: integer }
 *                     id_variation:{ type: integer, nullable: true }
 *               commentaire:          { type: string, nullable: true }
 *               source:               { type: string, nullable: true }
 *               collis_date:          { type: string, format: date-time, nullable: true }
 *               demande_confirmation: { type: boolean }
 *               colis_ouvrable:       { type: boolean }
 *               colis_fragile:        { type: boolean }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Commande' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Orders]
 *     summary: List the Vendeur's orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: statut
 *         schema: { type: string, enum: [en_attente, confirmee, annulee] }
 *     responses:
 *       200:
 *         description: Paginated list of orders
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", requireRole('vendeur', 'admin'), creerCommande);
router.get("/", requireRole('vendeur', 'admin'), listerCommandesVendeur);

/**
 * @openapi
 * /commande/commandes:
 *   get:
 *     tags: [Orders]
 *     summary: List orders assigned to the Fournisseur
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of sous-commandes for this supplier
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/commandes", requireRole('fournisseur', 'admin'), listerCommandesFournisseur);

/**
 * @openapi
 * /commande/produits:
 *   get:
 *     tags: [Orders]
 *     summary: List products available for ordering (Vendeur)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of products with stock info
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/produits", requireRole('vendeur', 'admin'), obtenirProduitsVendeur);

/**
 * @openapi
 * /commande/frais:
 *   post:
 *     tags: [Orders]
 *     summary: Calculate shipping and platform fees before placing order
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gouvernorat: { type: string, example: 'Sfax' }
 *               produits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_produit: { type: integer }
 *                     quantite:   { type: integer }
 *     responses:
 *       200:
 *         description: Fee calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 frais_livraison:   { type: number }
 *                 frais_plateforme:  { type: number }
 *                 total:             { type: number }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/frais", requireRole('vendeur', 'admin'), getFraisCommande);

/**
 * @openapi
 * /commande/transactions:
 *   get:
 *     tags: [Orders]
 *     summary: List financial transactions for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of transactions
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/transactions", requireRole('vendeur', 'fournisseur', 'admin'), getTransactions);

/**
 * @openapi
 * /commande/supprimer:
 *   post:
 *     tags: [Orders]
 *     summary: Bulk delete orders (Vendeur)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200:
 *         description: Orders deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/supprimer", requireRole('vendeur', 'admin'), supprimerCommandes);

/**
 * @openapi
 * /commande/fournisseur/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get sous-commande details for a Fournisseur
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: SousCommande ID
 *     responses:
 *       200:
 *         description: Sous-commande details
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/fournisseur/:id", requireRole('fournisseur', 'admin'), obtenirDetailsCommandeFournisseur);

/**
 * @openapi
 * /commande/email/{email}:
 *   get:
 *     tags: [Orders]
 *     summary: Look up a client by email (for order form autofill)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Client info
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/email/:email", requireRole('vendeur', 'admin'), getClientByEmail);

/**
 * @openapi
 * /commande/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get full order details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order with lines, client, and tracking
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Commande' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     tags: [Orders]
 *     summary: Update an order (Vendeur)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statut:      { type: string, enum: [en_attente, confirmee, annulee] }
 *               commentaire: { type: string }
 *               collis_date: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Order updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", requireRole('vendeur', 'fournisseur', 'admin'), obtenirDetailsCommande);
router.put("/:id", requireRole('vendeur', 'admin'), modifierCommande);

/**
 * @openapi
 * /commande/sous-commande/{id}/tracking:
 *   put:
 *     tags: [Orders]
 *     summary: Update tracking info for a sous-commande (Fournisseur)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: SousCommande ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               etat:            { type: string, example: 'en_route' }
 *               numero_tracking: { type: string, example: 'TN123456789' }
 *     responses:
 *       200:
 *         description: Tracking updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/sous-commande/:id/tracking", requireRole('fournisseur', 'admin'), mettreAJourTracking);

export default router;
