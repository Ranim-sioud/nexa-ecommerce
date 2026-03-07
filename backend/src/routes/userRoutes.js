import express from "express";
import {requireAuth} from "../middlewares/authMiddleware.js";
import { getProfile, updateProfile, uploadProfileImage, upload, getMe, updateMe, getFournisseurs, getSoldeVendeur, getSoldeUtilisateur, demanderChangementPack, getMesDemandesPack, getDemandesPackEnAttente, annulerDemandePack } from "../controllers/userController.js";

const router = express.Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     tags: [Users]
 *     summary: Update the authenticated user's profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:          { type: string }
 *               telephone:    { type: string }
 *               gouvernorat:  { type: string }
 *               ville:        { type: string }
 *               adresse:      { type: string }
 *               facebook_url: { type: string }
 *               instagram_url:{ type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get full profile with role-specific data (vendeur/fournisseur)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Full profile object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", requireAuth, getProfile);

/**
 * @openapi
 * /users/upload-profile:
 *   put:
 *     tags: [Users]
 *     summary: Update profile text fields (alternative to PUT /me)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:          { type: string }
 *               telephone:    { type: string }
 *               gouvernorat:  { type: string }
 *               ville:        { type: string }
 *               adresse:      { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/upload-profile", requireAuth, updateProfile);

/**
 * @openapi
 * /users/me/upload:
 *   post:
 *     tags: [Users]
 *     summary: Upload a profile picture (multipart/form-data)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded, URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 image_url: { type: string }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/me/upload", requireAuth, upload.single("profileImage"), uploadProfileImage);

/**
 * @openapi
 * /users/fournisseurs:
 *   get:
 *     tags: [Users]
 *     summary: List all active suppliers (Vendeur use)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of fournisseurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/fournisseurs", requireAuth, getFournisseurs);

/**
 * @openapi
 * /users/solde:
 *   get:
 *     tags: [Users]
 *     summary: Get the Vendeur's wallet balance
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 solde: { type: number, format: decimal, example: 1250.50 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/solde", requireAuth, getSoldeVendeur);

/**
 * @openapi
 * /users/utilisateur/solde:
 *   get:
 *     tags: [Users]
 *     summary: Get any user's wallet balance (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/utilisateur/solde", requireAuth, getSoldeUtilisateur);

/**
 * @openapi
 * /users/demander:
 *   post:
 *     tags: [Users]
 *     summary: Request a pack upgrade/change
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pack_cle]
 *             properties:
 *               pack_cle: { type: string, example: 'premium' }
 *     responses:
 *       200:
 *         description: Request submitted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/demander', requireAuth, demanderChangementPack);

/**
 * @openapi
 * /users/mes-demandes:
 *   get:
 *     tags: [Users]
 *     summary: List the authenticated user's pack change requests
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of pack change requests
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/mes-demandes', requireAuth, getMesDemandesPack);

/**
 * @openapi
 * /users/demandes/en-attente:
 *   get:
 *     tags: [Users]
 *     summary: List pending pack change requests (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of pending requests
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/demandes/en-attente', requireAuth, getDemandesPackEnAttente);

/**
 * @openapi
 * /users/annuler-demande:
 *   post:
 *     tags: [Users]
 *     summary: Cancel a pending pack change request
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [demande_id]
 *             properties:
 *               demande_id: { type: integer }
 *     responses:
 *       200:
 *         description: Request cancelled
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/annuler-demande", requireAuth, annulerDemandePack);

export default router;
