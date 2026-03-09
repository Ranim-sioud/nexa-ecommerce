import express from "express";
import { listEnAttenteEnlevement, createPickup, listPickups, getPickupDetail } from "../controllers/pickupController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(requireAuth, requireRole('fournisseur', 'admin'));

/**
 * @openapi
 * /pickup/en_attente_enlevement:
 *   get:
 *     tags: [Pickup]
 *     summary: List orders awaiting pickup by the Fournisseur
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orders ready for pickup
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Commande' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/en_attente_enlevement", listEnAttenteEnlevement);

/**
 * @openapi
 * /pickup:
 *   post:
 *     tags: [Pickup]
 *     summary: Schedule a pickup (Fournisseur)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date_pickup, commande_ids]
 *             properties:
 *               date_pickup:  { type: string, format: date-time }
 *               commande_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 description: List of commande IDs to include in this pickup
 *     responses:
 *       201:
 *         description: Pickup scheduled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pickup' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Pickup]
 *     summary: List pickups for the authenticated Fournisseur
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
 *         description: Search query
 *     responses:
 *       200:
 *         description: Paginated list of pickups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Pickup' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", createPickup);
router.get("/", listPickups);

/**
 * @openapi
 * /pickup/{id}:
 *   get:
 *     tags: [Pickup]
 *     summary: Get pickup details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Pickup details with associated commandes
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pickup' }
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
 */
router.get("/:id", getPickupDetail);

export default router;
