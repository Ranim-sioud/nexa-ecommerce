import { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Users,
  Package,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import api from "../../components/api";

export default function SpecialistDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      pending_tasks: 0,
      in_progress_tasks: 0,
      completed_tasks: 0,
      total_tasks: 0
    },
    permissions: [],
    recent_tasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/specialist/dashboard");
      setDashboardData(res.data);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "En attente",
      value: dashboardData.stats.pending_tasks,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "En cours",
      value: dashboardData.stats.in_progress_tasks,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Terminées",
      value: dashboardData.stats.completed_tasks,
      icon: CheckCircle,
      color: "text-teal-500",
      bgColor: "bg-teal-50"
    },
    {
      title: "Total",
      value: dashboardData.stats.total_tasks,
      icon: ClipboardList,
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: TrendingUp },
      completed: { color: "bg-teal-100 text-teal-500", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle }
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

  const getModuleIcon = (module) => {
    const icons = {
      users: Users,
      products: Package,
      tickets: BarChart3,
      finance: BarChart3,
      logistics: Package,
      training: Users,
      features: BarChart3,
      stock: Package
    };
    
    const Icon = icons[module] || BarChart3;
    return <Icon className="w-4 h-4" />;
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Spécialiste</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de vos tâches et permissions</p>
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
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/specialist/tasks'}>
                Voir tout
              </Button>
            </div>
            <div className="space-y-4">
              {dashboardData.recent_tasks.length > 0 ? dashboardData.recent_tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">Assignée par: {task.creator?.nom}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Aucune tâche récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mes Permissions</h3>
              <Badge variant="outline">
                {dashboardData.permissions.length} modules
              </Badge>
            </div>
            <div className="space-y-3">
              {dashboardData.permissions.length > 0 ? dashboardData.permissions.map((perm, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getModuleIcon(perm.module)}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{perm.module}</p>
                      <div className="flex gap-1 mt-1">
                        {perm.can_view && <Badge variant="outline" className="text-xs">Voir</Badge>}
                        {perm.can_edit && <Badge variant="outline" className="text-xs">Éditer</Badge>}
                        {perm.can_manage && <Badge variant="outline" className="text-xs">Gérer</Badge>}
                        {perm.can_delete && <Badge variant="outline" className="text-xs">Supprimer</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Aucune permission assignée</p>
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
              onClick={() => window.location.href = '/specialist/users'}
            >
              <Users className="w-4 h-4" />
              Gérer les utilisateurs
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2 justify-center"
              onClick={() => window.location.href = '/specialist/products'}
            >
              <Package className="w-4 h-4" />
              Gérer les produits
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2 justify-center"
              onClick={() => window.location.href = '/specialist/tasks'}
            >
              <ClipboardList className="w-4 h-4" />
              Mes tâches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}