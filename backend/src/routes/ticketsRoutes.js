import express from "express";
import { createTickets, listTickets, getTicketsDetail, postMessage, getAllTicketTypes, updateTicketStatus } from "../controllers/ticketsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @openapi
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a support ticket
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type_id]
 *             properties:
 *               title:        { type: string, example: 'Problème livraison' }
 *               type_id:      { type: integer }
 *               product_code: { type: string, nullable: true }
 *               message:      { type: string, description: 'Initial message body' }
 *     responses:
 *       201:
 *         description: Ticket created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Tickets]
 *     summary: List tickets for the authenticated user (or all for Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ouvert, en_attente, ferme] }
 *     responses:
 *       200:
 *         description: Array of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Ticket' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", requireAuth, createTickets);
router.get("/", requireAuth, listTickets);

/**
 * @openapi
 * /tickets/types:
 *   get:
 *     tags: [Tickets]
 *     summary: List all ticket types/categories
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of ticket types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:  { type: integer }
 *                   nom: { type: string, example: 'Livraison' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/types", requireAuth, getAllTicketTypes);

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get ticket details with full message thread
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ticket with messages
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", requireAuth, getTicketsDetail);

/**
 * @openapi
 * /tickets/{ticketId}/messages:
 *   post:
 *     tags: [Tickets]
 *     summary: Post a reply message to a ticket
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenu]
 *             properties:
 *               contenu: { type: string, example: 'Le colis est arrivé endommagé.' }
 *     responses:
 *       201:
 *         description: Message posted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/:ticketId/messages", requireAuth, postMessage);

/**
 * @openapi
 * /tickets/tickets/{id}/status:
 *   post:
 *     tags: [Tickets]
 *     summary: Update ticket status (Admin/Specialist)
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ouvert, en_attente, ferme] }
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/tickets/:id/status", requireAuth, updateTicketStatus);

export default router;
