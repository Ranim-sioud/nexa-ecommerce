import { useEffect, useState } from "react";
import { Pencil, SquarePlus, Trash2, Search, X, Boxes, ChevronsRight, ChevronRight, ChevronLeft, ChevronsLeft } from "lucide-react";
import { Produit, Categorie } from "./AddProduct";
import  AddProduct from "./AddProduct";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import api from "../../components/api";

const getCouleurStyle = (couleurNom) => {
  const couleursMap = {
    "Rouge": "#ff0000",
    "Bleu": "#0000ff", 
    "Vert": "#00ff00",
    "Noir": "#000000",
    "Blanc": "#ffffff",
    "Gris": "#808080",
    "Rose": "#ffc0cb",
    "Jaune": "#ffff00",
    "Orange": "#ffa500",
    "Violet": "#800080",
    "Marron": "#a52a2a",
    "Beige": "#f5f5dc",
    "Or": "#ffd700",
    "Argent": "#c0c0c0",
    "Turquoise": "#40e0d0",
    "Cyan": "#00ffff",
    "Magenta": "#ff00ff",
    "Bordeaux": "#800000",
    "Bleu ciel": "#87ceeb",
    "Bleu marine": "#000080",
    "Bleu roi": "#1e00ff",
    "Bleu clair": "#add8e6",
    "Bleu foncé": "#00008b",
    "Vert clair": "#90ee90",
    "Vert foncé": "#006400",
    "Vert olive": "#808000",
    "Vert kaki": "#78866b",
    "Vert menthe": "#98ff98",
    "Vert fluo": "#39ff14",
    "Jaune clair": "#ffffe0",
    "Jaune foncé": "#ffcc00",
    "Jaune fluo": "#ccff00",
    "Orange clair": "#ffb84d",
    "Orange foncé": "#ff8c00",
    "Rose clair": "#ffb6c1",
    "Rose foncé": "#ff1493",
    "Fuchsia": "#ff00ff",
    "Saumon": "#fa8072",
    "Corail": "#ff7f50",
    "Lavande": "#e6e6fa",
    "Lilac": "#c8a2c8",
    "Mauve": "#e0b0ff",
    "Chocolat": "#d2691e",
    "Café": "#4b371c",
    "Camel": "#c19a6b",
    "Ivoire": "#fffff0",
    "Crème": "#fffdd0",
    "Écru": "#f5f5dc",
    "Anthracite": "#383e42",
    "Ardoise": "#708090",
    "Charbon": "#242124",
    "Taupe": "#483c32",
    "Sable": "#f6d7b0",
    "Cuivre": "#b87333",
    "Bronze": "#cd7f32"
  };

  return couleursMap[couleurNom] || "#cccccc";
};

