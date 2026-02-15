import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  createDemande,
  listUserDemandes,
  listAllDemandes,
  updateStatut,
  deleteDemande,
  getTransactions
} from "../controllers/demandeRetraitController.js";

const router = express.Router();

router.post("/", requireAuth, createDemande);            // créer une demande (user)
router.get("/", requireAuth, listUserDemandes);          // lister demandes de l'utilisateur
router.get("/admin/all", requireAuth, listAllDemandes);  // admin: toutes les demandes
router.patch("/:id/statut", requireAuth, updateStatut);  // admin: changer statut
router.delete("/:id", requireAuth, deleteDemande);
router.get("/transactions", requireAuth, getTransactions);

export default router;