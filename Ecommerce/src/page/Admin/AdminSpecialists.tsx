import { useEffect, useState } from "react";
import {
  Users,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  Key,
  ClipboardList,
  ChevronRight,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, Menu } from "@headlessui/react";
import api from "../../components/api";

export default function AdminSpecialists() {
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    try {
      const res = await api.get("/admin/specialists");
      setSpecialists(res.data);
    } catch (error) {
      console.error("Erreur chargement spécialistes:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (specialist) => {
    try {
      await api.patch(
        `/admin/users/${specialist.id}/status`,
        { actif: !specialist.actif }
      );
      setSpecialists(prev => prev.map(s => 
        s.id === specialist.id ? { ...s, actif: !s.actif } : s
      ));
    } catch (error) {
      console.error("Erreur activation spécialiste:", error);
    }
  };

  const openSpecialistModal = (specialist) => {
    setSelectedSpecialist(specialist);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const filteredSpecialists = specialists.filter(specialist =>
    specialist.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    specialist.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionCount = (specialist) => {
    return specialist.permissions?.length || 0;
  };

  const getTaskCount = (specialist) => {
    return specialist.assigned_tasks?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header - Desktop & Mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" />
            <span>Gestion des Spécialistes</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gérez les comptes et permissions des spécialistes
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            type="text"
            placeholder="Rechercher un spécialiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-teal-400 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{specialists.length}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Actifs</p>
            <p className="text-xl sm:text-2xl font-bold text-teal-600">
              {specialists.filter(s => s.actif).length}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Permissions</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {specialists.reduce((acc, s) => acc + getPermissionCount(s), 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Tâches</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">
              {specialists.reduce((acc, s) => acc + getTaskCount(s), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialiste
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tâches
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSpecialists.map((specialist) => (
                  <tr key={specialist.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-400 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                          {specialist.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900">{specialist.nom}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-[150px]">{specialist.email}</div>
                      <div className="text-sm text-gray-500">{specialist.telephone || "-"}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                        <Key className="w-3 h-3 mr-1" />
                        {getPermissionCount(specialist)}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                        <ClipboardList className="w-3 h-3 mr-1" />
                        {getTaskCount(specialist)}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge className={`${
                        specialist.actif ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"
                      } text-xs`}>
                        {specialist.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => openSpecialistModal(specialist)}
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-colors`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => toggleActive(specialist)}
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm ${
                                    specialist.actif ? 'text-yellow-600' : 'text-teal-600'
                                  } transition-colors`}
                                >
                                  {specialist.actif ? (
                                    <UserX className="w-4 h-4 mr-2" />
                                  ) : (
                                    <UserCheck className="w-4 h-4 mr-2" />
                                  )}
                                  {specialist.actif ? 'Désactiver' : 'Activer'}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => window.location.href = `/admin/permissions?specialist=${specialist.id}`}
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm text-blue-600 transition-colors`}
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Gérer permissions
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {filteredSpecialists.map((specialist) => (
          <Card key={specialist.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* En-tête avec avatar et nom */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {specialist.nom?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{specialist.nom}</h3>
                    <Badge className={`mt-1 ${
                      specialist.actif ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"
                    } text-xs`}>
                      {specialist.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                
                {/* Menu mobile */}
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openSpecialistModal(specialist)}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors`}
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            Voir détails
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => toggleActive(specialist)}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-3 text-sm ${
                              specialist.actif ? 'text-yellow-600' : 'text-teal-600'
                            } transition-colors`}
                          >
                            {specialist.actif ? (
                              <UserX className="w-4 h-4 mr-3" />
                            ) : (
                              <UserCheck className="w-4 h-4 mr-3" />
                            )}
                            {specialist.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => window.location.href = `/admin/permissions?specialist=${specialist.id}`}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-3 text-sm text-blue-600 transition-colors`}
                          >
                            <Key className="w-4 h-4 mr-3" />
                            Gérer permissions
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              </div>

              {/* Informations de contact */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{specialist.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{specialist.telephone || "Non renseigné"}</span>
                </div>
              </div>

              {/* Badges permissions et tâches */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Key className="w-3 h-3 mr-1" />
                  {getPermissionCount(specialist)} permission{getPermissionCount(specialist) !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  <ClipboardList className="w-3 h-3 mr-1" />
                  {getTaskCount(specialist)} tâche{getTaskCount(specialist) !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Bouton voir détails mobile */}
              <button
                onClick={() => openSpecialistModal(specialist)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
              >
                Voir détails complets
                <ChevronRight className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message aucun résultat */}
      {filteredSpecialists.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">Aucun spécialiste trouvé</p>
          {searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Effacer la recherche
            </Button>
          )}
        </div>
      )}

      {/* Modal détail spécialiste - Responsive */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            {/* ✅ Bordure autour du dialogue - border border-gray-200 shadow-xl */}
            {selectedSpecialist && (
              <>
                {/* Header modal - avec bordure en bas */}
                <div className="bg-gradient-to-r from-teal-400 to-teal-500 text-white p-4 sm:p-6 sticky top-0 z-10 border-b border-teal-600/30">
                  {/* ✅ Bordure basse du header - border-b border-teal-600/30 */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white text-teal-500 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                      {selectedSpecialist.nom?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Dialog.Title className="text-xl sm:text-2xl font-bold truncate">
                        {selectedSpecialist.nom}
                      </Dialog.Title>
                      <p className="text-teal-100 text-sm sm:text-base truncate">
                        {selectedSpecialist.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenu modal - Responsive */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Informations de base */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Informations</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Téléphone
                        </p>
                        <p className="font-medium text-sm sm:text-base">{selectedSpecialist.telephone || "-"}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Création
                        </p>
                        <p className="font-medium text-sm sm:text-base">
                          {new Date(selectedSpecialist.cree_le).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Permissions - Responsive grid */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                      Permissions ({selectedSpecialist.permissions?.length || 0})
                    </h3>
                    {selectedSpecialist.permissions?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {selectedSpecialist.permissions.map((perm, index) => (
                          <div key={index} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <p className="font-medium capitalize text-sm sm:text-base">{perm.module}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {perm.can_view && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-gray-50">
                                  Voir
                                </Badge>
                              )}
                              {perm.can_edit && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-gray-50">
                                  Éditer
                                </Badge>
                              )}
                              {perm.can_manage && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-gray-50">
                                  Gérer
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg text-center">
                        Aucune permission assignée
                      </p>
                    )}
                  </div>

                  {/* Tâches récentes */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                      Tâches assignées ({selectedSpecialist.assigned_tasks?.length || 0})
                    </h3>
                    {selectedSpecialist.assigned_tasks?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSpecialist.assigned_tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <p className="font-medium text-sm sm:text-base">{task.title}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge className={
                                task.status === 'pending' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 text-xs' :
                                'bg-teal-100 text-teal-800 text-xs'
                              }>
                                {task.status === 'pending' ? 'En attente' :
                                 task.status === 'in_progress' ? 'En cours' : 'Terminé'}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-gray-50">
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg text-center">
                        Aucune tâche assignée
                      </p>
                    )}
                  </div>
                  
                  {/* Actions modal - avec bordure en haut déjà existante */}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                    {/* ✅ Bordure haute déjà présente - border-t border-gray-200 */}
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="sm:w-auto"
                    >
                      Fermer
                    </Button>
                    <Button
                      onClick={() => {
                        setIsModalOpen(false);
                        window.location.href = `/admin/permissions?specialist=${selectedSpecialist.id}`;
                      }}
                      className="sm:w-auto bg-teal-500 hover:bg-teal-600"
                    >
                      Gérer les permissions
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}