import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  ChevronRight,
  X,
  Filter
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, Menu } from "@headlessui/react";
import api from "../../components/api";

type ModuleType = 
  | 'users' 
  | 'products' 
  | 'tickets' 
  | 'finance' 
  | 'logistics' 
  | 'training'
  | 'features'
  | 'stock';

interface NewTaskForm {
  assigned_to: number;
  title: string;
  description: string;
  module: ModuleType;
  action_required: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  assigned_by: number;
  module: string;
  action_required: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assignee?: {
    id: number;
    nom: string;
    email: string;
  };
  creator?: {
    id: number;
    nom: string;
    email: string;
  };
}

interface Specialist {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  actif: boolean;
  permissions: any[];
  assigned_tasks: any[];
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<NewTaskForm>({
    assigned_to: 0,
    title: "",
    description: "",
    module: "users",
    action_required: "",
    due_date: "",
    priority: "medium"
  });

  const modules: { value: ModuleType; label: string }[] = [
    { value: "users", label: "Utilisateurs" },
    { value: "products", label: "Produits" },
    { value: "tickets", label: "Tickets" },
    { value: "finance", label: "Finance" },
    { value: "logistics", label: "Logistique" },
    { value: "training", label: "Formation" },
    { value: "features", label: "Fonctionnalités" },
    { value: "stock", label: "Stock" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    try {
      const [tasksRes, specialistsRes] = await Promise.all([
        api.get("/admin/tasks"), 
        api.get("/admin/specialists")
      ]);

      setTasks(tasksRes.data);
      setSpecialists(specialistsRes.data.filter((s: Specialist) => s.actif));
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (): Promise<void> => {
    try {
      await api.post("/admin/tasks", newTask);

      fetchData();
      setIsCreateModalOpen(false);
      setNewTask({
        assigned_to: 0,
        title: "",
        description: "",
        module: "users",
        action_required: "",
        due_date: "",
        priority: "medium"
      });
    } catch (error) {
      console.error("Erreur création tâche:", error);
      alert("Erreur lors de la création de la tâche");
    }
  };

  const updateTaskStatus = async (taskId: number, status: Task['status']): Promise<void> => {
    try {
      await api.patch(`/admin/tasks/${taskId}/status`, { status });

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
    }
  };

  const getStatusBadge = (status: Task['status']): React.ReactNode => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: TrendingUp },
      completed: { color: "bg-teal-100 text-teal-600", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
        <Icon className="w-3 h-3" />
        {status === 'pending' ? 'En attente' : 
         status === 'in_progress' ? 'En cours' :
         status === 'completed' ? 'Terminée' : 'Annulée'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Task['priority']): React.ReactNode => {
    const priorityColors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={`${priorityColors[priority]} text-xs`}>
        {priority === 'low' ? 'Basse' :
         priority === 'medium' ? 'Moyenne' :
         priority === 'high' ? 'Haute' : 'Urgente'}
      </Badge>
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.assignee?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" />
            Gestion des Tâches
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Assignez et suivez les tâches des spécialistes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche et filtres - Desktop */}
          <div className="hidden sm:flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          {/* Barre de recherche et filtres - Mobile */}
          <div className="flex sm:hidden gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-teal-400 text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="px-3"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Menu filtre mobile */}
      {isFilterMenuOpen && (
        <Card className="sm:hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Filtrer par statut</h3>
              <button
                onClick={() => setIsFilterMenuOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Tous" },
                { value: "pending", label: "En attente" },
                { value: "in_progress", label: "En cours" },
                { value: "completed", label: "Terminée" },
                { value: "cancelled", label: "Annulée" }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(option.value);
                    setIsFilterMenuOpen(false);
                  }}
                  className={statusFilter === option.value ? "bg-teal-500" : ""}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Tâches</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">En attente</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">En cours</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Terminées</p>
            <p className="text-xl sm:text-2xl font-bold text-teal-500">
              {tasks.filter(t => t.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tâche
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignée à
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[200px]">
                          {task.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {task.assignee?.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="ml-2 sm:ml-3">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {task.assignee?.nom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="capitalize text-xs">
                        {task.module}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '-'}
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
                                  onClick={() => setSelectedTask(task)}
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-colors`}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Voir détails
                                </button>
                              )}
                            </Menu.Item>
                            {task.status !== 'completed' && task.status !== 'cancelled' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex items-center w-full px-4 py-2 text-sm text-teal-600 transition-colors`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marquer terminée
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {task.status !== 'cancelled' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'cancelled')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex items-center w-full px-4 py-2 text-sm text-red-600 transition-colors`}
                                  >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Annuler
                                  </button>
                                )}
                              </Menu.Item>
                            )}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base pr-2">
                      {task.title}
                    </h3>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {task.description || "Aucune description"}
                  </p>
                </div>
              </div>

              {/* Assigné à */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {task.assignee?.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{task.assignee?.nom}</p>
                  <p className="text-xs text-gray-500 truncate">{task.assignee?.email}</p>
                </div>
              </div>

              {/* Badges et échéance */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="capitalize text-xs">
                  {task.module}
                </Badge>
                {getStatusBadge(task.status)}
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              {/* Action requise */}
              {task.action_required && (
                <div className="bg-gray-50 rounded-lg p-2 mb-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Action :</span> {task.action_required}
                  </p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTask(task)}
                  className="flex-1 text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Détails
                </Button>
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Terminer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg">
          <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">Aucune tâche trouvée</p>
          {searchQuery && (
            <Button 
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Effacer la recherche
            </Button>
          )}
        </div>
      )}

      {/* Modal création tâche - Responsive */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="p-4 sm:p-6">
              {/* Header modal */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <Dialog.Title className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600" />
                  Nouvelle Tâche
                </Dialog.Title>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <Input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de la tâche"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    rows={3}
                    placeholder="Description détaillée de la tâche..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Assignée à *
                    </label>
                    <select
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    >
                      <option value={0}>Sélectionner un spécialiste</option>
                      {specialists.map(spec => (
                        <option key={spec.id} value={spec.id}>
                          {spec.nom} - {spec.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Module *
                    </label>
                    <select
                      value={newTask.module}
                      onChange={(e) => setNewTask(prev => ({ ...prev, module: e.target.value as ModuleType }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    >
                      {modules.map(module => (
                        <option key={module.value} value={module.value}>
                          {module.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Action requise *
                    </label>
                    <Input
                      type="text"
                      value={newTask.action_required}
                      onChange={(e) => setNewTask(prev => ({ ...prev, action_required: e.target.value }))}
                      placeholder="Action à effectuer"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Priorité *
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Date d'échéance
                  </label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateTask}
                  disabled={!newTask.title || !newTask.assigned_to || !newTask.action_required}
                  className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la tâche
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal détail tâche - Responsive */}
      <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            {selectedTask && (
              <>
                {/* Header modal avec bordure */}
                <div className="bg-gradient-to-r from-teal-400 to-teal-500 text-white p-4 sm:p-6 sticky top-0 z-10 border-b border-teal-600/30">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg sm:text-2xl font-bold truncate pr-4">
                      {selectedTask.title}
                    </Dialog.Title>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Grille d'informations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                        <User className="w-3 h-3" /> Assignée à
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                          {selectedTask.assignee?.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base text-gray-900">{selectedTask.assignee?.nom}</p>
                          <p className="text-xs text-gray-600 truncate max-w-[150px]">{selectedTask.assignee?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Module</p>
                      <p className="font-medium text-sm sm:text-base text-gray-900 capitalize">{selectedTask.module}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Priorité</p>
                      <div className="mt-1">
                        {getPriorityBadge(selectedTask.priority)}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                        <Calendar className="w-3 h-3" /> Échéance
                      </p>
                      <p className="font-medium text-sm sm:text-base text-gray-900">
                        {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Description</p>
                    <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">
                      {selectedTask.description || 'Aucune description'}
                    </p>
                  </div>

                  {/* Action requise */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Action requise</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">
                      {selectedTask.action_required}
                    </p>
                  </div>

                  {/* Métadonnées */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <p>Créée par: {selectedTask.creator?.nom || 'N/A'}</p>
                    <p>Créée le: {new Date(selectedTask.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTask(null)}
                      className="w-full sm:w-auto"
                    >
                      Fermer
                    </Button>
                    {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                      <Button
                        onClick={() => {
                          updateTaskStatus(selectedTask.id, 'completed');
                          setSelectedTask(null);
                        }}
                        className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marquer terminée
                      </Button>
                    )}
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