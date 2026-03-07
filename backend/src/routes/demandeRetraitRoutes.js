import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  createDemande,
  listUserDemandes,
  listAllDemandes,
  updateStatut,
  deleteDemande,
  getTransactions
} from "../controllers/demandeRetraitController.js";

const router = express.Router();

/**
 * @openapi
 * /retraits:
 *   post:
 *     tags: [Withdrawals]
 *     summary: Submit a withdrawal request (Vendeur)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [montant]
 *             properties:
 *               montant: { type: number, format: decimal, example: 500.00, description: 'Amount to withdraw from wallet' }
 *     responses:
 *       201:
 *         description: Withdrawal request submitted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DemandeRetrait' }
 *       400:
 *         description: Insufficient balance or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Withdrawals]
 *     summary: List the authenticated user's withdrawal requests
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of withdrawal requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/DemandeRetrait' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", requireAuth, createDemande);
router.get("/", requireAuth, listUserDemandes);

/**
 * @openapi
 * /retraits/admin/all:
 *   get:
 *     tags: [Withdrawals]
 *     summary: List all withdrawal requests (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema: { type: string, enum: [en_attente, approuve, refuse] }
 *     responses:
 *       200:
 *         description: All withdrawal requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/DemandeRetrait' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/admin/all", requireAuth, listAllDemandes);

/**
 * @openapi
 * /retraits/transactions:
 *   get:
 *     tags: [Withdrawals]
 *     summary: List withdrawal-related transactions
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
router.get("/transactions", requireAuth, getTransactions);

/**
 * @openapi
 * /retraits/{id}/statut:
 *   patch:
 *     tags: [Withdrawals]
 *     summary: Approve or reject a withdrawal request (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut: { type: string, enum: [approuve, refuse] }
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id/statut", requireAuth, updateStatut);

/**
 * @openapi
 * /retraits/{id}:
 *   delete:
 *     tags: [Withdrawals]
 *     summary: Delete a withdrawal request (owner or Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", requireAuth, deleteDemande);

export default router;
