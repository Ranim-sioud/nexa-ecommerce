import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  MapPin,
  Calendar,
  Trash2,
  Clock,
  User,
  Shield,
  Globe,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, Menu } from "@headlessui/react";
import api from "../../components/api";

interface User {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role: 'vendeur' | 'fournisseur' | 'admin' | 'specialiste';
  gouvernorat: string;
  ville: string;
  adresse: string;
  facebook_url?: string;
  instagram_url?: string;
  actif: boolean;
  validation: boolean;
  image_url?: string;
  cree_le: string;
  profileImage?: string;
}

export default function SpecialistUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const res = await api.get("/specialist/dashboard");
      setUserPermissions(res.data.permissions);
    } catch (error) {
      console.error("Erreur chargement permissions:", error);
    }
  };

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (module, action) => {
    const permission = userPermissions.find(p => p.module === module);
    if (!permission) return false;
    
    const actionMap = {
      'view': 'can_view',
      'edit': 'can_edit',
      'manage': 'can_manage',
      'delete': 'can_delete'
    };
    
    return permission[actionMap[action]] || false;
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      const res = await api.get("/specialist/users");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user: User): Promise<void> => {
    try {
      await api.patch(
        `/specialist/users/${user.id}/status`,
        { actif: !user.actif }
      );
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, actif: !u.actif } : u
      ));
    } catch (error) {
      console.error("Erreur activation utilisateur:", error);
    }
  };

  const openDeleteModal = (user: User): void => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const deleteUser = async (): Promise<void> => {
    if (!userToDelete) return;

    try {
      await api.delete(
        `/specialist/users/${userToDelete.id}`
      );
      
      // Mettre à jour la liste des utilisateurs
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      
      console.log("Utilisateur supprimé avec succès");
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const openUserModal = (user: User): void => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const vendeurs = filteredUsers.filter(u => u.role === "vendeur");
  const fournisseurs = filteredUsers.filter(u => u.role === "fournisseur");

  const stats = [
    { label: "Total Utilisateurs", value: users.length, color: "text-blue-600" },
    { label: "Actifs", value: users.filter(u => u.actif).length, color: "text-teal-500" },
    { label: "Vendeurs", value: vendeurs.length, color: "text-cyan-600" },
    { label: "Fournisseurs", value: fournisseurs.length, color: "text-purple-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  const renderUserTable = (userList: User[], title: string) => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-teal-400" />
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <div className="flex-1 border-b border-gray-200 ml-2"></div>
        </div>

        {/* --- VUE TABLEAU (Desktop et Tablette) --- */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border-collapse text-sm md:table">
            <thead className="bg-gray-50 text-gray-700 text-left">
              <tr>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Localisation</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((user, i) => (
                <tr key={user.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b hover:bg-teal-50 transition`}>
                  <td className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                      {user.nom?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{user.nom}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>

                  <td className="p-3">
                    <p className="text-gray-600">{user.telephone || "-"}</p>
                  </td>

                  <td className="p-3 flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" /> 
                    {user.gouvernorat}, {user.ville}
                  </td>

                  <td className="p-3">
                    <Badge className={`px-2 py-1 rounded-full text-xs ${user.actif ? "bg-teal-100 text-teal-500" : "bg-red-100 text-red-700"}`}>
                      {user.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </td>

                  <td className="p-3 text-gray-500 flex items-center gap-1 text-xs">
                    <Calendar className="w-4 h-4" /> 
                    {new Date(user.cree_le).toLocaleDateString("fr-FR")}
                  </td>

                  <td className="p-3 text-center">
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="p-2 rounded-full hover:bg-gray-200">
                        <MoreVertical size={18} />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div className="py-1 text-sm flex flex-col gap-1">
                          {/* Activation/Désactivation */}
                          {hasPermission('users', 'manage') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(user)}
                              className={user.actif ? "text-yellow-600 hover:text-yellow-800" : "text-teal-500 hover:text-teal-600"}
                            >
                              {user.actif ? <UserX size={16} /> : <UserCheck size={16} />} 
                              <span className="ml-2">{user.actif ? "Désactiver" : "Activer"}</span>
                            </Button>
                          )}

                          {/* Suppression */}
                          {hasPermission('users', 'delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(user)}
                              className="text-pink-600 hover:text-pink-800 hover:bg-pink-50"
                            >
                              <Trash2 size={16} />
                              <span className="ml-2">Supprimer</span>
                            </Button>
                          )}

                          {/* Voir profil */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openUserModal(user)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Eye size={16} /> 
                            <span className="ml-2">Voir Profil</span>
                          </Button>
                        </div>
                      </Menu.Items>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- VUE LISTE DE CARTES (Mobile) --- */}
        <div className="grid grid-cols-1 gap-3 md:hidden"> 
          {userList.map((user, i) => (
            <Card key={user.id} className="p-4 border shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                {/* Nom et Email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {user.nom?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.nom}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Bouton d'action (Menu) */}
                <Menu as="div" className="relative inline-block text-left flex-shrink-0 ml-2">
                  <Menu.Button className="p-1 rounded-full hover:bg-gray-200">
                    <MoreVertical size={18} />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1 text-sm flex flex-col gap-1">
                      {/* Activation/Désactivation */}
                      {hasPermission('users', 'manage') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(user)}
                          className={user.actif ? "text-yellow-600 hover:text-yellow-800" : "text-teal-500 hover:text-teal-600"}
                        >
                          {user.actif ? <UserX size={16} /> : <UserCheck size={16} />} 
                          <span className="ml-2">{user.actif ? "Désactiver" : "Activer"}</span>
                        </Button>
                      )}

                      {/* Suppression */}
                      {hasPermission('users', 'delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
                          className="text-pink-600 hover:text-pink-800 hover:bg-pink-50"
                        >
                          <Trash2 size={16} />
                          <span className="ml-2">Supprimer</span>
                        </Button>
                      )}

                      {/* Voir profil */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openUserModal(user)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye size={16} /> 
                        <span className="ml-2">Voir Profil</span>
                      </Button>
                    </div>
                  </Menu.Items>
                </Menu>
              </div>

              {/* Détails en grille */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-t pt-3 mt-3">
                  <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{user.gouvernorat}, {user.ville}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 justify-end">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs text-gray-500 flex-shrink-0">{new Date(user.cree_le).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{user.telephone || "Téléphone : -"}</span>
                  </div>
                  <div className="text-right">
                      <Badge className={`px-2 py-1 rounded-full text-xs ${user.actif ? "bg-teal-100 text-teal-500" : "bg-red-100 text-red-700"}`}>
                          {user.actif ? "Actif" : "Inactif"}
                      </Badge>
                  </div>
              </div>

            </Card>
          ))}
        </div>

        {userList.length === 0 && (
          <div className="text-center py-6 text-gray-500">Aucun utilisateur trouvé</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-400" />
            Gestion des Utilisateurs
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez les comptes utilisateurs {hasPermission('users', 'delete') ? '(avec suppression)' : '(lecture seule)'}
          </p>
        </div>

        {/* CONTROLES DE RECHERCHE ET FILTRE */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-teal-400 w-full sm:w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 w-full sm:w-auto"
          >
            <option value="all">Tous les rôles</option>
            <option value="vendeur">Vendeurs</option>
            <option value="fournisseur">Fournisseurs</option>
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

      {/* Tables */}
      {renderUserTable(vendeurs, "Vendeurs")}
      {renderUserTable(fournisseurs, "Fournisseurs")}

      {/* Modal détail utilisateur - CORRECTION DU SCROLL ICI */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          
          {/* 1. Ajoutez 'flex flex-col' pour permettre aux enfants de prendre de la place */}
          <Dialog.Panel className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col">
            {selectedUser && (
              <>
                {/* Header : Reste fixe en haut */}
                <div className="bg-gradient-to-r from-teal-400 to-teal-400 text-white p-6 sm:p-8 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 border-white/30">
                        {selectedUser.nom?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <Dialog.Title className="text-xl sm:text-2xl font-bold">
                          {selectedUser.nom}
                        </Dialog.Title>
                        <p className="text-teal-100 text-sm sm:text-base mt-1">{selectedUser.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge className="bg-white/20 text-white border-0 capitalize">
                            {selectedUser.role}
                          </Badge>
                          <Badge className={`${selectedUser.actif ? 'bg-teal-500/20 text-teal-100' : 'bg-red-500/20 text-red-100'} border-0`}>
                            {selectedUser.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                {/* 2. Conteneur du contenu : 'overflow-y-auto' pour le défilement et 'flex-grow' pour prendre l'espace restant */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-grow">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Informations de contact */}
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-teal-400" />
                          Informations de contact
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Téléphone</p>
                              <p className="font-medium text-gray-900">
                                {selectedUser.telephone || "Non renseigné"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Mail className="w-5 h-5 text-teal-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium text-gray-900 break-all">
                                {selectedUser.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Informations de localisation */}
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-teal-400" />
                          Localisation
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Globe className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Adresse</p>
                              <p className="font-medium text-gray-900">
                                {selectedUser.adresse || "Non renseignée"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Ville</p>
                              <p className="font-medium text-gray-900">
                                {selectedUser.ville || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Gouvernorat</p>
                              <p className="font-medium text-gray-900">
                                {selectedUser.gouvernorat || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Informations du compte */}
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-teal-400" />
                          Informations du compte
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Rôle</p>
                              <p className="font-medium text-gray-900 capitalize">
                                {selectedUser.role}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Membre depuis</p>
                              <p className="font-medium text-gray-900">
                                {new Date(selectedUser.cree_le).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statut */}
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Statut du compte</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Statut</span>
                            <Badge className={selectedUser.actif ? "bg-teal-100 text-teal-500" : "bg-red-100 text-red-700"}>
                              {selectedUser.actif ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bouton de fermeture à l'intérieur du conteneur scrollable */}
                  <div className="flex justify-end mt-6 sm:mt-8 flex-shrink-0">
                    <Button
                      onClick={() => setIsModalOpen(false)}
                      className="bg-teal-400 hover:bg-teal-700 text-white"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900">
                    Confirmer la suppression
                  </Dialog.Title>
                </div>
              </div>

              {userToDelete && (
                <div className="mb-6">
                  <p className="text-gray-600 mb-2">
                    Êtes-vous sûr de vouloir supprimer l'utilisateur suivant ?
                  </p>
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                    <p className="font-semibold text-pink-800">{userToDelete.nom}</p>
                    <p className="text-pink-600 text-sm">{userToDelete.email}</p>
                    <p className="text-pink-600 text-sm capitalize">{userToDelete.role}</p>
                  </div>
                  <p className="text-gray-500 text-sm mt-2 font-medium">
                    ⚠️ Cette action est irréversible !
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteUser}
                  className="text-pink-600 bg-white border border-pink-600 hover:bg-pink-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};