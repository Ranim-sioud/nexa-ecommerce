import express from 'express';
import { listPacks } from '../controllers/packController.js';
const router = express.Router();

router.get('/', listPacks);

export default router;