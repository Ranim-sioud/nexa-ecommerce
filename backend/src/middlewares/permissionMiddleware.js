import { Permission } from '../models/index.js';

// middlewares/permissionMiddleware.js
export const requirePermission = (module, action = 'view') => {
  return async (req, res, next) => {
    try {
      // Admin a tous les droits
      if (req.user.role === 'admin') {
        return next();
      }

      // Vérifier les permissions pour les spécialistes
      if (req.user.role === 'specialiste') {
        const permission = await Permission.findOne({
          where: {
            specialist_id: req.user.id,
            module: module
          }
        });

        if (!permission) {
          return res.status(403).json({ 
            message: `Accès refusé: Aucune permission pour le module ${module}` 
          });
        }

        // Vérifier l'action spécifique avec mapping amélioré
        const actionMap = {
          'view': 'can_view',
          'edit': 'can_edit', 
          'delete': 'can_delete',
          'manage': 'can_manage',
          'update': 'can_edit',
          'create': 'can_manage'
        };

        const actionField = actionMap[action];
        if (!actionField) {
          return res.status(403).json({ 
            message: `Action non reconnue: ${action}` 
          });
        }

        if (!permission[actionField]) {
          return res.status(403).json({ 
            message: `Action non autorisée: ${action} sur le module ${module}` 
          });
        }

        return next();
      }

      // Autres rôles
      return res.status(403).json({ 
        message: 'Accès refusé: Rôle insuffisant' 
      });

    } catch (error) {
      console.error('Erreur vérification permission:', error);
      return res.status(500).json({ message: 'Erreur vérification des permissions' });
    }
  };
};