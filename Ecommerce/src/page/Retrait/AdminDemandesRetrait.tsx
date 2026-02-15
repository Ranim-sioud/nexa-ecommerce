import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../components/api";
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

interface Demande {
  id: number;
  code_retrait: string;
  montant: number;
  statut: "en_attente" | "approuve" | "refuse";
  cree_le: string;
  date_paiement?: string;
  id_user: number;
  nom_utilisateur?: string;
  role?: string;
}

interface Filtres {
  statut: string;
  dateDebut: string;
  dateFin: string;
  search: string;
}

const AdminDemandesRetrait: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtres, setFiltres] = useState<Filtres>({
    statut: "",
    dateDebut: "",
    dateFin: "",
    search: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    approuve: 0,
    refuse: 0,
    montantTotal: 0,
  });
  
  // État pour la pagination
  const [pageCourante, setPageCourante] = useState<number>(1);
  const [elementsParPage, setElementsParPage] = useState<number>(10);

  const fetchDemandes = async () => {
    try {
      const res = await api.get("/retraits/admin/all");
      console.log('res', res);
      const data: Demande[] = res.data.demandes || [];
      setDemandes(data);
      
      // Calcul des statistiques avec conversion sécurisée
      const statsCalcul = {
        total: data.length,
        enAttente: data.filter(d => d.statut === "en_attente").length,
        approuve: data.filter(d => d.statut === "approuve").length,
        refuse: data.filter(d => d.statut === "refuse").length,
        montantTotal: data.reduce((sum, d) => {
          const montant = Number(d.montant);
          return sum + (isNaN(montant) ? 0 : montant);
        }, 0),
      };
      setStats(statsCalcul);
    } catch (err) {
      console.error("Erreur fetch retraits:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger les demandes",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Filtrer les demandes
  const demandesFiltrees = useMemo(() => {
    return demandes.filter(demande => {
      const matchesStatut = !filtres.statut || demande.statut === filtres.statut;
      const matchesSearch = !filtres.search || 
        demande.code_retrait.toLowerCase().includes(filtres.search.toLowerCase()) ||
        demande.nom_utilisateur?.toLowerCase().includes(filtres.search.toLowerCase());
      
      const dateDemande = new Date(demande.cree_le);
      const matchesDateDebut = !filtres.dateDebut || dateDemande >= new Date(filtres.dateDebut);
      const matchesDateFin = !filtres.dateFin || dateDemande <= new Date(filtres.dateFin + 'T23:59:59');
      
      return matchesStatut && matchesSearch && matchesDateDebut && matchesDateFin;
    });
  }, [demandes, filtres]);

  // Calculs de pagination
  const indexDernierElement = pageCourante * elementsParPage;
  const indexPremierElement = indexDernierElement - elementsParPage;
  const demandesCourantes = useMemo(() => {
    return demandesFiltrees.slice(indexPremierElement, indexDernierElement);
  }, [demandesFiltrees, indexPremierElement, indexDernierElement]);

  const nombreTotalPages = Math.ceil(demandesFiltrees.length / elementsParPage);

  // Fonction pour changer de page
  const allerPage = (numeroPage: number) => {
    if (numeroPage < 1 || numeroPage > nombreTotalPages) return;
    setPageCourante(numeroPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setPageCourante(1);
  }, [filtres]);

  const updateStatut = async (id: number, statut: string) => {
    let commentaire: string | null = null;
    
    if (statut === "refuse") {
      const { value: comment } = await Swal.fire({
        title: "Motif du refus",
        input: "textarea",
        inputLabel: "Commentaire (optionnel)",
        inputPlaceholder: "Entrez le motif du refus...",
        showCancelButton: true,
        confirmButtonText: "Continuer",
        cancelButtonText: "Annuler",
      });
      
      if (comment === undefined) return; // Annulé
      commentaire = comment || null;
    }
    
    const confirm = await Swal.fire({
      title: statut === "approuve" ? "Confirmer le paiement ?" : "Refuser cette demande ?",
      text: statut === "approuve" 
        ? "Cette action débitera le solde de l'utilisateur."
        : "Le solde ne sera pas débité.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, continuer",
      cancelButtonText: "Annuler",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.patch(`/retraits/${id}/statut`, { 
        statut, 
        commentaire 
      });
      
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: `Demande ${statut === "approuve" ? "approuvée" : "refusée"} avec succès.`,
        timer: 1800,
        showConfirmButton: false,
      });
      
      fetchDemandes();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err?.response?.data?.error || "Erreur serveur",
        confirmButtonText: "OK",
      });
    }
  };

  const exporterCSV = () => {
    if (demandesFiltrees.length === 0) return;
    
    const lignes = demandesFiltrees.map(d => ({
      Code: d.code_retrait,
      Montant: Number(d.montant || 0).toFixed(2),
      Statut: d.statut,
      "Créé le": new Date(d.cree_le).toLocaleDateString('fr-FR'),
      "Date paiement": d.date_paiement ? new Date(d.date_paiement).toLocaleDateString('fr-FR'): "-",
      "Utilisateur": d.nom_utilisateur || `User #${d.id_user}`,
      "Role": d.role 
    }));
   
    const csvContent = [
      Object.keys(lignes[0]).join(';'),
      ...lignes.map(ligne => Object.values(ligne).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `demandes_retrait_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const StatutBadge = ({ statut }: { statut: Demande['statut'] }) => {
    const config = {
      en_attente: { 
        icon: <Clock size={16} />, 
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        text: "En attente"
      },
      approuve: { 
        icon: <CheckCircle size={16} />, 
        color: "bg-green-100 text-green-800 border-green-300",
        text: "Approuvé"
      },
      refuse: { 
        icon: <XCircle size={16} />, 
        color: "bg-red-100 text-red-800 border-red-300",
        text: "Refusé"
      },
    };
    
    const { icon, color, text } = config[statut];
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${color}`}>
        {icon}
        <span className="font-medium">{text}</span>
      </span>
    );
  };

  // Générer les numéros de page à afficher
  const genererNumerosPages = () => {
    const pages = [];
    const maxPagesAffichees = 5;
    
    if (nombreTotalPages <= maxPagesAffichees) {
      // Afficher toutes les pages
      for (let i = 1; i <= nombreTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Afficher avec ellipsis
      const demiMax = Math.floor(maxPagesAffichees / 2);
      let debut = Math.max(2, pageCourante - demiMax);
      let fin = Math.min(nombreTotalPages - 1, pageCourante + demiMax);
      
      // Ajuster si on est près du début ou de la fin
      if (pageCourante <= demiMax + 1) {
        fin = maxPagesAffichees - 1;
      }
      if (pageCourante >= nombreTotalPages - demiMax) {
        debut = nombreTotalPages - maxPagesAffichees + 2;
      }
      
      pages.push(1);
      if (debut > 2) pages.push('...');
      
      for (let i = debut; i <= fin; i++) {
        pages.push(i);
      }
      
      if (fin < nombreTotalPages - 1) pages.push('...');
      pages.push(nombreTotalPages);
    }
    
    return pages;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Gestion des Demandes de Retrait
          </h1>
          <p className="text-gray-600">
            Gérez les demandes de retrait des utilisateurs
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-gray-500 text-sm">Total demandes</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-yellow-200">
            <p className="text-gray-500 text-sm">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-green-200">
            <p className="text-gray-500 text-sm">Approuvées</p>
            <p className="text-2xl font-bold text-green-600">{stats.approuve}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-red-200">
            <p className="text-gray-500 text-sm">Refusées</p>
            <p className="text-2xl font-bold text-red-600">{stats.refuse}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-blue-200">
            <p className="text-gray-500 text-sm">Montant total</p>
            <p className="text-2xl font-bold text-pink-600">
              {typeof stats.montantTotal === 'number' 
                ? stats.montantTotal.toFixed(2) 
                : '0.00'} TND
            </p>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par code ou utilisateur..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={filtres.search}
                  onChange={(e) => setFiltres({...filtres, search: e.target.value})}
                />
              </div>
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={filtres.statut}
              onChange={(e) => setFiltres({...filtres, statut: e.target.value})}
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvé</option>
              <option value="refuse">Refusé</option>
            </select>
            
            <button
              onClick={exporterCSV}
              disabled={demandesFiltrees.length === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Download size={20} />
              Exporter
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-400" />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                value={filtres.dateDebut}
                onChange={(e) => setFiltres({...filtres, dateDebut: e.target.value})}
              />
              <span className="text-gray-400">à</span>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                value={filtres.dateFin}
                onChange={(e) => setFiltres({...filtres, dateFin: e.target.value})}
              />
            </div>
            
            <div className="flex items-center gap-4">
              {(filtres.statut || filtres.dateDebut || filtres.dateFin || filtres.search) && (
                <button
                  onClick={() => setFiltres({
                    statut: "",
                    dateDebut: "",
                    dateFin: "",
                    search: "",
                  })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
              
              {/* Sélecteur d'éléments par page */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Afficher :</label>
                <select
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  value={elementsParPage}
                  onChange={(e) => {
                    setElementsParPage(Number(e.target.value));
                    setPageCourante(1); // Retour à la première page
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">par page</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des demandes */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <p className="mt-2 text-gray-600">Chargement des demandes...</p>
            </div>
          ) : demandesFiltrees.length === 0 ? (
            <div className="p-8 text-center">
              <Filter size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune demande trouvée</p>
              {demandes.length > 0 && (filtres.statut || filtres.search) && (
                <p className="text-sm text-gray-400 mt-2">
                  Essayez de modifier vos filtres
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Affichage de <span className="font-semibold">{indexPremierElement + 1}</span> à{" "}
                  <span className="font-semibold">
                    {Math.min(indexDernierElement, demandesFiltrees.length)}
                  </span>{" "}
                  sur <span className="font-semibold">{demandesFiltrees.length}</span> demande{demandesFiltrees.length > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-500">
                  Page {pageCourante} sur {nombreTotalPages}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code retrait
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date paiement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {demandesCourantes.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-gray-800">
                            {d.code_retrait}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {d.nom_utilisateur }
                          </div>
                          <div className="text-xs text-gray-500">
                           {d.role}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-800">
                            {Number(d.montant || 0).toFixed(2)} TND
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatutBadge statut={d.statut} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(d.cree_le).toLocaleDateString('fr-FR')}
                          <div className="text-xs text-gray-400">
                            {new Date(d.cree_le).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {d.date_paiement ? (
                            <>
                              {new Date(d.date_paiement).toLocaleDateString('fr-FR')}
                              <div className="text-xs text-gray-400">
                                {new Date(d.date_paiement).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {d.statut === "en_attente" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateStatut(d.id, "approuve")}
                                className="inline-flex items-center gap-1 bg-teal-400 hover:bg-teal-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                              >
                                <CheckCircle size={16} />
                                Approuver
                              </button>
                              <button
                                onClick={() => updateStatut(d.id, "refuse")}
                                className="inline-flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                              >
                                <XCircle size={16} />
                                Refuser
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Détails de la demande',
                                  html: `
                                    <div class="text-left space-y-2">
                                      <p><strong>Code:</strong> ${d.code_retrait}</p>
                                      <p><strong>Montant:</strong> ${Number(d.montant || 0).toFixed(2)} TND</p>
                                      <p><strong>Statut:</strong> ${d.statut}</p>
                                      <p><strong>Créé le:</strong> ${new Date(d.cree_le).toLocaleString('fr-FR')}</p>
                                      ${d.date_paiement ? `<p><strong>Date paiement:</strong> ${new Date(d.date_paiement).toLocaleString('fr-FR')}</p>` : ''}
                                    </div>
                                  `,
                                  icon: 'info',
                                  confirmButtonText: 'Fermer'
                                });
                              }}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Eye size={16} />
                              Voir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {demandesFiltrees.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                {demandesFiltrees.length} résultat{demandesFiltrees.length > 1 ? 's' : ''} trouvé{demandesFiltrees.length > 1 ? 's' : ''}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Bouton première page */}
                <button
                  onClick={() => allerPage(1)}
                  disabled={pageCourante === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Première page"
                >
                  <ChevronsLeft size={18} />
                </button>
                
                {/* Bouton page précédente */}
                <button
                  onClick={() => allerPage(pageCourante - 1)}
                  disabled={pageCourante === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page précédente"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {/* Numéros de page */}
                <div className="flex items-center gap-1">
                  {genererNumerosPages().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => allerPage(Number(page))}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          pageCourante === page
                            ? 'bg-teal-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                
                {/* Bouton page suivante */}
                <button
                  onClick={() => allerPage(pageCourante + 1)}
                  disabled={pageCourante === nombreTotalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page suivante"
                >
                  <ChevronRight size={18} />
                </button>
                
                {/* Bouton dernière page */}
                <button
                  onClick={() => allerPage(nombreTotalPages)}
                  disabled={pageCourante === nombreTotalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Dernière page"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Aller à la page :</span>
                <input
                  type="number"
                  min="1"
                  max={nombreTotalPages}
                  value={pageCourante}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value <= nombreTotalPages) {
                      allerPage(value);
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDemandesRetrait;