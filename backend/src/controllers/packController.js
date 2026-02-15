import { Pack } from '../models/index.js';

export async function listPacks(req, res) {
  try {
    const packs = await Pack.findAll();
    res.json(packs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}