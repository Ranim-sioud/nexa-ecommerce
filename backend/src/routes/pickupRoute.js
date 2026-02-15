import express from "express";
import { listEnAttenteEnlevement, createPickup, listPickups, getPickupDetail } from "../controllers/pickupController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/en_attente_enlevement", requireAuth, listEnAttenteEnlevement);
router.post("/", requireAuth, createPickup);
router.get("/",requireAuth, listPickups);             // GET /api/pickups?page=1&limit=20&q=...
router.get("/:id",requireAuth, getPickupDetail);

export default router;