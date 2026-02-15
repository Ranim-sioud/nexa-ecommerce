import express from "express";
import {
  getAllParrainages,
  getBonusParVendeur,
  getParrainagesByVendeur,
} from "../controllers/parrainageController.js";

const router = express.Router();

// Pour admin
router.get("/", getAllParrainages);

// Pour vendeur spécifique
router.get("/vendeur/:id", getParrainagesByVendeur);
router.get("/bonus-par-vendeur", getBonusParVendeur);

export default router;