import express from "express";
import {
  getAllParrainages,
  getBonusParVendeur,
  getParrainagesByVendeur,
} from "../controllers/parrainageController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /parrainages:
 *   get:
 *     tags: [Parrainage]
 *     summary: List all referrals (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of all parrainage records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Parrainage' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", requireRole('admin'), getAllParrainages);

/**
 * @openapi
 * /parrainages/vendeur/{id}:
 *   get:
 *     tags: [Parrainage]
 *     summary: Get referrals for a specific Vendeur
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/vendeur/:id", requireRole('vendeur', 'admin'), getParrainagesByVendeur);

/**
 * @openapi
 * /parrainages/bonus-par-vendeur:
 *   get:
 *     tags: [Parrainage]
 *     summary: Get total referral bonus credited per Vendeur
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/bonus-par-vendeur", requireRole('admin'), getBonusParVendeur);

export default router;
