import express from 'express';
import { deletePack, listPacks, updatePack } from '../controllers/packController.js';
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/', listPacks);
router.put('/:id', requireAuth, updatePack);
router.delete('/:id', requireAuth, deletePack);

export default router;