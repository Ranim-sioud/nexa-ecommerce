import express from "express";
import { createProduit, deleteProduit, getAllProduitsForVendeur, getProduitById, getProduits, updateProduit } from "../controllers/produitController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadCloudinary.js";

const router = express.Router();

router.post("/", requireAuth, upload.array("medias", 8), createProduit);
router.get("/", requireAuth, getProduits);
router.put("/:id", requireAuth, upload.array("medias", 8), updateProduit);
router.delete("/:id", requireAuth, deleteProduit);
router.get("/all-vendeurs", requireAuth, getAllProduitsForVendeur);
router.get("/:id", requireAuth, getProduitById);

export default router;