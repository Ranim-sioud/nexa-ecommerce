import express from 'express';
import { registerVendeur, registerFournisseur, registerAdmin, login, activateUser, refresh, logout } from '../controllers/authController.js';
const router = express.Router();

router.post('/register-vendeur', registerVendeur);
router.post('/register-fournisseur', registerFournisseur);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.get('/activate', activateUser);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;