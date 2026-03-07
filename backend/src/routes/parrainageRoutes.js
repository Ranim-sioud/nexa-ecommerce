import express from "express";
import {
  getAllParrainages,
  getBonusParVendeur,
  getParrainagesByVendeur,
} from "../controllers/parrainageController.js";

const router = express.Router();

/**
 * @openapi
 * /parrainages:
 *   get:
 *     tags: [Parrainage]
 *     summary: List all referrals (Admin)
 *     responses:
 *       200:
 *         description: Array of all parrainage records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Parrainage' }
 */
router.get("/", getAllParrainages);

/**
 * @openapi
 * /parrainages/vendeur/{id}:
 *   get:
 *     tags: [Parrainage]
 *     summary: Get referrals for a specific Vendeur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Vendeur user ID
 *     responses:
 *       200:
 *         description: Referrals for this Vendeur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Parrainage' }
 */
router.get("/vendeur/:id", getParrainagesByVendeur);

/**
 * @openapi
 * /parrainages/bonus-par-vendeur:
 *   get:
 *     tags: [Parrainage]
 *     summary: Get total referral bonus credited per Vendeur
 *     responses:
 *       200:
 *         description: Bonus totals grouped by vendeur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   vendeur_id: { type: integer }
 *                   total_bonus:{ type: number }
 */
router.get("/bonus-par-vendeur", getBonusParVendeur);

export default router;
