import { useState, useEffect, useMemo } from "react"; 
import { Link } from "react-router-dom";
// Ajout des icônes utilisées dans les composants
import { Plus, Package, RefreshCw, Search, Tags, User, ListOrdered, Zap, ShoppingBag, Home, LayoutList, ChevronDown, Filter } from "lucide-react"; 
import api from "../../components/api";

// --- Typages ---
interface User {
    id: number;
    nom: string;
    email: string;
    ville: string;
    gouvernorat: string;
}

interface Fournisseur {
    id: number;
    id_user: number;
    identifiant_public: string;
    solde_portefeuille: number;
    user: User;
}

interface Categorie {
    id: number;
    nom: string;
}

interface Media {
    id: number;
    type: string;
    url: string;
    principale: boolean;
}

interface Variation {
    id: number;
    couleur: string;
    taille: string;
    prix_gros: number;
    stock: number;
}

interface Produit {
    id: number;
    code: string;
    nom: string;
    description: string;
    livraison: string;
    prix_gros: number;
    stock: number;
    rupture_stock: boolean;
    id_fournisseur: number;
    id_categorie: number;
    createdAt: string;
    updatedAt: string;
    medias: Media[];
    variations: Variation[];
    categorie: Categorie;
    fournisseur: Fournisseur;
    enVedette?: boolean; 
}

interface ProductCardProps {
    produit: Produit;
    mesProduitsIds: number[];
    setMesProduitsIds: React.Dispatch<React.SetStateAction<number[]>>;
    onRefresh: () => Promise<void>;
}
// ---------------------------------

