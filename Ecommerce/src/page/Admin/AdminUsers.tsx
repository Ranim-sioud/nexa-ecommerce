import { useEffect, useState, Fragment, useLayoutEffect } from "react";
import {
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Users,
  MapPin,
  Calendar,
  Search,
  MoreVertical,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Dialog, Menu } from "@headlessui/react";
import api from "../../components/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Force le re-rendu sur mobile
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // SOLUTION 1: Détection et force le re-rendu au chargement et au redimensionnement
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setWindowWidth(window.innerWidth);
    };
    
    // Vérifier immédiatement
    checkMobile();
    
    // Vérifier au redimensionnement
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // SOLUTION 2: Forcer un reflow au montage du composant
  useLayoutEffect(() => {
    const forceReflow = () => {
      // Forcer un reflow du navigateur
      document.body.style.display = 'none';
      document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
    };
    
    forceReflow();
    
    // Petit délai pour s'assurer que tout est bien chargé
    const timer = setTimeout(() => {
      forceReflow();
      setIsMobile(window.innerWidth < 768);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // SOLUTION 3: Observer les changements de taille d'écran
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleMediaChange = (e) => {
      setIsMobile(e.matches);
      // Forcer un re-rendu
      setWindowWidth(prev => prev + 1);
    };
    
    mediaQuery.addEventListener('change', handleMediaChange);
    handleMediaChange(mediaQuery); // Vérifier au montage
    
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("fetchUsers error:", err);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(
        `/admin/users/${u.id}/status`,
        { actif: !u.actif }
      );
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, actif: !p.actif } : p)));
    } catch (err) {
      console.error("toggleActive error:", err);
    }
  };

  const handlePackDecision = async (userId: string, decision: "approuvee" | "refusee") => {
  try {
    await api.patch(`/admin/traiter/${userId}`, {
      decision,
    });

    // Mise à jour locale
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              vendeur: {
                ...u.vendeur,
                statut_demande_pack: decision,
                pack_cle:
                  decision === "approuvee"
                    ? u.vendeur?.pack_demande
                    : u.vendeur?.pack_cle,
                pack_demande: decision === "approuvee" ? null : u.vendeur?.pack_demande,
              },
            }
          : u
      )
    );
  } catch (err) {
    console.error("handlePackDecision error:", err);
  }
};

  const confirmDeleteUser = (u) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((p) => p.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("deleteUser error:", err);
    }
  };

  const openUserModal = (u) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.ville?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vendeurs = filteredUsers.filter((u) => u.role === "vendeur");
  const fournisseurs = filteredUsers.filter((u) => u.role === "fournisseur");

  // Pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const currentVendeurs = vendeurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentFournisseurs = fournisseurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // map colors
  const statColorMap = {
    indigo: { text: "text-indigo-600", title: "text-indigo-800" },
    teal: { text: "text-teal-500", title: "text-teal-500" },
    cyan: { text: "text-cyan-600", title: "text-cyan-800" },
    purple: { text: "text-purple-600", title: "text-purple-800" },
  };

  const stats = [
    { label: "Total Utilisateurs", value: users.length, color: "indigo" },
    { label: "Actifs", value: users.filter((u) => u.actif).length, color: "teal" },
    { label: "Vendeurs", value: vendeurs.length, color: "cyan" },
    { label: "Fournisseurs", value: fournisseurs.length, color: "purple" },
  ];

  // Version mobile avec affichage conditionnel basé sur l'état isMobile
  const renderMobileUserCard = (u) => (
    <div key={u.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-black text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
            {u.nom?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 text-base truncate">{u.nom}</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{u.email}</p>
            </div>
            <span
              className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                u.actif
                  ? "bg-teal-100 text-teal-600"
                  : "bg-pink-100 text-pink-600"
              }`}
            >
              {u.actif ? "Actif" : "Inactif"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={`px-2 py-1 rounded-full text-xs ${
                u.role === "vendeur"
                  ? "bg-cyan-100 text-cyan-700"
                  : u.role === "fournisseur"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {u.role}
            </Badge>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {u.ville || "-"}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(u.cree_le).toLocaleDateString("fr-FR")}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => openUserModal(u)}
                className="p-2 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                title="Voir profil"
              >
                <Eye className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                onClick={() => toggleActive(u)}
                className={`p-2 rounded-full transition-colors ${
                  u.actif 
                    ? "bg-yellow-50 hover:bg-yellow-100" 
                    : "bg-teal-50 hover:bg-teal-100"
                }`}
                title={u.actif ? "Désactiver" : "Activer"}
              >
                {u.actif ? (
                  <UserX className="w-4 h-4 text-yellow-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-teal-600" />
                )}
              </button>
              <button
                onClick={() => confirmDeleteUser(u)}
                className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4 text-pink-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserSection = (title, userList, currentUsers, color) => (
    <Card className="shadow-xl border border-slate-200 rounded-xl mb-6 overflow-hidden">
      <CardContent className="p-0">
        {/* Header de section */}
        <div className="flex items-center gap-2 p-6 pb-4">
          <Users className={`w-6 h-6 text-${color}-600`} />
          <h3 className={`text-2xl font-bold text-${color}-700`}>{title}</h3>
          <div className="flex-1 border-b border-gray-200 ml-2"></div>
        </div>

        {/* Version Desktop - Tableau */}
        <div className={`${isMobile ? 'hidden' : 'hidden md:block'}`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-gray-700 text-left">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Localisation</th>
                  {title === "Vendeurs" ? (
                    <th className="p-3">Pack</th>
                  ) : (
                    <th className="p-3">Identifiant public</th>
                  )}
                  <th className="p-3">Statut</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b hover:bg-indigo-50 transition cursor-pointer`}
                    onClick={() => openUserModal(u)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-black text-white rounded-full flex items-center justify-center font-bold shrink-0">
                          {u.nom?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 truncate">{u.nom}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`px-2 py-1 rounded-full text-xs ${
                          u.role === "vendeur"
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-600 truncate">
                        <MapPin className="w-4 h-4 shrink-0" /> 
                        {u.gouvernorat}, {u.ville}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-cyan-800 truncate">
                      {title === "Vendeurs" ? (
                        <div className="flex flex-col gap-1">
                          <span>{u.vendeur?.pack_cle || "-"}</span>
                    
                          {u.vendeur?.statut_demande_pack === "en_attente" && (
                            <Badge className="bg-yellow-100 text-yellow-700 w-fit">
                              Demande pack en attente
                            </Badge>
                          )}
                        </div>
                      ) : (
                        u.fournisseur?.identifiant_public || "-"
                      )}
                    </td>
                    <td className="p-3">
                      <Badge className={`px-2 py-1 rounded-full text-xs ${
                        u.actif 
                          ? "bg-teal-100 text-teal-600" 
                          : "bg-pink-100 text-pink-600"
                      }`}>
                        {u.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Calendar className="w-4 h-4 shrink-0" /> 
                        {new Date(u.cree_le).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-2 rounded-full hover:bg-slate-200">
                          <MoreVertical size={18} />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-slate-200 z-10">
                          <div className="py-1 text-sm flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(u)}
                              className={u.actif ? "text-yellow-600 hover:text-yellow-800" : "text-teal-500 hover:text-teal-600"}
                            >
                              {u.actif ? <UserX size={16} /> : <UserCheck size={16} />} 
                              <span className="ml-2">{u.actif ? "Désactiver" : "Activer"}</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openUserModal(u)} className="text-gray-600 hover:text-gray-900">
                              <Eye size={16} /> <span className="ml-2">Voir Profil</span>
                            </Button>
                            {u.role === "vendeur" &&
                              u.vendeur?.statut_demande_pack === "en_attente" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePackDecision(u.id, "approuvee")}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    ✅ Accepter le pack
                                  </Button>
                            
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePackDecision(u.id, "refusee")}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ❌ Refuser le pack
                                  </Button>
                                </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => confirmDeleteUser(u)} className="text-pink-600 hover:text-pink-800">
                              <Trash2 size={16} /> <span className="ml-2">Supprimer</span>
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
        </div>

        {/* Version Mobile - Cartes */}
        <div className={`${isMobile ? 'block' : 'md:hidden'}`}>
          <div className="p-4 space-y-4">
            {userList.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucun {title.toLowerCase()} trouvé
              </div>
            ) : (
              currentUsers.map(renderMobileUserCard)
            )}
          </div>
        </div>

        {/* Pagination */}
        {userList.length > itemsPerPage && (
          <div className="border-t border-slate-200 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Lignes:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <span className="text-sm text-gray-600">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5"
                >
                  ← Précédent
                </Button>
                <span className="text-sm px-3 py-1.5 bg-slate-100 rounded-lg">
                  Page {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5"
                >
                  Suivant →
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen px-4 py-6 flex justify-center">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-7 h-7 md:w-8 md:h-8 text-indigo-500" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Gérez et supervisez tous les comptes de la plateforme
              </p>
            </div>
          </div>

          {/* Version desktop des filtres */}
          <div className={`${isMobile ? 'hidden' : 'hidden md:flex'} flex-col md:flex-row gap-4 items-center`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un utilisateur par nom, email ou ville..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Version mobile des filtres */}
          <div className={`${isMobile ? 'block' : 'md:hidden'} space-y-3`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4 shadow-md border rounded-xl hover:shadow-lg transition">
              <p className={`text-xs md:text-sm font-medium ${statColorMap[s.color].text}`}>
                {s.label}
              </p>
              <h3 className={`text-xl md:text-2xl font-bold ${statColorMap[s.color].title} mt-1`}>
                {s.value}
              </h3>
            </Card>
          ))}
        </div>

        {/* Sections Utilisateurs */}
        {renderUserSection("Vendeurs", vendeurs, currentVendeurs, "cyan")}
        {renderUserSection("Fournisseurs", fournisseurs, currentFournisseurs, "purple")}

        {/* Modal profil utilisateur */}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
          {/* Backdrop flou pour plus de focus */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
        
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
              {selectedUser && (
                <>
                  {/* Header : Plus moderne et moins sombre */}
                  <div className="bg-gradient-to-r from-indigo-500 to-black p-6 text-white">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 text-black backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold border border-black shadow-xl">
                        {selectedUser.nom?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold tracking-tight">
                          {selectedUser.nom}
                        </Dialog.Title>
                        <p className="text-indigo-100/80 font-medium italic">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
        
                  {/* Body : Contenu aéré et structuré */}
                  <div className="p-6 overflow-y-auto bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Groupe Statut & Rôle */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Rôle Utilisateur</label>
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedUser.role === "vendeur" ? "bg-cyan-50 text-cyan-700 border border-cyan-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                          }`}>
                            {selectedUser.role}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">État du compte</label>
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedUser.actif ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {selectedUser.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
        
                      {/* Infos de contact */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Téléphone</label>
                          <p className="text-gray-900 font-semibold">{selectedUser.telephone || "—"}</p>
                        </div>
                        {selectedUser.role === "vendeur" && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Pack Actuel</label>
                            <p className="text-indigo-600 font-bold">{selectedUser.vendeur?.pack_cle || "Standard"}</p>
                          </div>
                        )}
                      </div>
        
                      {/* Demande de Pack (Si existante) */}
                      {selectedUser.vendeur?.statut_demande_pack === "en_attente" && (
                        <div className="col-span-full bg-amber-50 border border-amber-100 p-8 rounded-2xl items-center justify-between">
                          <div>
                            <p className="text-amber-800 text-sm font-bold">Changement de pack demandé</p>
                            <p className="text-amber-700 text-xs font-medium">Cible : {selectedUser.vendeur?.pack_demande}</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => handlePackDecision(selectedUser.id, "approuvee")} className="bg-teal-400 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-teal-500 transition-all shadow-sm">Accepter</button>
                            <button onClick={() => handlePackDecision(selectedUser.id, "refusee")} className="bg-white text-amber-700 border border-pink-500 text-pink-500 text-xs px-4 py-2 rounded-lg font-bold hover:bg-amber-50 transition-all">Refuser</button>
                          </div>
                        </div>
                      )}
        
                      {/* Localisation : Plus lisible */}
                      <div className="col-span-full border-t border-gray-50 pt-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Localisation & Détails</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Adresse</p>
                            <p className="text-sm text-slate-900 font-semibold">{selectedUser.adresse}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Ville / Gouvernorat</p>
                            <p className="text-sm text-slate-900 font-semibold">{selectedUser.ville}, {selectedUser.gouvernorat}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Membre depuis</p>
                            <p className="text-sm text-slate-900 font-semibold">{new Date(selectedUser.cree_le).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
        
                    {/* Actions de pied de page */}
                    <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 text-sm font-bold text-pink-600 border border-pink-600 hover:text-pink-700 transition-colors rounded-lg"
                      >
                        Fermer
                      </button>
                      <Button
                        onClick={() => toggleActive(selectedUser)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all ${
                          selectedUser.actif 
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200" 
                            : "bg-teal-400 hover:bg-teal-500 text-white shadow-emerald-200"
                        }`}
                      >
                        {selectedUser.actif ? "Désactiver le compte" : "Activer le compte"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Modal suppression */}
        <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-xl shadow-2xl p-6 max-w-full sm:max-w-md w-full border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-pink-600" />
                </div>
                <Dialog.Title className="text-lg font-bold mb-2">
                  Confirmer la suppression
                </Dialog.Title>
                <p className="text-gray-600 mb-6">
                  Voulez-vous vraiment supprimer l'utilisateur{' '}
                  <span className="font-semibold text-pink-600">{userToDelete?.nom}</span> ?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={deleteUser}
                    className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}