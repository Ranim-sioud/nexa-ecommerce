import express from "express";
import { allNotifications, deleteAllNotifications, markAllNotificationsAsRead, notifications} from "../controllers/notificationsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/",requireAuth, notifications);
router.get("/all", requireAuth, allNotifications);

// ⭐ NOUVELLE ROUTE : Pour supprimer toutes les notifications
router.delete("/", requireAuth, deleteAllNotifications);
router.put("/mark-all-read", requireAuth, markAllNotificationsAsRead);

export default router;