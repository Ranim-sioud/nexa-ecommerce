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

export async function updatePack(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const pack = await Pack.findByPk(id);
    if (!pack) {
      return res.status(404).json({ message: 'Pack non trouvé' });
    }
    
    // Validation des données
    if (updateData.prix && updateData.prix < 0) {
      return res.status(400).json({ message: 'Le prix ne peut pas être négatif' });
    }
    
    await pack.update(updateData);
    
    // Log de l'action pour traçabilité
    console.log(`Pack ${id} modifié par ${req.user?.id || 'admin'}`);
    
    res.json(pack);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function deletePack(req, res) {
  try {
    const { id } = req.params;
    
    // Vérifier si le pack existe
    const pack = await Pack.findByPk(id);
    if (!pack) {
      return res.status(404).json({ 
        message: 'Pack non trouvé',
        packId: id 
      });
    }

    // Sauvegarder les infos du pack supprimé pour le log
    const packInfo = {
      id: pack.id,
      cle: pack.cle,
      titre: pack.titre,
      prix: pack.prix
    };

    // Supprimer le pack
    await pack.destroy();
    
    // Log de la suppression
    console.log(`Pack supprimé: ${JSON.stringify(packInfo)} par ${req.user?.id || 'admin'}`);
    
    // Réponse de succès
    res.status(200).json({ 
      message: 'Pack supprimé avec succès',
      deletedPack: packInfo
    });

  } catch (err) {
    console.error('Erreur lors de la suppression du pack:', err);
    
    // Gestion spécifique des erreurs de contrainte de clé étrangère
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ 
        message: 'Impossible de supprimer ce pack car il est utilisé ailleurs',
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
