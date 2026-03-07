import express from "express";
import {
  getDashboard,
  manageUsers,
  manageProducts,
  updateUserStatusSpecialist,
  getMyTasks,
  updateMyTaskStatus,
  updateProductSpecialist,
  deleteProductSpecialist,
  getProductByIdSpecialist,
  createProductSpecialist
} from "../controllers/specialistController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { getProduitById } from "../controllers/produitController.js";
import { upload } from "../middlewares/uploadCloudinary.js";
import { deleteUser, updateUserStatus } from "../controllers/adminController.js";

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /specialist/dashboard:
 *   get:
 *     tags: [Specialist]
 *     summary: Specialist dashboard — task counts and assigned users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/dashboard", getDashboard);

/**
 * @openapi
 * /specialist/users:
 *   get:
 *     tags: [Specialist]
 *     summary: List users managed by this specialist (requires users:view permission)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/users", requirePermission('users', 'view'), manageUsers);

/**
 * @openapi
 * /specialist/users/{id}/status:
 *   patch:
 *     tags: [Specialist]
 *     summary: Activate/deactivate a user (requires users:manage permission)
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
 *         description: User status updated
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/users/:id/status", requirePermission('users', 'manage'), updateUserStatus);

/**
 * @openapi
 * /specialist/users/{id}:
 *   delete:
 *     tags: [Specialist]
 *     summary: Delete a user (requires products:delete permission)
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
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/users/:id", requirePermission('products', 'delete'), deleteUser);

/**
 * @openapi
 * /specialist/products:
 *   get:
 *     tags: [Specialist]
 *     summary: List all products (requires products:view permission)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Produit' }
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   post:
 *     tags: [Specialist]
 *     summary: Create a product (requires products:manage permission)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:   { type: string }
 *               medias:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Product created
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/products", requirePermission('products', 'view'), manageProducts);
router.post("/products", requirePermission('products', 'manage'), upload.array("medias", 8), createProductSpecialist);

/**
 * @openapi
 * /specialist/products/{id}:
 *   get:
 *     tags: [Specialist]
 *     summary: Get a product by ID (requires products:view permission)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produit' }
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   patch:
 *     tags: [Specialist]
 *     summary: Update a product (requires products:edit permission)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:   { type: string }
 *               medias:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     tags: [Specialist]
 *     summary: Delete a product (requires products:delete permission)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product deleted
 *       403:
 *         description: Missing permission
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/products/:id", requirePermission('products', 'view'), getProduitById);
router.patch("/products/:id", requirePermission('products', 'edit'), upload.array("medias", 8), updateProductSpecialist);
router.delete("/products/:id", requirePermission('products', 'delete'), deleteProductSpecialist);

/**
 * @openapi
 * /specialist/tasks:
 *   get:
 *     tags: [Specialist]
 *     summary: List tasks assigned to the authenticated specialist
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/tasks", getMyTasks);

/**
 * @openapi
 * /specialist/tasks/{id}/status:
 *   patch:
 *     tags: [Specialist]
 *     summary: Update own task status
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/tasks/:id/status", updateMyTaskStatus);

export default router;
