import express from "express";
import { getSupplierDashboard } from "../controllers/dashboardFController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", requireAuth, getSupplierDashboard);

export default router;