export default function ProductList() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProduits, setFilteredProduits] = useState<Produit[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [produitToDelete, setProduitToDelete] = useState<Produit | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileTableOpen, setIsMobileTableOpen] = useState(false);

  const fetchProduits = () => {
    setLoading(true);
    api
      .get(`/produits`)
      .then((res) => {
        console.log("PRODUITS", res.data); 
        setProduits(res.data || []);
        setFilteredProduits(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement produits :", err);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    api
      .get(`/categories`)
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error("Erreur chargement catégories :", err));
  };

  useEffect(() => {
    fetchProduits();
    fetchCategories();
  }, []);

  const handleProduitUpdated = () => {
    setEditingProduit(null);
    setAdding(false);
    fetchProduits();
  };

  const openDeleteConfirm = (produit: Produit) => {
    setProduitToDelete(produit);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!produitToDelete) return;
    try {
      console.log("SUPPRESSION ID :", produitToDelete.id);
      await api.delete(`/produits/${produitToDelete.id}`);
      fetchProduits();
      setDeleteConfirmOpen(false);  
      setProduitToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  useEffect(() => {
    let filtered = produits;

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nom?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.categorie?.nom === selectedCategory);
    }

    setFilteredProduits(filtered);
  }, [searchTerm, produits, selectedCategory]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...filteredProduits].sort((a: any, b: any) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredProduits(sorted);
  };

  useEffect(() => {
    if (selectedProduit) {
      if (selectedProduit.variations?.length > 0) setSelectedVariation(selectedProduit.variations[0]);
      else setSelectedVariation(null);
      if (selectedProduit.medias?.length > 0) setSelectedMedia(selectedProduit.medias[0]);
      else setSelectedMedia(null);
    } else {
      setSelectedVariation(null);
      setSelectedMedia(null);
    }
  }, [selectedProduit]);

  const totalItems = filteredProduits.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const currentItems = filteredProduits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen px-4 py-6 flex justify-center">
      <div className="w-full max-w-7xl mx-auto">
        {!adding ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <div className="rounded-lg text-white">
                      <Boxes className="w-7 h-7 md:w-8 md:h-8 mr-2 text-gray-700" />
                    </div>
                    Produits
                  </h1>
                </div>
              </div>

              {/* Version desktop des filtres */}
              <div className="hidden md:flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un produit par nom ou code..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white shadow-sm"
                  />
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-10 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white shadow-sm appearance-none"
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.nom}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => setAdding(true)}
                  className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg flex items-center gap-2 px-6 py-3 transition-all hover:shadow-xl"
                >
                  <SquarePlus className="w-5 h-5" /> Nouveau produit
                </Button>
              </div>

              {/* Version mobile des filtres */}
              <div className="md:hidden space-y-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white shadow-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.nom}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  
                  <Button
                    onClick={() => setAdding(true)}
                    className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg flex items-center gap-2 px-4 py-3 transition-all hover:shadow-xl whitespace-nowrap"
                  >
                    <SquarePlus className="w-5 h-5" /> 
                    <span className="hidden xs:inline">Ajouter</span>
                  </Button>
                </div>
              </div>
            </div>
          
            {/* Tableau - Version desktop */}
            <Card className="hidden md:block">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-teal-400 rounded-full" />
                </div>
              ) : filteredProduits.length === 0 ? (
                <div className="py-16 text-center text-slate-600">Aucun produit trouvé</div>
              ) : (
                <>
                  <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                    <table className="w-full border-collapse text-sm md:text-base">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th
                            className="px-4 md:px-6 py-3 text-left text-gray-400 align-center cursor-pointer font-semibold text-slate-700 uppercase tracking-wide text-sm hover:text-teal-600 transition-colors"
                            onClick={() => handleSort("nom")}
                          >
                            Produit
                          </th>
                          <th
                            className="px-4 md:px-6 py-3 text-left text-gray-400 cursor-pointer font-semibold text-slate-700 uppercase tracking-wide text-sm hover:text-teal-600 transition-colors"
                            onClick={() => handleSort("prix_gros")}
                          >
                            Prix
                          </th>
                          <th
                            className="px-4 md:px-6 py-3 text-left text-gray-400 cursor-pointer font-semibold text-slate-700 uppercase tracking-wide text-sm hover:text-teal-600 transition-colors"
                            onClick={() => handleSort("stock")}
                          >
                            Stock
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-gray-400 font-semibold text-slate-700 uppercase tracking-wide text-sm">
                            Catégorie
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-gray-400 font-semibold text-slate-700 uppercase tracking-wide text-sm">
                            Statut
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-gray-400 font-semibold text-slate-700 uppercase tracking-wide text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((prod) => (
                          <tr
                            key={prod.id}
                            className="hover:bg-slate-50 transition border-b"
                          >
                            <td 
                              className="px-4 md:px-6 py-4 flex items-center gap-4 cursor-pointer"
                              onClick={() => setSelectedProduit(prod)}
                            >
                              {prod.medias?.length > 0 ? (
                                (() => {
                                  const image = prod.medias.find((m) => m.type === "image");
                                  const video = prod.medias.find((m) => m.type === "video");
                              
                                  if (image) {
                                    return (
                                      <img
                                        src={image.url}
                                        alt={prod.nom}
                                        className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-contain shadow-sm"
                                      />
                                    );
                                  }
                              
                                  if (video) {
                                    return (
                                      <video
                                        src={video.url}
                                        className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-contain shadow-sm"
                                        muted
                                      />
                                    );
                                  }
                              
                                  return (
                                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                      📦
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                  📦
                                </div>
                              )}
                            
                              <div>
                                <div className="font-medium text-black">{prod.nom}</div>
                                <div className="text-xs md:text-sm text-slate-500">{prod.code}</div>
                              </div>
                            </td>
                            <td 
                              className="px-4 md:px-6 py-4 font-semibold text-teal-700 cursor-pointer"
                              onClick={() => setSelectedProduit(prod)}
                            >
                              {prod.prix_gros} TND
                            </td>
                            <td 
                              className="px-4 md:px-6 py-4 cursor-pointer"
                              onClick={() => setSelectedProduit(prod)}
                            >
                              {prod.stock}
                            </td>
                            <td 
                              className="px-4 md:px-6 py-4 cursor-pointer"
                              onClick={() => setSelectedProduit(prod)}
                            >
                              {prod.categorie?.nom || "-"}
                            </td>
                            <td 
                              className="px-4 md:px-6 py-4 cursor-pointer"
                              onClick={() => setSelectedProduit(prod)}
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  prod.rupture_stock
                                    ? "bg-pink-100 text-pink-600"
                                    : "bg-teal-100 text-teal-500"
                                }`}
                              >
                                {prod.rupture_stock ? "Rupture" : "En stock"}
                              </span>
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduit(prod);
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4 text-teal-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteConfirm(prod);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-pink-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination desktop */}
                    <div className="pagination-container hidden md:flex">
                      <div className="pagination-controls">
                        <div className="items-per-page">
                          <label htmlFor="itemsPerPage" className="items-per-page-label">
                            Lignes:
                          </label>
                          <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="items-per-page-select"
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                        
                        <div className="pagination-info">
                          <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>-{" "}
                          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> sur{" "}
                          <strong>{totalItems}</strong>
                        </div>
                        
                        <div className="pagination-buttons">
                          <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                            title="Première page"
                          >
                            <ChevronsLeft size={14} />
                          </button>
                          
                          <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                            title="Page précédente"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          
                          {getPageNumbers().map((page) => (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`pagination-btn pagination-page ${
                                currentPage === page ? "pagination-active" : "pagination-desactive"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                            title="Page suivante"
                          >
                            <ChevronRight size={14} />
                          </button>
                          
                          <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                            title="Dernière page"
                          >
                            <ChevronsRight size={14} />
                          </button>
                        </div>
                        
                        <div className="page-jump">
                          <span className="page-jump-label">Page</span>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                              const page = Number(e.target.value);
                              if (page >= 1 && page <= totalPages) {
                                goToPage(page);
                              }
                            }}
                            className="page-jump-input"
                          />
                          <span className="page-jump-total">/ {totalPages}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Version mobile - Cartes produits */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-teal-400 rounded-full" />
                </div>
              ) : filteredProduits.length === 0 ? (
                <div className="py-16 text-center text-slate-600">Aucun produit trouvé</div>
              ) : (
                <>
                  {currentItems.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3"
                      onClick={() => setSelectedProduit(prod)}
                    >
                      {/* En-tête du produit avec image et infos */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {prod.medias?.length > 0 ? (
                            (() => {
                              const image = prod.medias.find((m) => m.type === "image");
                              const video = prod.medias.find((m) => m.type === "video");
                              
                              if (image) {
                                return (
                                  <img
                                    src={image.url}
                                    alt={prod.nom}
                                    className="h-16 w-16 rounded-lg object-contain bg-slate-50 border border-slate-200"
                                  />
                                );
                              }
                              
                              if (video) {
                                return (
                                  <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <span className="text-2xl">🎬</span>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                  📦
                                </div>
                              );
                            })()
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                              📦
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-black text-base truncate">{prod.nom}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">{prod.code}</p>
                            </div>
                            <span
                              className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                prod.rupture_stock
                                  ? "bg-pink-100 text-pink-600"
                                  : "bg-teal-100 text-teal-500"
                              }`}
                            >
                              {prod.rupture_stock ? "Rupture" : "Stock"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <span className="font-semibold text-teal-700">{prod.prix_gros} TND</span>
                            <span className="text-sm text-slate-600">Stock: {prod.stock}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                              {prod.categorie?.nom || "Non catégorisé"}
                            </span>
                            
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduit(prod);
                                }}
                                className="p-2 bg-teal-50 rounded-full hover:bg-teal-100 transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4 text-teal-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteConfirm(prod);
                                }}
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
                  ))}

                  {/* Pagination mobile simplifiée */}
                  <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Lignes:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                          </select>
                        </div>
                        
                        <div className="text-sm text-slate-600">
                          Page {currentPage}/{totalPages}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          ← Précédent
                        </button>
                        
                        <span className="text-sm font-medium">
                          {totalItems} produit{totalItems > 1 ? 's' : ''}
                        </span>
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          Suivant →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <AddProduct produit={editingProduit || undefined} onCancel={() => { setAdding(false); setEditingProduit(null); }} onSaved={handleProduitUpdated} />
        )}

        {/* POPUP D'INFORMATION */}
       {selectedProduit && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl">
             {/* Header */}
             <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800">{selectedProduit.nom}</h2>
                 <p className="text-slate-600 text-sm">{selectedProduit.code}</p>
               </div>
               <button
                 onClick={() => setSelectedProduit(null)}
                 className="p-2 hover:bg-slate-100 rounded-full transition-colors"
               >
                 <X className="w-5 h-5 text-slate-600" />
               </button>
             </div>
       
             {/* Content avec scroll */}
             <div className="overflow-y-auto flex-1 p-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Media Gallery */}
                 <div className="space-y-4">
                   <div className="relative bg-slate-50 rounded-xl overflow-hidden aspect-square">
                     {selectedMedia ? (
                       selectedMedia.type === "video" ? (
                         <video 
                           controls 
                           className="w-full h-full object-contain bg-black rounded-lg"
                         >
                           <source src={selectedMedia.url} type="video/mp4" />
                         </video>
                       ) : (
                         <img 
                           src={selectedMedia.url}
                           alt={selectedProduit.nom}
                           className="w-full h-full object-contain bg-white rounded-lg"
                         />
                       )
                     ) : (
                       <div className="flex items-center justify-center h-full text-slate-400">
                         <div className="text-center">
                           <div className="text-4xl mb-2">📦</div>
                           <p>Aucun média disponible</p>
                         </div>
                       </div>
                     )}
                   </div>
       
                   {/* Media Thumbnails */}
                   {selectedProduit.medias?.length > 0 && (
                     <div className="flex gap-3 overflow-x-auto pb-2">
                       {selectedProduit.medias.map((m: any, idx: number) => (
                         <button
                           key={idx}
                           onClick={() => setSelectedMedia(m)}
                           className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all duration-200 ${
                             selectedMedia === m 
                               ? "border-teal-400 shadow-md" 
                               : "border-slate-200 hover:border-teal-300"
                           }`}
                         >
                           {m.type === "video" ? (
                             <div className="w-full h-full bg-black rounded-md overflow-hidden relative">
                               <div className="absolute inset-0 flex object-contain items-center justify-center">
                                 <svg className="w-4 h-4 object-contain text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M8 5v14l11-7z"/>
                                 </svg>
                               </div>
                             </div>
                           ) : (
                             <img 
                               src={m.url}
                               alt={`Thumbnail ${idx + 1}`}
                               className="w-full h-full object-contain rounded-md"
                             />
                           )}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
       
                 {/* Product Details */}
                 <div className="space-y-6">
                   {/* Price and Basic Info */}
                   <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                     <div className="flex items-center justify-between mb-4">
                       <span className="text-3xl font-bold text-teal-400 ">{selectedProduit.prix_gros} TND</span>
                       <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                         selectedProduit.rupture_stock 
                           ? "bg-red-100 text-red-700" 
                           : "bg-teal-100 text-teal-400"
                       }`}>
                         {selectedProduit.rupture_stock ? "Rupture" : "En stock"}
                       </span>
                     </div>
       
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="text-slate-600 font-medium">Catégorie:</span>
                         <p className="text-slate-800 font-semibold">{selectedProduit.categorie?.nom || "-"}</p>
                       </div>
                       {selectedProduit.id_externe && (
                         <div>
                           <span className="text-slate-600 font-medium">SKU:</span>
                           <p className="text-slate-800 font-semibold">{selectedProduit.id_externe}</p>
                         </div>
                       )}
                       <div className="col-span-2">
                         <span className="text-slate-600 font-medium">Stock total:</span>
                         <p className="text-slate-800 font-semibold">{selectedProduit.stock} unités</p>
                       </div>
                     </div>
                   </div>
       
                   {/* Variations */}
                   {selectedProduit.variations?.length > 0 && (
                     <div className="bg-white border border-slate-200 rounded-xl p-6">
                       <h3 className="font-semibold text-lg text-slate-800 mb-4">
                         Variations disponibles
                       </h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                         {selectedProduit.variations.map((v: any, i: number) => (
                           <button
                             key={i}
                             onClick={() => setSelectedVariation(v)}
                             className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                               selectedVariation === v 
                                 ? "border-teal-400 bg-teal-50 shadow-md" 
                                 : "border-slate-200 hover:border-teal-300 hover:shadow-sm"
                             }`}
                           >
                             <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-3">
                                 {/* Indicateur de couleur */}
                                 {v.couleur && (
                                   <div 
                                     className="w-6 h-6 rounded-full border border-slate-300 shadow-sm"
                                     style={{ 
                                       backgroundColor: getCouleurStyle(v.couleur),
                                       border: getCouleurStyle(v.couleur) === '#ffffff' ? '1px solid #e2e8f0' : 'none'
                                     }}
                                     title={v.couleur}
                                   />
                                 )}
                                 <div>
                                   <div className="font-medium text-slate-900">
                                     {v.couleur} {v.taille && `- ${v.taille}`}
                                   </div>
                                   {v.id_externe && (
                                     <div className="text-xs text-slate-500">SKU: {v.id_externe}</div>
                                   )}
                                 </div>
                               </div>
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 v.rupture_stock ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-400"
                               }`}>
                                 {v.stock}
                               </span>
                             </div>
                             <div className="text-sm text-slate-600">
                               Prix: <span className="font-semibold text-teal-400">{v.prix_gros} TND</span>
                             </div>
                           </button>
                         ))}
                       </div>
                   
                       {selectedVariation && (
                         <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-teal-400">
                           <h4 className="font-medium text-slate-800 mb-3">Détails de la variation</h4>
                           <div className="grid grid-cols-2 gap-4 text-sm">
                             <div className="flex items-center gap-3">
                               <span className="text-slate-600">Couleur:</span>
                               <div className="flex items-center gap-2">
                                 {selectedVariation.couleur && (
                                   <div 
                                     className="w-5 h-5 rounded-full border border-slate-300 shadow-sm"
                                     style={{ 
                                       backgroundColor: getCouleurStyle(selectedVariation.couleur),
                                       border: getCouleurStyle(selectedVariation.couleur) === '#ffffff' ? '1px solid #e2e8f0' : 'none'
                                     }}
                                   />
                                 )}
                                 <p className="font-medium text-slate-800">
                                   {selectedVariation.couleur || "-"}
                                 </p>
                               </div>
                             </div>
                             <div>
                               <span className="text-slate-600">Taille:</span>
                               <p className="font-medium text-slate-800">{selectedVariation.taille || "-"}</p>
                             </div>
                             <div>
                               <span className="text-slate-600">Stock:</span>
                               <p className="font-medium text-slate-800">{selectedVariation.stock}</p>
                             </div>
                             <div>
                               <span className="text-slate-600">Prix:</span>
                               <p className="font-medium text-teal-700">{selectedVariation.prix_gros} TND</p>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
       
                   {/* Actions */}
                   <div className="flex gap-3 pt-4">
                     <Button 
                       onClick={() => {
                         setEditingProduit(selectedProduit);
                         setSelectedProduit(null);
                       }} 
                       className="bg-teal-400 hover:bg-teal-400 text-white shadow-lg transition-all duration-200 flex items-center gap-2"
                     >
                       <Pencil className="w-4 h-4" />
                       Modifier le produit
                     </Button>
                     <Button 
                       onClick={() => setSelectedProduit(null)}
                       className="bg-slate-200 hover:bg-slate-300 text-slate-700 shadow transition-all duration-200"
                     >
                       Fermer
                     </Button>
                   </div>
                 </div>
               </div>
       
               {/* Description et Livraison en parallèle sur toute la largeur */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                 {/* Description */} 
                 {selectedProduit.description && (
                   <div className="bg-white border border-slate-200 rounded-xl p-6">
                     <h3 className="font-semibold text-lg text-slate-800 mb-3">
                       Description
                     </h3>
                     <div
                       className="prose prose-sm max-w-none text-slate-700"
                       dangerouslySetInnerHTML={{ __html: selectedProduit.description }}
                     />
                   </div>
                 )}
                 
                 {/* Livraison */}
                 {selectedProduit.livraison && (
                   <div className="bg-white border border-slate-200 rounded-xl p-6">
                     <h3 className="font-semibold text-lg text-slate-800 mb-3">
                       Informations de livraison
                     </h3>
                     <div
                       className="prose prose-sm max-w-none text-slate-700"
                       dangerouslySetInnerHTML={{ __html: selectedProduit.livraison }}
                     />
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
       )} 
       {/* POPUP DE MODIFICATION - Version corrigée */}
       {editingProduit && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl">
             {/* Header simplifié */}
             <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
               <div className="flex items-center gap-3">
                 <Pencil className="w-6 h-6 text-teal-500" />
                 <div>
                   <h2 className="text-xl font-bold text-slate-800">Modifier le produit</h2>
                   <p className="text-slate-600 text-sm">{editingProduit.nom}</p>
                 </div>
               </div>
               <button
                 onClick={() => setEditingProduit(null)}
                 className="p-2 hover:bg-slate-100 rounded-full transition-colors"
               >
                 <X className="w-5 h-5 text-slate-600" />
               </button>
             </div> 
             {/* Content avec scroll */}
             <div className="overflow-y-auto flex-1">
               <AddProduct 
                 produit={editingProduit} 
                 onCancel={() => setEditingProduit(null)} 
                 onSaved={() => {
                   setEditingProduit(null);
                   handleProduitUpdated();
                 }} 
               />
             </div>
           </div>
         </div>
       )} 
       {/* POPUP DE CONFIRMATION DE SUPPRESSION - Version corrigée */}
       {deleteConfirmOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
             {/* Header simplifié */}
             <div className="flex items-center justify-between p-6 border-b border-slate-200">
               <div className="flex items-center gap-3">
                 <Trash2 className="w-6 h-6 text-pink-600" />
                 <div>
                   <h2 className="text-xl font-bold text-slate-800">Confirmer la suppression</h2>
                   <p className="text-slate-600 text-sm">Action irréversible</p>
                 </div>
               </div>
               <button
                 onClick={() => setDeleteConfirmOpen(false)}
                 className="p-2 hover:bg-slate-100 rounded-full transition-colors"
               >
                 <X className="w-5 h-5 text-slate-600" />
               </button>
             </div> 
             <div className="p-4">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Trash2 className="w-8 h-8 text-pink-600" />
                 </div>
                 <p className="text-slate-600 mb-4">
                   Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-pink-600">"{produitToDelete?.nom}"</span> ?
                   <span className="block text-sm text-slate-500 mt-1">Cette action est irréversible.</span>
                 </p>
               </div> 
               <div className="flex gap-3 justify-center">
                 <Button 
                   onClick={() => setDeleteConfirmOpen(false)}
                   className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg transition-all duration-200"
                 >
                   Annuler
                 </Button>
                 <Button 
                   onClick={handleDelete}
                   className="bg-red-600 hover:bg-red-700 text-pink-600 px-6 py-2 rounded-lg shadow-lg transition-all duration-200"
                 >
                   <Trash2 className="w-4 h-4 mr-2 text-pink-600 " />
                   Supprimer
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
     {/* Styles CSS pour la pagination */}
     <style>{`
       .pagination-container {
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 0.75rem;
         background: white;
         border-radius: 0 0 12px 12px;
         border-top: 1px solid #e5e7eb;
       } 
       .pagination-controls {
         display: flex;
         align-items: center;
         gap: 1rem;
         width: 100%;
         justify-content: space-between;
       } 
       .pagination-info {
         font-size: 0.8rem;
         color: #6b7280;
         white-space: nowrap;
       } 
       .items-per-page {
         display: flex;
         align-items: center;
         gap: 0.375rem;
       } 
       .items-per-page-label {
         font-size: 0.8rem;
         color: #6b7280;
         white-space: nowrap;
       } 
       .items-per-page-select {
         padding: 0.25rem 0.5rem;
         border: 1px solid #d1d5db;
         border-radius: 0.25rem;
         background: white;
         font-size: 0.8rem;
         width: 4rem;
       } 
       .pagination-buttons {
         display: flex;
         align-items: center;
         gap: 0.125rem;
       } 
       .pagination-btn {
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 0.375rem 0.5rem;
         border: 1px solid #d1d5db;
         background: white;
         color: #374151;
         border-radius: 0.25rem;
         font-size: 0.8rem;
         cursor: pointer;
         transition: all 0.15s;
         min-width: 2rem;
         height: 2rem;
       } 
       .pagination-btn:hover:not(:disabled) {
         background: #f3f4f6;
         border-color: #9ca3af;
       } 
       .pagination-btn:disabled {
         opacity: 0.4;
         cursor: not-allowed;
       } 
       .pagination-page {
         font-weight: 500;
         min-width: 2rem;
       } 
       .pagination-active {
         color: oklch(.373 .034 259.733);
         border-color: oklch(.707 .022 261.325);
       }
       
       .pagination-desactive {
         color: oklch(.872 .01 258.338);
         border-color: oklch(.872 .01 258.338);
       } 
       .pagination-active:hover {
         background: #0f766e;
       } 
       .page-jump {
         display: flex;
         align-items: center;
         gap: 0.375rem;
       } 
       .page-jump-label {
         font-size: 0.8rem;
         color: #6b7280;
         white-space: nowrap;
       } 
       .page-jump-input {
         width: 3rem;
         padding: 0.25rem;
         border: 1px solid #d1d5db;
         border-radius: 0.25rem;
         text-align: center;
         font-size: 0.8rem;
       } 
       .page-jump-total {
         font-size: 0.8rem;
         color: #6b7280;
       } 
       @media (max-width: 1024px) {
         .pagination-controls {
           gap: 0.75rem;
         }
         
         .items-per-page-label {
           display: none;
         }
       } 
       @media (max-width: 768px) {
         .pagination-container {
           padding: 0.5rem;
         }
         
         .pagination-controls {
           flex-wrap: wrap;
           justify-content: center;
           gap: 0.75rem;
         }
         
         .pagination-info {
           order: -1;
           width: 100%;
           text-align: center;
         }
         
         .items-per-page {
           order: 1;
         }
         
         .pagination-buttons {
           order: 2;
         }
         
         .page-jump {
           order: 3;
         }
       } 
       @media (max-width: 640px) {
         .pagination-controls {
           flex-direction: column;
           gap: 0.75rem;
         }
         
         .pagination-info {
           order: 0;
           width: auto;
         }
         
         .items-per-page,
         .pagination-buttons,
         .page-jump {
           order: 0;
         }
       }
     `}</style>
   </div>
 );
}