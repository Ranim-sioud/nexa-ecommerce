import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Package,
    ShoppingBag,
    Plus,
    Search,
    Tag,
    Trash2,
    Home,
    LayoutList,
    RefreshCw,
    Zap,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    User,
} from "lucide-react";
import api from "../../components/api";

// --- Typages (Inchangé) ---
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
    id_externe?: string;
}

interface Categorie {
    id: number;
    nom: string;
}

interface UserDetails {
    nom: string;
}

interface Fournisseur {
    id: number;
    identifiant_public: string;
    id_user: number;
    user?: UserDetails;
}


interface Produit {
    id: number;
    code: string;
    nom: string;
    description?: string;
    prix_gros: number;
    stock: number;
    rupture_stock: boolean;
    medias: Media[];
    variations: Variation[];
    categorie?: Categorie;
    fournisseur?: Fournisseur;
    createdAt?: string;
}

interface MesProduitItem {
    id: number;
    id_vendeur: number;
    id_produit: number;
    Produit: Produit;
    cree_le?: string;
}

interface Filtres {
    search: string;
    categorie: string;
    fournisseur: string;
    sortBy: string;
    etatStock: string;
    couleur: string;
}

// -------------------------------------------------------------

// Composant de carte de produit (Inchangé - omis pour la concision)
const ProductCardMesProduits: React.FC<{ mp: MesProduitItem, retirer: (id: number) => void }> = ({ mp, retirer }) => {
    const produit = mp.Produit;
    if (!produit) return null;

    const isOutOfStock = produit.rupture_stock || (produit.stock === 0);
    const stockStatus = isOutOfStock ? "Hors stock" : "En stock";
    const stockColor = isOutOfStock ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-400";
    
    const imageUrl = produit.medias && produit.medias.length > 0 ?
        produit.medias.find(m => m.principale)?.url || produit.medias[0].url :
        null;

    const handleRetirerClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        retirer(produit.id);
    };
    
    const fournisseurDisplay =  produit.fournisseur?.identifiant_public || `Vendeur ${produit.fournisseur?.id || 'N/A'}`;


    return (
        <div
            className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden
                         hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform flex flex-col relative"
        >
            
            <button
                onClick={handleRetirerClick}
                className="absolute top-2 left-2 z-10 p-2 bg-pink-600 text-white rounded-full
                             shadow-lg hover:bg-pink-700 transition-colors opacity-90"
                title="Retirer de ma liste"
            >
                <Trash2 size={16} />
            </button>
            
            <Link to={`/products/${produit.id}`} className="block h-full flex flex-col">
                
                <div className="relative h-48 mx-2 mt-2 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">

                  {imageUrl ? (
                    (() => {
                      const isVideo = /\.(mp4|webm|ogg)$/i.test(imageUrl);
                
                      return isVideo ? (
                        <video
                          src={imageUrl}
                          className="w-full h-full object-contain"
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={imageUrl}
                          alt={produit.nom}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                
                  <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md ${stockColor}`}
                    >
                      {stockStatus}
                    </span>
                  </div>
                
                </div>
            
                <div className="px-4 py-3 flex flex-col gap-2 flex-grow">
                    
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug
                                 group-hover:text-teal-600 transition-colors flex-grow">
                        {produit.nom}
                    </h3>
                    
                    <div className="text-xs font-medium text-gray-500 flex items-center">
                        <Tag size={14} className="mr-1 text-gray-400" />
                        <span>{produit.categorie?.nom || "Divers"}</span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 pt-1">
                        <div className="flex items-center">
                            <User size={14} className="mr-2 text-gray-400" />
                            <span className="font-medium">Fournisseur :</span>
                            <span className="ml-1 truncate">{fournisseurDisplay}</span>
                        </div>
                        <div className="flex items-center">
                            <Package size={14} className="mr-2 text-gray-400" />
                            <span className="font-medium">Stock total :</span>
                            <span className="ml-1 font-bold text-gray-800">{produit.stock}</span>
                        </div>
                    </div>
            
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div>
                            <span className="text-xl font-bold text-teal-400">
                                {produit.prix_gros ? `${produit.prix_gros} TND` : 'Prix sur demande'}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>    
    );
};
// Composant de carte de produit (Fin)

// Composant de filtre Dropdown (Inchangé)
const FilterDropdown: React.FC<{
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string, label: string }[]
}> = ({ label, value, onChange, options }) => {
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerCaseSearch)
        );
    }, [options, searchTerm]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const currentLabel = options.find(opt => opt.value === value)?.label || label;

    return (
        <div className="relative z-10">
            <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 bg-white rounded-lg
                             hover:border-teal-400 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                    {value ? currentLabel : label}
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                    
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-teal-400 focus:border-teal-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => handleSelect("")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors
                                 ${!value ? 'font-semibold bg-gray-100 text-teal-600' : 'text-gray-700'}`}
                    >
                        {label}
                    </button>

                    {filteredOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors
                                         ${value === opt.value ? 'font-semibold bg-teal-50 text-teal-600' : 'text-gray-700'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    
                    {filteredOptions.length === 0 && searchTerm && (
                        <p className="px-4 py-2 text-sm text-gray-500">Aucun résultat.</p>
                    )}
                </div>
            )}
        </div>
    );
};
// Composant de filtre Dropdown (Fin)


// NOUVEAU Composant de Pagination
interface PaginationProps {
    pageActuelle: number;
    nombrePages: number;
    allerALaPage: (page: number) => void;
}




// -------------------------------------------------------------

export default function MesProduits() {
    const [liste, setListe] = useState<MesProduitItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // CHANGEMENT 1: showFilters est initialisé à FALSE
    const [showFilters, setShowFilters] = useState(false); 
    
    // --- Pagination States ---
    const [pageActuelle, setPageActuelle] = useState(1);
    const produitsParPage = 8;
    // -------------------------
    
    const initialFiltres: Filtres = {
        search: "",
        categorie: "",
        fournisseur: "",
        sortBy: "le_plus_recent",
        etatStock: "tous",
        couleur: "",
    };

    const [filtres, setFiltres] = useState(initialFiltres);

    const handleFilterChange = (key: keyof Filtres, value: string) => {
        setFiltres(prev => ({ ...prev, [key]: value }));
        setPageActuelle(1); // IMPORTANT: Réinitialiser à la première page
    };

    // Fonction de simulation/normalisation des données reçues (Inchangée - omis pour la concision)
    const simulateData = (item: MesProduitItem): MesProduitItem => ({
        ...item,
        Produit: {
            ...item.Produit,
            code: item.Produit.code || 'N/A',
            prix_gros: item.Produit.prix_gros ?? 0,
            stock: item.Produit.stock ?? 0,
            rupture_stock: item.Produit.rupture_stock ?? (item.Produit.stock === 0),
            medias: item.Produit.medias ?? [],
            variations: item.Produit.variations ?? [],
            categorie: item.Produit.categorie || { id: 0, nom: "Divers" },
            fournisseur: item.Produit.fournisseur || { id: item.id_vendeur, identifiant_public: `Vendeur ${item.id_vendeur}`, id_user: 0 },
            createdAt: item.Produit.createdAt || item.cree_le,
        },
    } as MesProduitItem);

    const chargerListe = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<MesProduitItem[]>(`/mesProduits`);
            const processedList = (res.data || [])
                .filter(item => item.Produit)
                .map(simulateData);
            setListe(processedList);
        } catch (err) {
            console.error("Erreur chargement mes produits", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        chargerListe();
    }, [chargerListe]);

    const retirer = async (id_produit: number) => {
        if (!window.confirm("Voulez-vous retirer ce produit de votre liste ?")) return;
        try {
            await api.delete(`/mesProduits/${id_produit}`);
            setListe(prev => prev.filter(item => item.Produit.id !== id_produit));
        } catch (err) {
            console.error("Erreur retrait produit", err);
            alert("Impossible de retirer le produit.");
        }
    };

    const { categoriesUniques, fournisseursUniques, couleursUniques } = useMemo(() => {
        const catMap = new Map<number, Categorie>();
        const vendMap = new Map<number, Fournisseur>();
        const couleurSet = new Set<string>();

        liste.forEach(item => {
            const p = item.Produit;
            
            if (p.categorie && p.categorie.id !== 0) {
                catMap.set(p.categorie.id, p.categorie);
            }
            
            if (p.fournisseur) {
                const displayId = p.fournisseur.identifiant_public || p.fournisseur.user?.nom || `Vendeur ${p.fournisseur.id}`;
                vendMap.set(p.fournisseur.id, { ...p.fournisseur, identifiant_public: displayId });
            }

            p.variations.forEach(v => {
                if (v.couleur && v.couleur.trim() !== '') {
                    const normalizedColor = v.couleur.charAt(0).toUpperCase() + v.couleur.slice(1).toLowerCase();
                    couleurSet.add(normalizedColor);
                }
            });
        });

        return {
            categoriesUniques: Array.from(catMap.values()),
            fournisseursUniques: Array.from(vendMap.values()),
            couleursUniques: Array.from(couleurSet).sort((a, b) => a.localeCompare(b)),
        };
    }, [liste]);


    // Fonction de filtrage et de tri des produits (Inchangée - omis pour la concision)
    const listeFiltree = useMemo(() => {
        let result = [...liste];
        const { search, categorie, fournisseur, sortBy, etatStock, couleur } = filtres;
        
        const searchLower = search.toLowerCase();
        
        result = result.filter((item) => {
            const p = item.Produit;
            const itemPassesSearch = (
                p.nom.toLowerCase().includes(searchLower) ||
                p.code.toLowerCase().includes(searchLower)
            );

            const itemPassesCategorie = !categorie || p.categorie?.id.toString() === categorie;
            const itemPassesFournisseur = !fournisseur || p.fournisseur?.id.toString() === fournisseur;
            
            const itemPassesStock =
                etatStock === "tous" ||
                (etatStock === "enStock" && !p.rupture_stock && p.stock > 0) ||
                (etatStock === "horsStock" && (p.rupture_stock || p.stock === 0));

            const itemPassesCouleur = !couleur ||
                p.variations.some(v =>
                    v.couleur.toLowerCase() === couleur.toLowerCase()
                );


            return itemPassesSearch && itemPassesCategorie && itemPassesFournisseur && itemPassesStock && itemPassesCouleur;
        });


        // 5. Tri
        switch (sortBy) {
            case "nom":
                result.sort((a, b) => a.Produit.nom.localeCompare(b.Produit.nom));
                break;
            case "prix_croissant":
                result.sort((a, b) => a.Produit.prix_gros - b.Produit.prix_gros);
                break;
            case "prix_decroissant":
                result.sort((a, b) => b.Produit.prix_gros - a.Produit.prix_gros);
                break;
            case "stock_croissant":
                result.sort((a, b) => a.Produit.stock - b.Produit.stock);
                break;
            case "stock_decroissant":
                result.sort((a, b) => b.Produit.stock - a.Produit.stock);
                break;
            case "le_plus_ancien":
                result.sort(
                    (a, b) =>
                        new Date(a.Produit.createdAt || 0).getTime() -
                        new Date(b.Produit.createdAt || 0).getTime()
                );
                break;
            case "le_plus_recent":
            default:
                result.sort(
                    (a, b) =>
                        new Date(b.Produit.createdAt || 0).getTime() -
                        new Date(a.Produit.createdAt || 0).getTime()
                );
                break;
        }

        return result;
    }, [liste, filtres]);

    // CHANGEMENT 1: Logique mise à jour pour le bouton "Filtrer" / "Réinitialiser"
    const toggleFilters = () => {
        if (showFilters) {
            // Si les filtres sont affichés, on clique sur "Réinitialiser les filtres"
            setFiltres(initialFiltres);
            setPageActuelle(1); // Réinitialiser la pagination
        }
        // Afficher/masquer les filtres (seul l'état de 'showFilters' change si on clique sur 'Filtrer' pour la première fois)
        setShowFilters(prev => !prev);
    };
    
    // --- Logique de Pagination ---
    const indexDernierProduit = pageActuelle * produitsParPage;
    const indexPremierProduit = indexDernierProduit - produitsParPage;
    
    const produitsActuels = listeFiltree.slice(indexPremierProduit, indexDernierProduit);
    
    const nombrePages = Math.ceil(listeFiltree.length / produitsParPage);

    const allerALaPage = (page: number) => {
        if (page >= 1 && page <= nombrePages) {
            setPageActuelle(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    // ----------------------------


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-pulse text-lg text-gray-600">
                    Chargement de votre liste de produits...
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg text-white">
                  <ShoppingBag className="w-8 h-8 mr-2 text-gray-700" />
                </div>
                Mes Produits
              </h1>
            </div>
            {/* Fin de la MODIFICATION 1 */}

            {/* Début de la MODIFICATION 2 : Boîte d'information comme dans 'Mes Produits' */}
            <div className="bg-white rounded-lg p-4 mb-8 border border-gray-200 shadow-sm">
                <div className="flex items-start">
                    <div className="p-2 mr-3 bg-teal-100 rounded-full">
                        <Package className="w-5 h-5 text-teal-400" />
                    </div>
                    <p className="text-sm text-gray-700">
                        Ici, vous trouverez tous les produits qui vous intéressent ou que vous vendez actuellement. Ajoutez des produits à votre liste pour créer des commandes. Vous recevrez des notifications en temps réel sur les mises à jour de stock pour chaque produit. Pour ajouter des produits, visitez la <Link to="/marketplace" className="text-teal-400 font-medium hover:text-teal-700 underline">Marketplace</Link>.
                    </p>
                </div>
            </div>
            
            {/* Barre filtres AVANCÉE */}
            <div className="bg-white shadow-md rounded-2xl p-6 mb-8 border border-gray-100">
                
                {/* Ligne 1: Barre de recherche + Bouton Filtrer/Réinitialiser */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-shadow"
                            value={filtres.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    {/* CHANGEMENT 1: Logique du bouton "Filtrer" / "Réinitialiser les filtres" */}
                    <button
                        onClick={toggleFilters}
                        className={`flex items-center font-semibold gap-2 px-4 py-2 rounded-lg transition-colors flex-shrink-0 w-full md:w-auto justify-center
                                 ${showFilters
                                     ? 'border-2 bg-pink-600 text-white hover:bg-pink-700' // 'Réinitialiser' : couleur inversee
                                     : 'border-2 border-pink-600 text-pink-600 hover:bg-pink-50' // 'Filtrer' : couleur de base
                                 }`
                        }
                    >
                        {showFilters ? (
                            <>
                                <RefreshCw className="w-4 h-4" /> Réinitialiser les filtres
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" /> Filtrer
                                <ChevronDown className="w-4 h-4 ml-1 transition-transform" />
                            </>
                        )}
                    </button>
                    {/* Fin du Changement 1 */}
                    
                    <Link
                        to="/marketplace"
                        className="flex items-center font-semibold gap-2 px-4 py-2 rounded-lg transition-colors bg-teal-400 text-white hover:bg-teal-500 shadow-md flex-shrink-0 w-full md:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" /> Ajouter
                    </Link>
                </div>

                {/* Ligne 2: Sélecteurs de filtres */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 transition-all duration-300 ease-in-out">
                        
                        {/* 1. Catégories */}
                        <FilterDropdown
                            label={`Catégories (${categoriesUniques.length})`}
                            value={filtres.categorie}
                            onChange={(val) => handleFilterChange('categorie', val)}
                            options={categoriesUniques.map(cat => ({ value: cat.id.toString(), label: cat.nom }))}
                        />

                        {/* 2. Fournisseurs */}
                        <FilterDropdown
                            label={`Fournisseurs (${fournisseursUniques.length})`}
                            value={filtres.fournisseur}
                            onChange={(val) => handleFilterChange('fournisseur', val)}
                            options={fournisseursUniques.map(f => ({ value: f.id.toString(), label: f.identifiant_public }))}
                        />

                        {/* 3. Couleur */}
                        <FilterDropdown
                            label={`Couleur (${couleursUniques.length})`}
                            value={filtres.couleur}
                            onChange={(val) => handleFilterChange('couleur', val)}
                            options={couleursUniques.map(c => ({ value: c, label: c }))}
                        />
                        
                        {/* 4. État de Stock */}
                        <FilterDropdown
                            label="État du Stock"
                            value={filtres.etatStock}
                            onChange={(val) => handleFilterChange('etatStock', val)}
                            options={[
                                { value: "enStock", label: "En Stock" },
                                { value: "horsStock", label: "Hors Stock" },
                            ]}
                        />

                        {/* 5. Tri par... */}
                        <FilterDropdown
                            label="Trier par..."
                            value={filtres.sortBy}
                            onChange={(val) => handleFilterChange('sortBy', val)}
                            options={[
                                { value: "le_plus_recent", label: "Date (le plus récent)" },
                                { value: "le_plus_ancien", label: "Date (le plus ancien)" },
                                { value: "nom", label: "Nom (A-Z)" },
                                { value: "prix_croissant", label: "Prix (croissant)" },
                                { value: "prix_decroissant", label: "Prix (décroissant)" },
                                { value: "stock_croissant", label: "Stock (faible d'abord)" },
                                { value: "stock_decroissant", label: "Stock (élevé d'abord)" },
                            ]}
                        />
                    </div>
                )}
            </div>

            {/* Affichage du résultat */}
            <p className="text-gray-600 mb-6 font-medium">
                {listeFiltree.length} produit{listeFiltree.length > 1 ? 's' : ''} affiché{listeFiltree.length > 1 ? 's' : ''} sur {liste.length} dans votre liste.
            </p>

            {/* Liste des produits (pagination appliquée) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                {produitsActuels.map((mp) => (
                    <ProductCardMesProduits
                        key={mp.id}
                        mp={mp}
                        retirer={retirer}
                    />
                ))}
            </div>

            {produitsActuels.length === 0 && listeFiltree.length > 0 && (
                <div className="text-center py-12 text-gray-500 text-lg">
                    Aucun produit sur cette page.
                </div>
            )}
            
            {liste.length === 0 && (
                <div className="text-center py-20 text-gray-500 text-xl bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                    <p className="font-semibold mb-3">Votre liste est vide.</p>
                    <p className="text-base">Veuillez ajouter des produits depuis la <Link to="/marketplace" className="text-teal-400 hover:text-teal-600 font-bold">Marketplace</Link>.</p>
                </div>
            )}
            
            {/* Composant de Pagination */}
            {nombrePages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                    <button
                        onClick={() => allerALaPage(pageActuelle - 1)}
                        disabled={pageActuelle === 1}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} className="mr-1" /> Précédent
                    </button>
                    
                    <span className="text-gray-700 font-medium">
                        Page {pageActuelle} sur {nombrePages}
                    </span>
                    
                    <button
                        onClick={() => allerALaPage(pageActuelle + 1)}
                        disabled={pageActuelle === nombrePages}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Suivant <ChevronRight size={16} className="ml-1" />
                    </button>
                </div>
            )}
            
        </div>
    );
}