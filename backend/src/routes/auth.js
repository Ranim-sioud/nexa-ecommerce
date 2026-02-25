import express from 'express';
import { registerVendeur, registerFournisseur, login, activateUser, refresh, logout, forgotPassword, verifyResetToken, resetPassword } from '../controllers/authController.js';
const router = express.Router();

router.post('/register-vendeur', registerVendeur);
router.post('/register-fournisseur', registerFournisseur);
router.post('/login', login);
router.get('/activate', activateUser);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

export default router;