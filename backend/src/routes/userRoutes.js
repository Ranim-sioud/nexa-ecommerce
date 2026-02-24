import express from "express";
import {requireAuth} from "../middlewares/authMiddleware.js";
import { getProfile, updateProfile, uploadProfileImage, upload, getMe, updateMe, getFournisseurs, getSoldeVendeur, getSoldeUtilisateur, demanderChangementPack, getMesDemandesPack, getDemandesPackEnAttente, annulerDemandePack } from "../controllers/userController.js";


const router = express.Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);

// Récupérer profil de l'utilisateur connecté
router.get("/", requireAuth, getProfile);

// Mettre à jour profil de l'utilisateur connecté
router.put("/upload-profile", requireAuth, updateProfile);
router.post("/me/upload", requireAuth, upload.single("profileImage"), uploadProfileImage);
router.get("/fournisseurs", requireAuth, getFournisseurs);
router.get("/solde", requireAuth, getSoldeVendeur);
router.get("/utilisateur/solde", requireAuth, getSoldeUtilisateur);
router.post('/demander', requireAuth, demanderChangementPack);
router.get('/mes-demandes', requireAuth, getMesDemandesPack);
router.get('/demandes/en-attente', requireAuth, getDemandesPackEnAttente);
router.post("/annuler-demande", requireAuth, annulerDemandePack);


export default router;