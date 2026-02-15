// routes/mesProduitsRoutes.js
import express from "express";
import { getMesProduits, addProduit, removeProduit } from "../controllers/mesProduitsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getMesProduits);
router.post("/:id_produit", requireAuth, addProduit);
router.delete("/:id_produit", requireAuth, removeProduit);

export default router;