import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
const router = express.Router();
router.use(requireAuth, requireRole('vendeur', 'admin'));

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get Vendeur dashboard statistics
 *     security:
 *       - cookieAuth: []
 *     description: Returns order counts, revenue, commissions, and recent activity for the authenticated Vendeur.
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_commandes:   { type: integer }
 *                 total_revenue:     { type: number }
 *                 commandes_recentes:{ type: array, items: { $ref: '#/components/schemas/Commande' } }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", getDashboardStats);

export default router;
