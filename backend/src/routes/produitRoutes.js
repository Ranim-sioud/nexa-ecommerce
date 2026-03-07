import express from "express";
import { createProduit, deleteProduit, getAllProduitsForVendeur, getProduitById, getProduits, updateProduit } from "../controllers/produitController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadCloudinary.js";

const router = express.Router();

/**
 * @openapi
 * /produits:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (Fournisseur)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nom]
 *             properties:
 *               nom:         { type: string, example: 'Montre connectée' }
 *               description: { type: string }
 *               livraison:   { type: string }
 *               prix_gros:   { type: number, format: decimal }
 *               stock:       { type: integer }
 *               id_categorie:{ type: integer }
 *               medias:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Up to 8 media files
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produit' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Products]
 *     summary: List products visible to the authenticated user
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
 *         name: q
 *         schema: { type: string }
 *         description: Search by product name
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products: { type: array, items: { $ref: '#/components/schemas/Produit' } }
 *                 total:    { type: integer }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", requireAuth, upload.array("medias", 8), createProduit);
router.get("/", requireAuth, getProduits);

/**
 * @openapi
 * /produits/all-vendeurs:
 *   get:
 *     tags: [Products]
 *     summary: List all products available to Vendeurs (across all suppliers)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Produit' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/all-vendeurs", requireAuth, getAllProduitsForVendeur);

/**
 * @openapi
 * /produits/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single product by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produit' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     tags: [Products]
 *     summary: Update a product (Fournisseur owner)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:         { type: string }
 *               description: { type: string }
 *               prix_gros:   { type: number }
 *               stock:       { type: integer }
 *               medias:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Product updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Fournisseur owner)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/:id", requireAuth, upload.array("medias", 8), updateProduit);
router.delete("/:id", requireAuth, deleteProduit);
router.get("/:id", requireAuth, getProduitById);

export default router;
