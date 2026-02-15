import express from "express";
import { 
  creerCommande, 
  listerCommandesVendeur, 
  obtenirDetailsCommande,
  mettreAJourTracking,
  obtenirProduitsVendeur,
  getFraisCommande,
  getClientByEmail,
  modifierCommande,
  listerCommandesFournisseur,
  obtenirDetailsCommandeFournisseur,
  //updateStatutCommande,
  getTransactions,
  supprimerCommandes
} from "../controllers/commandeController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes vendeur
router.post("/", requireAuth, creerCommande);
router.get("/", requireAuth, listerCommandesVendeur);
router.get("/commandes", requireAuth, listerCommandesFournisseur);
router.get("/produits", requireAuth, obtenirProduitsVendeur);
router.post("/frais",requireAuth, getFraisCommande);
router.get("/transactions", requireAuth, getTransactions);
router.post("/supprimer", requireAuth, supprimerCommandes);
router.get("/fournisseur/:id", requireAuth, obtenirDetailsCommandeFournisseur);
router.get("/email/:email", requireAuth, getClientByEmail);
//router.put("/update-statut", requireAuth, updateStatutCommande);
router.get("/:id", requireAuth, obtenirDetailsCommande);
router.put("/:id", requireAuth, modifierCommande);
// Routes fournisseur
router.put("/sous-commande/:id/tracking", requireAuth, mettreAJourTracking);


// ✅ Route existante pour mise à jour du statut







export default router;