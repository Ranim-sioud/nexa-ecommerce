import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from './api';

interface INotification {
  id: number;
  id_user: number;
  id_produit: number;
  message: string;
  cree_le: string;
  lu: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAllNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/all");
      setNotifications(res.data);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const handleNotificationClick = (notification: INotification) => {
    if (notification.id_produit) {
      navigate(`/produit/${notification.id_produit}`);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer toutes les notifications ?")) {
      try {
        await api.delete("/notifications");
        setNotifications([]); 
      } catch (err) {
        console.error("Erreur suppression:", err);
      }
    }
  };

  const handleDeleteOne = (e: React.MouseEvent, idToDelete: number) => {
    e.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== idToDelete));
    // Ajouter l'appel API ici
  };

  return (
    // Fond blanc global pour être propre
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* --- Header avec marges ajustées --- */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          </div>
          
          <button
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            // Style du bouton "Supprimer tout" amélioré (Rouge doux)
            className="bg-pink-600 hover:bg-pink-700 text-white pr-2.5  px-2 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer tout</span>
          </button>
        </div>

        {/* --- Liste des Notifications --- */}
        {/* space-y-5 gère l'espace vertical ENTRE les cartes */}
        <div className="space-y-5"> 
          
          {loading && <p className="text-center text-gray-500 py-10">Chargement...</p>}
          
          {!loading && notifications.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">Vous n'avez aucune notification.</p>
            </div>
          )}

          {!loading && notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              // --- CSS CLÉS POUR LE DESIGN ---
              // p-6 : Donne beaucoup d'espace interne (le padding que vous vouliez)
              // rounded-2xl : Arrondit bien les coins
              // border-gray-200 : Bordure subtile
              // shadow-sm : Légère ombre
              className="mb-4 group w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between gap-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {/* Partie Gauche : Icône + Texte */}
              <div className="flex items-center gap-5 flex-1 ">
                
                {/* Icône Ronde */}
                <div className="w-14 h-14 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0 text-cyan-600">
                  <ShoppingCart className="w-6 h-6" />
                </div>

                {/* Texte */}
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium text-base leading-snug">
                    {n.message}
                  </span>
                  <span className="text-gray-400 text-xs mt-1">
                    {new Date(n.cree_le).toLocaleString('fr-FR', { 
                      day: '2-digit', month: '2-digit', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>

              {/* Partie Droite : Bouton X */}
              <button
                onClick={(e) => handleDeleteOne(e, n.id)}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}