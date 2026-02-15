import { useEffect, useState } from "react";
import {
  Users,
  Package,
  ClipboardList,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import api from "../../components/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    pending_tasks: 0,
    active_specialists: 0,
    openTickets: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, tasksRes, specialistsRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/tasks?status=pending"), 
        api.get("/admin/specialists")
      ]);
      console.log('dashboardRes.data.stats:',dashboardRes.data.stats)
      setStats(dashboardRes.data.stats);
      setRecentTasks(tasksRes.data.slice(0, 5));
      setSpecialists(specialistsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Utilisateurs Total",
      value: stats.total_users,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      
    },
    {
      title: "Produits",
      value: stats.total_products,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Tâches en attente",
      value: stats.pending_tasks,
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Spécialistes Actifs",
      value: stats.active_specialists,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: TrendingUp },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { color: "bg-pink-100 text-pink-600", icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
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

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-pink-100 text-pink-600"
    };
    
    return (
      <Badge className={priorityColors[priority]}>
        {priority === 'low' ? 'Basse' :
         priority === 'medium' ? 'Moyenne' :
         priority === 'high' ? 'Haute' : 'Urgente'}
      </Badge>
    );
  };

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
      <div className="flex items-start gap-3">
        <LayoutGrid className="h-8 w-8 text-gray-900 mt-1" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Admin</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de votre plateforme</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tâches récentes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tâches Récentes</h3>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/tasks'}>
                Voir tout
              </Button>
            </div>
            <div className="space-y-4">
              {recentTasks.length > 0 ? recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">Assignée à: {task.assignee?.nom}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Aucune tâche en attente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Spécialistes actifs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Spécialistes Actifs</h3>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/specialists'}>
                Voir tout
              </Button>
            </div>
            <div className="space-y-3">
              {specialists.length > 0 ? specialists.map((specialist) => (
                <div key={specialist.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {specialist.nom?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{specialist.nom}</p>
                      <p className="text-sm text-gray-600">{specialist.email}</p>
                    </div>
                  </div>
                  <Badge variant={specialist.actif ? "default" : "secondary"}>
                    {specialist.actif ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Aucun spécialiste actif</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="flex items-center gap-2 justify-center"
              onClick={() => window.location.href = '/admin/permissions'}
            >
              <Shield className="w-4 h-4" />
              Gérer les permissions
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2 justify-center"
              onClick={() => window.location.href = '/admin/tasks'}
            >
              <ClipboardList className="w-4 h-4" />
              Assigner une tâche
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2 justify-center"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="w-4 h-4" />
              Gérer utilisateurs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}