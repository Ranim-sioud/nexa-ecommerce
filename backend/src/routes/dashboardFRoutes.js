import express from "express";
import { getSupplierDashboard } from "../controllers/dashboardFController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @openapi
 * /dashboardF:
 *   get:
 *     tags: [Dashboard Fournisseur]
 *     summary: Get Fournisseur dashboard statistics
 *     security:
 *       - cookieAuth: []
 *     description: Returns pending pickups, active products, stock alerts and revenue for the authenticated Fournisseur.
 *     responses:
 *       200:
 *         description: Supplier dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 produits_actifs:   { type: integer }
 *                 pickups_en_attente:{ type: integer }
 *                 ruptures_stock:    { type: integer }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", requireAuth, getSupplierDashboard);

export default router;
