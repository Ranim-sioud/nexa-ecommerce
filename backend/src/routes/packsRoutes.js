import express from 'express';
import { deletePack, listPacks, updatePack } from '../controllers/packController.js';
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /packs:
 *   get:
 *     tags: [Packs]
 *     summary: List all subscription packs (public)
 *     responses:
 *       200:
 *         description: Array of packs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Pack' }
 */
router.get('/', listPacks);

/**
 * @openapi
 * /packs/{id}:
 *   put:
 *     tags: [Packs]
 *     summary: Update a pack (Admin)
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
 *             properties:
 *               titre:       { type: string }
 *               prix:        { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Pack updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     tags: [Packs]
 *     summary: Delete a pack (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Pack deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/:id', requireAuth, requireAdmin, updatePack);
router.delete('/:id', requireAuth, requireAdmin, deletePack);

export default router;
