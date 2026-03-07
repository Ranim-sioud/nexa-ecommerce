import express from "express";
import {requireAuth, requireAdmin} from "../middlewares/authMiddleware.js";
import { listUsers, updateUserStatus, getVendeurPacks, deleteUser, assignTickets, closeTickets, createType, repondreTicket, assignPermission, getPermissions, getSpecialistPermissions, removePermission, assignTask, getTasks, updateTaskStatus, getSpecialists, getAdminDashboard, traiterDemandePack } from "../controllers/adminController.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all platform users (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [vendeur, fournisseur, specialiste] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/users", requireAuth, listUsers);

/**
 * @openapi
 * /admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate or deactivate a user account (Admin)
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
 *             required: [actif]
 *             properties:
 *               actif: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/users/:id/status", requireAuth, updateUserStatus);

/**
 * @openapi
 * /admin/vendeurs/{id}/packs:
 *   get:
 *     tags: [Admin]
 *     summary: Get pack history for a specific Vendeur (Admin)
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
 *         description: Pack history
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/vendeurs/:id/packs", requireAuth, getVendeurPacks);

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Permanently delete a user (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/users/:id", deleteUser);

/**
 * @openapi
 * /admin/types:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new ticket type/category (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom]
 *             properties:
 *               nom: { type: string, example: 'Retour produit' }
 *     responses:
 *       201:
 *         description: Ticket type created
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/types", createType);

/**
 * @openapi
 * /admin/tickets/{id}/assign:
 *   post:
 *     tags: [Admin]
 *     summary: Assign a ticket to a specialist (Admin)
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
 *             required: [specialist_id]
 *             properties:
 *               specialist_id: { type: integer }
 *     responses:
 *       200:
 *         description: Ticket assigned
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/tickets/:id/assign", assignTickets);

/**
 * @openapi
 * /admin/tickets/{id}/close:
 *   post:
 *     tags: [Admin]
 *     summary: Close a ticket (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ticket closed
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/tickets/:id/close", closeTickets);

/**
 * @openapi
 * /admin/tickets/{id}/reponse:
 *   post:
 *     tags: [Admin]
 *     summary: Post an admin reply to a ticket (Admin)
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
 *             required: [contenu]
 *             properties:
 *               contenu: { type: string }
 *     responses:
 *       200:
 *         description: Reply posted
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/tickets/:id/reponse", repondreTicket);

/**
 * @openapi
 * /admin/permissions:
 *   post:
 *     tags: [Admin]
 *     summary: Assign a permission to a specialist (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [specialist_id, resource, action]
 *             properties:
 *               specialist_id: { type: integer }
 *               resource:      { type: string, example: 'products', enum: [products, users, tickets] }
 *               action:        { type: string, example: 'manage', enum: [view, manage, edit, delete] }
 *     responses:
 *       201:
 *         description: Permission assigned
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Admin]
 *     summary: List all permissions (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Permission' }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/permissions", assignPermission);
router.get("/permissions", getPermissions);

/**
 * @openapi
 * /admin/permissions/specialist/{specialist_id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get permissions for a specific specialist (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: specialist_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of permissions
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/permissions/specialist/:specialist_id", getSpecialistPermissions);

/**
 * @openapi
 * /admin/permissions/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Remove a permission (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Permission removed
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/permissions/:id", requirePermission, removePermission);

/**
 * @openapi
 * /admin/tasks:
 *   post:
 *     tags: [Admin]
 *     summary: Assign a task to a specialist (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, assigned_to]
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               assigned_to: { type: integer, description: Specialist user ID }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   get:
 *     tags: [Admin]
 *     summary: List all tasks (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Task' }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/tasks", assignTask);
router.get("/tasks", getTasks);

/**
 * @openapi
 * /admin/tasks/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update task status (Admin)
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
 *               status: { type: string, enum: [pending, in_progress, done] }
 *     responses:
 *       200:
 *         description: Task status updated
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/tasks/:id/status", requirePermission, updateTaskStatus);

/**
 * @openapi
 * /admin/specialists:
 *   get:
 *     tags: [Admin]
 *     summary: List all specialists (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of specialist users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/specialists", getSpecialists);

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats (users, orders, revenue, etc.)
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/dashboard", getAdminDashboard);

/**
 * @openapi
 * /admin/traiter/{userId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Process a pending pack change request for a Vendeur (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [approuvee, refusee] }
 *     responses:
 *       200:
 *         description: Request processed
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/traiter/:userId', requireAuth, traiterDemandePack);

export default router;
