import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, Menu } from "@headlessui/react";
import api from "../../components/api";

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

export default function SpecialistTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (): Promise<void> => {
    try {
      const res = await api.get("/specialist/tasks");
      setTasks(res.data);
    } catch (error) {
      console.error("Erreur chargement tâches:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, status: Task['status']): Promise<void> => {
    try {
      await api.patch(`/specialist/tasks/${taskId}/status`, 
        { status }
      );

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status });
      }
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
      <Badge className={`${config.color} flex items-center gap-1`}>
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
      <Badge className={priorityColors[priority]}>
        {priority === 'low' ? 'Basse' :
         priority === 'medium' ? 'Moyenne' :
         priority === 'high' ? 'Haute' : 'Urgente'}
      </Badge>
    );
  };

  const openTaskModal = (task: Task): void => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "Total Tâches", value: tasks.length, color: "text-blue-600" },
    { label: "En attente", value: tasks.filter(t => t.status === 'pending').length, color: "text-yellow-600" },
    { label: "En cours", value: tasks.filter(t => t.status === 'in_progress').length, color: "text-blue-600" },
    { label: "Terminées", value: tasks.filter(t => t.status === 'completed').length, color: "text-green-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-teal-600" />
            Mes Tâches
          </h2>
          <p className="text-gray-600 mt-1">Gérez vos tâches assignées</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-teal-400 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des tâches */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tâche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Assignée par: {task.creator?.nom}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="capitalize">
                        {task.module}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.due_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => openTaskModal(task)}
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                >
                                  <ClipboardList className="w-4 h-4 mr-2" />
                                  Voir détails
                                </button>
                              )}
                            </Menu.Item>
                            {task.status === 'pending' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex items-center w-full px-4 py-2 text-sm text-blue-600`}
                                  >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Commencer
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {task.status === 'in_progress' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex items-center w-full px-4 py-2 text-sm text-teal-500`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Terminer
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

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune tâche trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail tâche */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {selectedTask && (
              <>
                <div className="bg-teal-400 text-white p-6">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-2xl font-bold">{selectedTask.title}</Dialog.Title>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Module</p>
                      <p className="font-medium text-gray-900 capitalize mt-2">{selectedTask.module}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Priorité</p>
                      <div className="mt-2">
                        {getPriorityBadge(selectedTask.priority)}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Assignée par</p>
                      <p className="font-medium text-gray-900 mt-2">{selectedTask.creator?.nom}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Échéance</p>
                      <p className="font-medium text-gray-900 mt-2">
                        {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-900">{selectedTask.description || 'Aucune description'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Action requise</p>
                    <p className="text-gray-900">{selectedTask.action_required}</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Fermer
                    </Button>
                    {selectedTask.status === 'pending' && (
                      <Button
                        onClick={() => {
                          updateTaskStatus(selectedTask.id, 'in_progress');
                          setIsModalOpen(false);
                        }}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Commencer
                      </Button>
                    )}
                    {selectedTask.status === 'in_progress' && (
                      <Button
                        onClick={() => {
                          updateTaskStatus(selectedTask.id, 'completed');
                          setIsModalOpen(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Terminer
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
};