// routes/mesProduitsRoutes.js
import express from "express";
import { getMesProduits, addProduit, removeProduit } from "../controllers/mesProduitsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /mesProduits:
 *   get:
 *     tags: [MesProduits]
 *     summary: List the Vendeur's personal product selection
 *     security:
 *       - cookieAuth: []
 *     description: Returns the products a Vendeur has added to their personal catalog from the Fournisseur catalog.
 *     responses:
 *       200:
 *         description: Array of products in the Vendeur's catalog
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
router.get("/", requireAuth, getMesProduits);

/**
 * @openapi
 * /mesProduits/{id_produit}:
 *   post:
 *     tags: [MesProduits]
 *     summary: Add a product to the Vendeur's personal catalog
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id_produit
 *         required: true
 *         schema: { type: integer }
 *         description: Produit ID from the Fournisseur catalog
 *     responses:
 *       201:
 *         description: Product added to personal catalog
 *       409:
 *         description: Product already in catalog
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     tags: [MesProduits]
 *     summary: Remove a product from the Vendeur's personal catalog
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id_produit
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product removed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/:id_produit", requireAuth, addProduit);
router.delete("/:id_produit", requireAuth, removeProduit);

export default router;
