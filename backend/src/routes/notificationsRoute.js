import express from "express";
import { allNotifications, deleteAllNotifications, markAllNotificationsAsRead, notifications} from "../controllers/notificationsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notifications for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of unread notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Notification' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete all notifications for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", requireAuth, notifications);
router.delete("/", requireAuth, deleteAllNotifications);

/**
 * @openapi
 * /notifications/all:
 *   get:
 *     tags: [Notifications]
 *     summary: Get all notifications (read and unread)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Notification' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/all", requireAuth, allNotifications);

/**
 * @openapi
 * /notifications/mark-all-read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/mark-all-read", requireAuth, markAllNotificationsAsRead);

export default router;