// Composant de carte de produit - Version responsive
const ProductCard = ({ produit, mesProduitsIds, setMesProduitsIds, onRefresh }: ProductCardProps) => {
  const [dansMesProduits, setDansMesProduits] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ On se base uniquement sur le tableau mesProduitsIds
  useEffect(() => {
    setDansMesProduits(mesProduitsIds.includes(produit.id));
  }, [mesProduitsIds, produit.id]);

  const toggleMesProduits = async () => {
    if (loading) return; // Empêcher les clics multiples
    
    setLoading(true);
    try {
      if (dansMesProduits) {
        await api.delete(`/mesProduits/${produit.id}`);
        setMesProduitsIds(prev => prev.filter(id => id !== produit.id));
      } else {
        await api.post(`/mesProduits/${produit.id}`);
        setMesProduitsIds(prev => [...prev, produit.id]);
      }
      console.log("charger mes produits ::", onRefresh);
      // ✅ Recharger la liste depuis le serveur
      await onRefresh();
    } catch (error) {
      console.error("Erreur ajout/suppression Mes Produits:", error);
    } finally {
      setLoading(false);
    }
  };

  const stockStatus = produit.rupture_stock ? "Hors stock" : "En stock";
  const stockColor = produit.rupture_stock ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-400";

  return (
    <div className="group bg-white rounded-xl shadow-sm md:shadow-md border border-gray-200 overflow-hidden hover:shadow-lg md:hover:shadow-xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 transform flex flex-col h-full">
      <Link to={`/products/${produit.id}`} className="block h-full flex flex-col">

       <div className="relative h-40 sm:h-48 mx-2 mt-2 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
      
         {produit.medias && produit.medias.length > 0 ? (
           (() => {
             const media = produit.medias[0];
             const url = media.url;
             const isVideo = /\.(mp4|webm|ogg)$/i.test(media.url);
      
             return isVideo ? (
               <video
                 src={url}
                 className="w-full h-full object-contain"
                 autoPlay
                 muted
                 loop
               />
             ) : (
               <img
                 src={url}
                 alt={produit.nom}
                 className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
               />
             );
           })()
         ) : (
           <div className="w-full h-full flex items-center justify-center">
             <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
           </div>
         )}
      
          <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
            <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold shadow-sm ${stockColor}`}>
              {stockStatus}
            </span>
          </div>
      
        </div>


        {/* Contenu */}
        <div className="px-3 sm:px-4 py-3 flex flex-col gap-2 sm:gap-3 flex-grow">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors flex-grow">
            {produit.nom}
          </h3>
          <div className="text-xs font-medium text-gray-500 flex items-center">
            <Tags size={12} className="mr-1 text-gray-400" />
            <span className="truncate">{produit.categorie?.nom}</span>
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-gray-600 pt-1">
            <div className="flex items-center">
              <User size={12} className="mr-1 sm:mr-2 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm">Fourn.:</span>
              <span className="ml-1 truncate text-xs">{produit.fournisseur?.identifiant_public}</span>
            </div>
            <div className="flex items-center">
              <ListOrdered size={12} className="mr-1 sm:mr-2 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm">Code:</span>
              <span className="ml-1 font-mono text-xs">{produit.code}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <div>
              <span className="text-base sm:text-lg font-bold text-gray-900">{produit.prix_gros} TND</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleMesProduits();
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-transform hover:scale-105
                ${dansMesProduits ? "border border-pink-600 bg-white text-pink-600" : "bg-teal-400 hover:bg-teal-600 text-white"}`}
            >
              {dansMesProduits ? "Retirer" : "+ Ajouter"}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

// -------------------------------------------------------------

const PaginateButton = ({ page, isCurrent, onClick }: { page: number, isCurrent: boolean, onClick: (page: number) => void }) => (
    <button
        onClick={() => onClick(page)}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base
            ${isCurrent 
                ? 'border border-gray-500 text-gray-500 shadow-md ' 
                : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-100'
            }`}
    >
        {page}
    </button>
);

// Composant pour les sélecteurs de filtre - Version responsive
const FilterSelect = ({ label, value, onChange, options }: { label: string, value: string, onChange: (value: string) => void, options: { value: string, label: string }[] }) => (
    <div className="relative">
        <select
            className="appearance-none w-full px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 bg-white rounded-lg 
                       focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-8 transition-shadow text-sm sm:text-base"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">{label}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
        <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
    </div>
);


// -------------------------------------------------------------
// Composant principal Products - Version responsive
// -------------------------------------------------------------
export default function Products() {
    const [produits, setProduits] = useState<Produit[]>([]);
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [loading, setLoading] = useState(true);
    const [mesProduitsIds, setMesProduitsIds] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const productsPerPage = 10;
    
    // État pour gérer l'affichage des filtres
    const [showFilters, setShowFilters] = useState(false);

    // Valeurs initiales des filtres
    const initialFiltres = {
        search: "",
        categorie: "",
        fournisseur: "",
        sortBy: "le_plus_recent", 
        enVedette: "tous", 
        etatStock: "tous", 
        couleur: "", 
    };

    const [filtres, setFiltres] = useState(initialFiltres);
    const chargerCategories = async () => {
        try {
            const res = await api.get(`/categories`);
            setCategories(res.data || []);
        } catch (error) {
            console.error("Erreur chargement catégories:", error);
        }
    };

    const chargerDonnees = async () => {
      try {
        const res = await api.get(
          `/produits/all-vendeurs?page=${currentPage}&limit=${productsPerPage}`
        )    ;
        console.log('res.data::', res)
        setProduits(res.data.produits || []);  // ✅ c'est "produits" et pas "rows"
        setTotalPages(res.data.pagination.totalPages); // ✅ pagination.totalPages
        setLoading(false); // nombre total de pages
      } catch (error) {
        console.error("Erreur chargement données:", error);
      }
    };

    useEffect(() => {
        chargerDonnees();
        chargerCategories();
    }, [currentPage]);
    
    // Fonction unique pour gérer l'affichage/réinitialisation des filtres
    const toggleFilters = () => {
        if (!showFilters) {
            // Passer au mode 'Afficher les filtres'
            setShowFilters(true);
        } else {
            // Passer au mode 'Masquer les filtres' et réinitialiser
            setFiltres(initialFiltres);
            setShowFilters(false);
        }
    };

    const chargerMesProduits = async () => {
        try {
            const res = await api.get(`/mesProduits`);
            // Récupérer uniquement les IDs des produits
            const ids = res.data.map((p: any) => p.id);
            setMesProduitsIds(ids);
        } catch (error) {
            console.error("Erreur chargement Mes Produits :", error);
        }
    };    

    useEffect(() => {
        chargerMesProduits();
    }, [currentPage]);

    // -------------------------------------------------------------
    // LOGIQUE DE FILTRAGE & TRI (Utilisation de useMemo pour la correction)
    // -------------------------------------------------------------
    const produitsFiltres = useMemo(() => {
        let result = [...produits];
        const { search, categorie, fournisseur, sortBy, enVedette, etatStock, couleur } = filtres;

        // Filtrage par recherche
        if (search) {
            result = result.filter((p) =>
                p.nom.toLowerCase().includes(search.toLowerCase()) || 
                p.code.toLowerCase().includes(search.toLowerCase()) // Ajout de la recherche par code
            );
        }
        // Filtrage par catégorie
        if (categorie) {
            result = result.filter(
                (p) => p.id_categorie === parseInt(categorie)
            );
        }
        // Filtrage par fournisseur
        if (fournisseur) {
            result = result.filter(
                (p) => p.fournisseur.id === parseInt(fournisseur)
            );
        }
        // Filtrage par "Produits en vedette"
        if (enVedette === "oui") {
            result = result.filter((p) => p.enVedette);
        } else if (enVedette === "non") {
            result = result.filter((p) => !p.enVedette);
        }

        // Filtrage par "État de Stock"
        if (etatStock === "enStock") {
            result = result.filter((p) => !p.rupture_stock);
        } else if (etatStock === "horsStock") {
            result = result.filter((p) => p.rupture_stock);
        }

        // Filtrage par "Couleur" (basé sur les variations)
        if (couleur) {
            result = result.filter((p) => 
                p.variations.some(v => v.couleur.toLowerCase() === couleur.toLowerCase())
            );
        }

        // Tri
        switch (sortBy) {
            case "nom":
                result.sort((a, b) => a.nom.localeCompare(b.nom));
                break;
            case "prix_croissant":
                result.sort((a, b) => a.prix_gros - b.prix_gros);
                break;
            case "prix_decroissant":
                result.sort((a, b) => b.prix_gros - a.prix_gros);
                break;
            case "stock_croissant": 
                result.sort((a, b) => a.stock - b.stock); 
                break;
            case "stock_decroissant": 
                result.sort((a, b) => b.stock - a.stock); 
                break;
            case "le_plus_ancien": 
                result.sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                );
                break;
            case "le_plus_recent": 
            default: 
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
                break;
        }
        return result;
    }, [produits, filtres]); // Dépendances: Recalculer si `produits` ou `filtres` changent

    // Calcul des fournisseurs uniques (également avec useMemo pour l'optimisation)
    const fournisseursUniques = useMemo(() => {
        return produits
            .map((p) => p.fournisseur)
            .filter((f): f is Fournisseur => !!f)
            .filter((f, i, self) => self.findIndex((x) => x.id === f.id) === i);
    }, [produits]);

    // Calcul des couleurs uniques (également avec useMemo pour l'optimisation)
    const couleursUniques = useMemo(() => {
        return Array.from(
            new Set(
                produits.flatMap(p => p.variations.map(v => v.couleur))
                        .filter(c => c && c.trim() !== '') 
                        .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()) 
            )
        ).sort((a, b) => a.localeCompare(b));
    }, [produits]);

    // -------------------------------------------------------------
    // Rendu du composant
    // -------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-pulse text-lg text-gray-600">
                    Chargement des produits...
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            
            {/* BARRE DE TITRE - Version responsive */}
            <nav className="bg-teal-400 shadow-md md:shadow-lg text-white rounded-lg md:rounded mb-6 md:mb-8">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between md:justify-start">
                    
                    <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                        <span className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight">Marketplace</span>
                    </div>

                    {/* Bouton menu mobile pour les filtres */}
                    <button
                        onClick={toggleFilters}
                        className="md:hidden flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filtres</span>
                    </button>

                    {/* Navigation desktop */}
                    <div className="hidden md:flex items-center space-x-4 md:space-x-6 text-sm font-medium ml-4">
                        <Link to="#" className="flex items-center hover:bg-teal-600 px-3 py-1.5 rounded transition-colors">
                            <Home className="w-4 h-4 mr-1"/> Tous les produits
                        </Link>
                        <Link to="#" className="flex items-center hover:bg-teal-600 px-3 py-1.5 rounded transition-colors">
                            <LayoutList className="w-4 h-4 mr-1"/> Produits en vedette
                        </Link>
                    </div>

                </div>
            </nav>
            
            {/* BARRE DE FILTRES - Version responsive */}
            <div className="bg-white shadow-sm md:shadow-md rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100">
                
                {/* Ligne 1: Barre de recherche + Bouton Filtrer/Réinitialiser */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            value={filtres.search}
                            onChange={(e) =>
                                setFiltres({ ...filtres, search: e.target.value })
                            }
                        />
                    </div>
                    
                    {/* Bouton Dynamique */}
                    <button
                        onClick={toggleFilters}
                        className={`hidden sm:flex items-center font-semibold gap-2 px-4 py-2 rounded-lg transition-colors flex-shrink-0
                                     ${showFilters 
                                        ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-md' // Style Réinitialiser
                                        : 'border-2 border-pink-600 text-pink-600 hover:bg-pink-50' // Style Filtrer
                                     }`}
                    >
                        {showFilters ? (
                            <>
                                <RefreshCw className="w-4 h-4" /> Réinitialiser
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" /> Filtrer
                            </>
                        )}
                    </button>
                </div>

                {/* Ligne 2: Sélecteurs de filtres (Affichage conditionnel) */}
                {(showFilters || window.innerWidth >= 768) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 transition-all duration-300 ease-in-out">
                        
                        {/* 1. Catégories */}
                        <FilterSelect
                            label="Catégories"
                            value={filtres.categorie}
                            onChange={(val) => setFiltres({ ...filtres, categorie: val })}
                            options={categories.map(cat => ({ value: cat.id.toString(), label: cat.nom }))}
                        />

                        {/* 2. Fournisseurs */}
                        <FilterSelect
                            label="Fournisseurs"
                            value={filtres.fournisseur}
                            onChange={(val) => setFiltres({ ...filtres, fournisseur: val })}
                            options={fournisseursUniques.map(f => ({ value: f.id.toString(), label: f.identifiant_public }))}
                        />

                        {/* 3. Tri par... */}
                        <FilterSelect
                            label="Trier par"
                            value={filtres.sortBy}
                            onChange={(val) => setFiltres({ ...filtres, sortBy: val })}
                            options={[
                                { value: "le_plus_recent", label: "Date : Le plus récent" },
                                { value: "le_plus_ancien", label: "Date : Le plus ancien" },
                                { value: "prix_croissant", label: "Prix : croissant" },
                                { value: "prix_decroissant", label: "Prix : décroissant" },
                                { value: "stock_croissant", label: "Stock : croissant" },
                                { value: "stock_decroissant", label: "Stock : décroissant" },
                                { value: "nom", label: "Nom : A-Z" },
                            ]}
                        />

                        {/* 4. Produits en vedette */}
                        <FilterSelect
                            label="En Vedette"
                            value={filtres.enVedette}
                            onChange={(val) => setFiltres({ ...filtres, enVedette: val })}
                            options={[
                                { value: "oui", label: "Oui" },
                                { value: "non", label: "Non" },
                            ]}
                        />

                        {/* 5. État de Stock */}
                        <FilterSelect
                            label="État de Stock"
                            value={filtres.etatStock}
                            onChange={(val) => setFiltres({ ...filtres, etatStock: val })}
                            options={[
                                { value: "enStock", label: "En Stock" },
                                { value: "horsStock", label: "Hors Stock" },
                            ]}
                        />

                        {/* 6. Couleurs */}
                        <FilterSelect
                            label="Couleurs"
                            value={filtres.couleur}
                            onChange={(val) => setFiltres({ ...filtres, couleur: val })}
                            options={couleursUniques.map(c => ({ value: c.toLowerCase(), label: c }))}
                        />
                    </div>
                ) : null}
                
                {/* Bouton mobile pour réinitialiser quand les filtres sont ouverts */}
                {showFilters && (
                    <div className="sm:hidden mt-4">
                        <button
                            onClick={toggleFilters}
                            className="w-full flex items-center justify-center gap-2 bg-pink-600 text-white font-semibold py-2.5 rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Réinitialiser et Fermer
                        </button>
                    </div>
                )}
            </div>

            {/* LISTE PRODUITS - Version responsive */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {produitsFiltres.map((produit) => (
                    <ProductCard key={produit.id} produit={produit} mesProduitsIds={mesProduitsIds} setMesProduitsIds={setMesProduitsIds} onRefresh={chargerMesProduits} />
                ))}
            </div>

            {produitsFiltres.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-500 text-base sm:text-lg">
                    Aucun produit trouvé 😕
                </div>
            )}

            {/* PAGINATION - Version responsive */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-2 mt-6 sm:mt-8">
                {/* Précédent */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-100 text-gray-600 border border-gray-300 
                             hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm sm:text-base"
                >
                  Précédent
                </button>
            
                {/* Pages - Limitée sur mobile */}
                {(() => {
                    const pages = [];
                    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
                    
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    // Ajouter "..." au début si nécessaire
                    if (startPage > 1) {
                        pages.push(
                            <span key="dots-start" className="px-2 text-gray-400">...</span>
                        );
                    }
                    
                    // Ajouter les pages
                    for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                            <PaginateButton
                                key={i}
                                page={i}
                                isCurrent={i === currentPage}
                                onClick={setCurrentPage}
                            />
                        );
                    }
                    
                    // Ajouter "..." à la fin si nécessaire
                    if (endPage < totalPages) {
                        pages.push(
                            <span key="dots-end" className="px-2 text-gray-400">...</span>
                        );
                    }
                    
                    return pages;
                })()}
            
                {/* Suivant */}
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-100 text-gray-600 border border-gray-300 
                             hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm sm:text-base"
                >
                  Suivant
                </button>
                
                {/* Info de page mobile */}
                <div className="w-full sm:hidden text-center text-sm text-gray-500 mt-2">
                    Page {currentPage} sur {totalPages}
                </div>
              </div>
            )}
        </div>
    );
}