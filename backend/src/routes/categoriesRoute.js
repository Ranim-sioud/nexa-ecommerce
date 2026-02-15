import express from "express";
import { getCategories, createCategorie } from "../controllers/categorieController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Récupérer toutes les catégories
router.get("/", requireAuth, getCategories);

// Créer une catégorie
router.post("/", requireAuth, createCategorie);

export default router;