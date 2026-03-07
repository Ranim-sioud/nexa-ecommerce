import express from 'express';
import { registerVendeur, registerFournisseur, login, activateUser, refresh, logout, forgotPassword, verifyResetToken, resetPassword } from '../controllers/authController.js';
const router = express.Router();

/**
 * @openapi
 * /auth/register-vendeur:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new Vendeur account
 *     description: Creates a seller account and sends an activation email. Password must be ≥8 chars with uppercase, lowercase and digit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, mot_de_passe, confirmer_mot_de_passe, gouvernorat, ville, adresse, pack_cle]
 *             properties:
 *               nom:                   { type: string, example: 'Ahmed Ben Ali' }
 *               email:                 { type: string, format: email, example: 'ahmed@example.com' }
 *               telephone:             { type: string, example: '20123456' }
 *               mot_de_passe:          { type: string, minLength: 8, example: 'SecurePass1' }
 *               confirmer_mot_de_passe:{ type: string, example: 'SecurePass1' }
 *               gouvernorat:           { type: string, example: 'Tunis' }
 *               ville:                 { type: string, example: 'Tunis' }
 *               adresse:               { type: string, example: 'Rue de la Liberté 12' }
 *               pack_cle:              { type: string, example: 'starter' }
 *               code_parrainage:       { type: string, example: 'VEND-42-AB1C2D' }
 *               facebook_url:          { type: string, nullable: true }
 *               instagram_url:         { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Vendeur created — activation email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:         { type: string }
 *                 user:            { $ref: '#/components/schemas/User' }
 *                 code_parrainage: { type: string }
 *                 lien_parrainage: { type: string }
 *       400:
 *         description: Validation error (missing fields, email taken, password mismatch)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register-vendeur', registerVendeur);

/**
 * @openapi
 * /auth/register-fournisseur:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new Fournisseur (supplier) account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, mot_de_passe, confirmer_mot_de_passe, gouvernorat, ville, adresse, identifiant_public]
 *             properties:
 *               nom:                   { type: string, example: 'Société XYZ' }
 *               email:                 { type: string, format: email }
 *               telephone:             { type: string }
 *               mot_de_passe:          { type: string, minLength: 8 }
 *               confirmer_mot_de_passe:{ type: string }
 *               gouvernorat:           { type: string }
 *               ville:                 { type: string }
 *               adresse:               { type: string }
 *               identifiant_public:    { type: string, example: 'FOUR-XYZ' }
 *               facebook_url:          { type: string, nullable: true }
 *               instagram_url:         { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Fournisseur created — activation email sent
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register-fournisseur', registerFournisseur);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login — sets httpOnly accessToken cookie
 *     description: On success sets `accessToken` (15 min) and `refreshToken` (30 days) as httpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, mot_de_passe]
 *             properties:
 *               email:        { type: string, format: email, example: 'ahmed@example.com' }
 *               mot_de_passe: { type: string, example: 'SecurePass1' }
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string, example: 'accessToken=eyJ...; HttpOnly; Secure; SameSite=Strict' }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:    { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Invalid credentials or account not activated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', login);

/**
 * @openapi
 * /auth/activate:
 *   get:
 *     tags: [Auth]
 *     summary: Activate account via email link
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: JWT activation token from the registration email
 *     responses:
 *       200:
 *         description: Account activated
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/activate', activateUser);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Silently refresh the access token
 *     description: Reads the `refreshToken` httpOnly cookie and issues a new `accessToken` cookie.
 *     responses:
 *       200:
 *         description: Token renewed
 *       401:
 *         description: Missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/refresh', refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — clear auth cookies
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     description: Always returns 200 to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent (or silently ignored if email not found)
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/forgot-password', forgotPassword);

/**
 * @openapi
 * /auth/verify-reset-token/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify a password-reset token before showing the reset form
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid: { type: boolean }
 *                 email: { type: string }
 *       400:
 *         description: Token invalid or expired
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/verify-reset-token/:token', verifyResetToken);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a valid reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, nouveau_mot_de_passe, confirmer_mot_de_passe]
 *             properties:
 *               token:                  { type: string }
 *               nouveau_mot_de_passe:   { type: string, minLength: 8 }
 *               confirmer_mot_de_passe: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or passwords do not match
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/reset-password', resetPassword);

export default router;
