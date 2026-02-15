import { useEffect, useState } from "react";
import {
  Key,
  Search,
  UserPlus,
  Check,
  Eye,
  Edit,
  Trash2,
  Settings,
  ChevronRight,
  Calendar,
  User,
  Package,
  FileText,
  DollarSign,
  Truck,
  GraduationCap,
  Sparkles,
  Box,
  X
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog } from "@headlessui/react";
import api from "../../components/api";

const MODULES = [
  { value: "users", label: "Utilisateurs", description: "Gestion des comptes utilisateurs", icon: User },
  { value: "products", label: "Produits", description: "Gestion du catalogue produits", icon: Package },
  { value: "tickets", label: "Tickets", description: "Gestion du support", icon: FileText },
  { value: "finance", label: "Finance", description: "Gestion financière", icon: DollarSign },
  { value: "logistics", label: "Logistique", description: "Gestion logistique", icon: Truck },
  { value: "training", label: "Formation", description: "Gestion des formations", icon: GraduationCap },
  { value: "features", label: "Fonctionnalités", description: "Gestion des demandes", icon: Sparkles },
  { value: "stock", label: "Stock", description: "Gestion des stocks", icon: Box }
];

export default function AdminPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [newPermission, setNewPermission] = useState({
    can_view: false,
    can_edit: false,
    can_delete: false,
    can_manage: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permsRes, specsRes] = await Promise.all([
        api.get("/admin/permissions"),
        api.get("/admin/specialists")
      ]);

      setPermissions(permsRes.data);
      setSpecialists(specsRes.data.filter(s => s.actif));
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedSpecialist || !selectedModule) {
      alert("Veuillez sélectionner un spécialiste et un module");
      return;
    }

    try {
      await api.post("/admin/permissions", {
        specialist_id: parseInt(selectedSpecialist),
        module: selectedModule,
        ...newPermission
      });

      fetchData();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur ajout permission:", error);
      alert("Erreur lors de l'ajout de la permission");
    }
  };

  const handleRemovePermission = async (permissionId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette permission ?")) return;

    try {
      await api.delete(`/admin/permissions/${permissionId}`);
      fetchData();
    } catch (error) {
      console.error("Erreur suppression permission:", error);
    }
  };

  const resetForm = () => {
    setSelectedSpecialist("");
    setSelectedModule("");
    setNewPermission({
      can_view: false,
      can_edit: false,
      can_delete: false,
      can_manage: false
    });
  };

  const filteredPermissions = permissions.filter(perm =>
    perm.specialist?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    perm.module?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModuleName = (module) => {
    return MODULES.find(m => m.value === module)?.label || module;
  };

  const getModuleIcon = (module) => {
    const ModuleIcon = MODULES.find(m => m.value === module)?.icon || Key;
    return <ModuleIcon className="w-4 h-4" />;
  };

  const getActionBadges = (perm) => {
    const actions = [];
    if (perm.can_view) actions.push("Voir");
    if (perm.can_edit) actions.push("Éditer");
    if (perm.can_delete) actions.push("Supprimer");
    if (perm.can_manage) actions.push("Gérer");
    
    return actions.map(action => (
      <Badge key={action} variant="outline" className="text-xs bg-gray-50">
        {action}
      </Badge>
    ));
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" />
            Gestion des Permissions
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Configurez les accès et droits des spécialistes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-teal-400 text-sm sm:text-base"
            />
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className=" sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nouvelle permission
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
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
                    Module
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignée par
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                          {perm.specialist?.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {perm.specialist?.nom}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[150px]">
                            {perm.specialist?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-teal-600">
                          {getModuleIcon(perm.module)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {getModuleName(perm.module)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {MODULES.find(m => m.value === perm.module)?.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getActionBadges(perm)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {perm.assigner?.nom || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">
                        {perm.assigner?.email}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(perm.assigned_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePermission(perm.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredPermissions.map((perm) => (
          <Card key={perm.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Header with specialist info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {perm.specialist?.nom?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{perm.specialist?.nom}</h3>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">
                      {perm.specialist?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePermission(perm.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Module info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-teal-600">
                    {getModuleIcon(perm.module)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 capitalize">
                      {getModuleName(perm.module)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {MODULES.find(m => m.value === perm.module)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions badges */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Permissions :</p>
                <div className="flex flex-wrap gap-1">
                  {getActionBadges(perm)}
                </div>
              </div>

              {/* Assigner and date */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Par: {perm.assigner?.nom || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(perm.assigned_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredPermissions.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg">
          <Key className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">Aucune permission trouvée</p>
          {searchQuery ? (
            <Button 
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Effacer la recherche
            </Button>
          ) : (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Créer une permission
            </Button>
          )}
        </div>
      )}

      {/* Modal ajout permission - Responsive */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="p-4 sm:p-6">
              {/* Header modal avec bordure */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <Dialog.Title className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5 text-teal-600" />
                  Nouvelle Permission
                </Dialog.Title>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Sélection spécialiste */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Spécialiste *
                  </label>
                  <select
                    value={selectedSpecialist}
                    onChange={(e) => setSelectedSpecialist(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  >
                    <option value="">Sélectionner un spécialiste</option>
                    {specialists.map(spec => (
                      <option key={spec.id} value={spec.id}>
                        {spec.nom} - {spec.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection module */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Module *
                  </label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  >
                    <option value="">Sélectionner un module</option>
                    {MODULES.map(module => (
                      <option key={module.value} value={module.value}>
                        {module.label} - {module.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">
                    Droits d'accès
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'can_view', label: 'Voir', icon: Eye },
                      { key: 'can_edit', label: 'Éditer', icon: Edit },
                      { key: 'can_delete', label: 'Supprimer', icon: Trash2 },
                      { key: 'can_manage', label: 'Gérer', icon: Settings }
                    ].map(({ key, label, icon: Icon }) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={newPermission[key]}
                          onChange={(e) => setNewPermission(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-400"
                        />
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-xs sm:text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions modal */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddPermission}
                  className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Créer la permission
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}