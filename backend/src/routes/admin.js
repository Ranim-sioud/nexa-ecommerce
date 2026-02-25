import express from "express";
import {requireAuth, requireAdmin} from "../middlewares/authMiddleware.js";
import { listUsers, updateUserStatus, getVendeurPacks, deleteUser, assignTickets, closeTickets, createType, repondreTicket, assignPermission, getPermissions, getSpecialistPermissions, removePermission, assignTask, getTasks, updateTaskStatus, getSpecialists, getAdminDashboard, traiterDemandePack } from "../controllers/adminController.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/users", requireAuth, listUsers);
router.patch("/users/:id/status", requireAuth, updateUserStatus);
router.get("/vendeurs/:id/packs",requireAuth, getVendeurPacks);
router.delete("/users/:id", deleteUser);

router.post("/types", createType);
router.post("/tickets/:id/assign", assignTickets);
router.post("/tickets/:id/close", closeTickets);
router.post("/tickets/:id/reponse", repondreTicket);

router.post("/permissions", assignPermission);
router.get("/permissions", getPermissions);
router.get("/permissions/specialist/:specialist_id", getSpecialistPermissions);
router.delete("/permissions/:id",requirePermission, removePermission);

// Gestion des tâches
router.post("/tasks", assignTask);
router.get("/tasks", getTasks);
router.patch("/tasks/:id/status",requirePermission, updateTaskStatus);

// Gestion des spécialistes
router.get("/specialists", getSpecialists);
router.get("/dashboard", getAdminDashboard);
router.patch('/traiter/:userId', requireAuth, traiterDemandePack);


export default router;