import React, { useEffect, useState } from "react";
import {
  Package,
  Search,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  Boxes,
  AlertCircle,
  CheckCircle2,
  Tag,
  X,
  SquarePlus
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Menu } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; // Ajouter toast si pas déjà importé
import api from "../../components/api";

interface Product {
  id: number;
  nom: string;
  description: string;
  prix_gros: number;
  stock: number;
  code: string;
  rupture_stock: boolean;
  id_externe?: string;
  livraison?: string;
  categorie: {
    id: number;
    nom: string;
  };
  medias: Array<{
    id: number;
    url: string;
    type: string;
  }>;
  fournisseur: {
    id: number;
    nom: string;
    email: string;
  };
  variations?: Array<{
    id: number;
    couleur: string;
    taille: string;
    prix_gros: number;
    stock: number;
    id_externe?: string;
  }>;
}

// Interface pour la réponse de l'API
interface ApiResponse {
  produits: Product[];
  pagination?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

const getCouleurStyle = (couleurNom: string) => {
  const couleursMap: { [key: string]: string } = {
    "Rouge": "#ff0000", "Bleu": "#0000ff", "Vert": "#00ff00", "Noir": "#000000", "Blanc": "#ffffff",
    "Gris": "#808080", "Rose": "#ffc0cb", "Jaune": "#ffff00", "Orange": "#ffa500", "Violet": "#800080",
    "Marron": "#a52a2a", "Beige": "#f5f5dc", "Or": "#ffd700", "Argent": "#c0c0c0", "Turquoise": "#40e0d0",
    "Cyan": "#00ffff", "Magenta": "#ff00ff", "Bordeaux": "#800000", "Bleu ciel": "#87ceeb",
    "Bleu marine": "#000080", "Bleu roi": "#1e00ff", "Bleu clair": "#add8e6", "Bleu foncé": "#00008b",
    "Vert clair": "#90ee90", "Vert foncé": "#006400", "Vert olive": "#808000", "Vert kaki": "#78866b",
    "Vert menthe": "#98ff98", "Vert fluo": "#39ff14", "Jaune clair": "#ffffe0", "Jaune foncé": "#ffcc00",
    "Jaune fluo": "#ccff00", "Orange clair": "#ffb84d", "Orange foncé": "#ff8c00", "Rose clair": "#ffb6c1",
    "Rose foncé": "#ff1493", "Fuchsia": "#ff00ff", "Saumon": "#fa8072", "Corail": "#ff7f50",
    "Lavande": "#e6e6fa", "Lilac": "#c8a2c8", "Mauve": "#e0b0ff", "Chocolat": "#d2691e", "Café": "#4b371c",
    "Camel": "#c19a6b", "Ivoire": "#fffff0", "Crème": "#fffdd0", "Écru": "#f5f5dc", "Anthracite": "#383e42",
    "Ardoise": "#708090", "Charbon": "#242124", "Taupe": "#483c32", "Sable": "#f6d7b0", "Cuivre": "#b87333",
    "Bronze": "#cd7f32"
  };
  return couleursMap[couleurNom] || "#cccccc";
};

export default function SpecialistProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchUserPermissions();
  }, []);

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get<ApiResponse>(`/specialist/products`);
      
      console.log("Réponse API complète:", res.data);
      
      // CORRECTION : Vérifier la structure de la réponse
      let productsData: Product[] = [];
      
      if (res.data && typeof res.data === 'object') {
        // Cas 1: La réponse contient un tableau 'produits'
        if (Array.isArray(res.data.produits)) {
          productsData = res.data.produits;
          console.log(`✓ ${productsData.length} produits chargés depuis res.data.produits`);
        } 
        // Cas 2: La réponse est directement un tableau
        else if (Array.isArray(res.data)) {
          productsData = res.data;
          console.log(`✓ ${productsData.length} produits chargés depuis res.data (tableau direct)`);
        }
        // Cas 3: Structure inconnue
        else {
          console.warn("Structure de réponse inattendue:", res.data);
          productsData = [];
        }
      }
      
      // S'assurer que productsData est toujours un tableau
      if (!Array.isArray(productsData)) {
        console.error("productsData n'est pas un tableau:", productsData);
        productsData = [];
      }
      
      setProducts(productsData);
      
    } catch (error: any) {
      console.error("Erreur chargement produits:", error);
      setError(error.response?.data?.message || "Erreur lors du chargement des produits");
      toast.error("Erreur lors du chargement des produits");
      setProducts([]); // S'assurer que products est un tableau vide
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.variations && selectedProduct.variations.length > 0) {
        setSelectedVariation(selectedProduct.variations[0]);
      } else {
        setSelectedVariation(null);
      }
      if (selectedProduct.medias && selectedProduct.medias.length > 0) {
        setSelectedMedia(selectedProduct.medias[0]);
      } else {
        setSelectedMedia(null);
      }
    } else {
      setSelectedVariation(null);
      setSelectedMedia(null);
    }
  }, [selectedProduct]);

  const fetchUserPermissions = async () => {
    try {
      const res = await api.get(`/specialist/dashboard`);
      setUserPermissions(res.data.permissions || []);
    } catch (error) {
      console.error("Erreur chargement permissions:", error);
      setUserPermissions([]);
    }
  };

  const hasPermission = (module: string, action: string) => {
    const permission = userPermissions.find((p: any) => p.module === module);
    if (!permission) return false;
    const actionMap: { [key: string]: string } = {
      'view': 'can_view', 'edit': 'can_edit', 'delete': 'can_delete', 'manage': 'can_manage'
    };
    return permission[actionMap[action]] || false;
  };

  const openProductModal = (product: Product): void => {
    console.log("Ouverture modal produit:", product.nom);
    console.log("Variations du produit:", product.variations);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeProductModal = (): void => {
    setSelectedProduct(null);
    setSelectedMedia(null);
    setSelectedVariation(null);
    setIsModalOpen(false);
  };

  const handleEditProduct = (product: Product): void => {
    navigate(`/specialist/products/edit/${product.id}`);
  };

  const handleDeleteProduct = async (product: Product): Promise<void> => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product.nom}" ?`)) return;
    try {
      await api.delete(`/specialist/products/${product.id}`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success("Produit supprimé avec succès");
    } catch (error: any) {
      console.error("Erreur suppression:", error);
      toast.error(error.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  // CORRECTION : S'assurer que products est un tableau avant d'utiliser .filter()
  const filteredProducts = Array.isArray(products) 
    ? products.filter(product => {
        if (!product) return false;
        
        const matchesSearch = product.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             "";
        const matchesCategory = categoryFilter === "all" || 
                               product.categorie?.nom === categoryFilter;
        return matchesSearch && matchesCategory;
      })
    : [];

  const categories = Array.isArray(products) 
    ? Array.from(new Set(products
        .filter(p => p && p.categorie && p.categorie.nom)
        .map(p => p.categorie.nom)))
    : [];

  const stats = [
    { 
      label: "Total Produits", 
      value: Array.isArray(products) ? products.length : 0, 
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: Boxes
    },
    { 
      label: "En rupture", 
      value: Array.isArray(products) 
        ? products.filter(p => p && p.rupture_stock).length 
        : 0, 
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: AlertCircle
    },
    { 
      label: "En stock", 
      value: Array.isArray(products) 
        ? products.filter(p => p && !p.rupture_stock).length 
        : 0, 
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: CheckCircle2
    },
    { 
      label: "Catégories", 
      value: categories.length, 
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      icon: Tag
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 mx-auto max-w-md mt-8">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={fetchProducts}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div>
                  <Package className="w-6 h-6" />
                </div>
                Gestion des Produits
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                {hasPermission('products', 'manage') 
                  ? "Gérez votre inventaire de produits" 
                  : "Consultez les produits disponibles"}
              </p>
            </div>
            
            {hasPermission('products', 'manage') && (
              <Button 
                onClick={() => navigate("/specialist/products/new")}
                className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg flex items-center gap-2 px-6 py-3 transition-all hover:shadow-xl ml-auto"
              >
                <SquarePlus className="w-5 h-5" />
                Nouveau produit
              </Button>
            )}
          </div>

          {/* Barre de recherche et filtres */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg"
                  />
                </div>
                
                <div className="relative min-w-[200px]">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg w-full appearance-none bg-white"
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Liste des produits */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            {/* Version Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {product.medias && product.medias[0] ? (
                              <img
                                src={`${product.medias[0].url}`}
                                alt={product.nom}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.nom}</div>
                              <div className="text-sm text-gray-500">{product.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="bg-teal-50 text-blue-700 border-teal-200">
                            {product.categorie?.nom || "Non catégorisé"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold ">
                            {product.prix_gros} TND
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{product.stock}</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={
                            product.rupture_stock 
                              ? "bg-red-100 text-red-800" 
                              : "bg-teal-100 text-teal-600"
                          }>
                            {product.rupture_stock ? "Rupture" : "En stock"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Menu as="div" className="relative">
                            <Menu.Button className="p-1 rounded hover:bg-gray-100">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => openProductModal(product)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Voir détails
                                    </button>
                                  )}
                                </Menu.Item>
                                {hasPermission('products', 'edit') && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleEditProduct(product)}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } flex items-center w-full px-4 py-2 text-sm text-blue-600`}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Modifier
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                                {hasPermission('products', 'delete') && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDeleteProduct(product)}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                              </div>
                            </Menu.Items>
                          </Menu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {searchQuery || categoryFilter !== "all" 
                          ? "Aucun produit ne correspond à votre recherche" 
                          : "Aucun produit disponible"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Version Mobile */}
            <div className="md:hidden">
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          {product.medias && product.medias[0] ? (
                            <img
                              src={`${product.medias[0].url}`}
                              alt={product.nom}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{product.nom}</h3>
                            <p className="text-sm text-gray-500">{product.code}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {product.categorie?.nom || "Non catégorisé"}
                              </Badge>
                              <Badge className={
                                product.rupture_stock 
                                  ? "bg-red-100 text-red-800 text-xs" 
                                  : "bg-green-100 text-green-800 text-xs"
                              }>
                                {product.rupture_stock ? "Rupture" : "En stock"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-1 rounded hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => openProductModal(product)}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </button>
                                )}
                              </Menu.Item>
                              {hasPermission('products', 'edit') && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } flex items-center w-full px-4 py-2 text-sm text-blue-600`}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Modifier
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                              {hasPermission('products', 'delete') && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDeleteProduct(product)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Supprimer
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </div>
                          </Menu.Items>
                        </Menu>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-semibold text-blue-600">
                          {product.prix_gros} TND
                        </div>
                        <div className="text-sm text-gray-600">
                          Stock: {product.stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery || categoryFilter !== "all" 
                      ? "Aucun produit ne correspond à votre recherche" 
                      : "Aucun produit disponible"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* POPUP D'INFORMATION - CORRIGÉE */}
        {isModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedProduct.nom}</h2>
                  <p className="text-slate-600 text-sm">{selectedProduct.code}</p>
                </div>
                <button
                  onClick={closeProductModal}
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
                            <source src={`${selectedMedia.url}`} type="video/mp4" />
                          </video>
                        ) : (
                          <img 
                            src={`${selectedMedia.url}`} 
                            alt={selectedProduct.nom}
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
                    {selectedProduct.medias && selectedProduct.medias.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {selectedProduct.medias.map((m: any, idx: number) => (
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
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={`${m.url}`} 
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover rounded-md"
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
                        <span className="text-3xl font-bold text-teal-400">{selectedProduct.prix_gros} TND</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedProduct.rupture_stock 
                            ? "bg-red-100 text-red-700" 
                            : "bg-teal-100 text-teal-400"
                        }`}>
                          {selectedProduct.rupture_stock ? "Rupture" : "En stock"}
                        </span>
                      </div>
        
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600 font-medium">Catégorie:</span>
                          <p className="text-slate-800 font-semibold">{selectedProduct.categorie?.nom || "-"}</p>
                        </div>
                        {selectedProduct.id_externe && (
                          <div>
                            <span className="text-slate-600 font-medium">SKU:</span>
                            <p className="text-slate-800 font-semibold">{selectedProduct.id_externe}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-slate-600 font-medium">Stock total:</span>
                          <p className="text-slate-800 font-semibold">{selectedProduct.stock} unités</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-600 font-medium">Fournisseur:</span>
                          <p className="text-slate-800 font-semibold">{selectedProduct.fournisseur.nom}</p>
                          <p className="text-slate-600 text-sm">{selectedProduct.fournisseur.email}</p>
                        </div>
                      </div>
                    </div>
        
                    {/* Variations - CORRIGÉ */}
                    {selectedProduct.variations && selectedProduct.variations.length > 0 ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="font-semibold text-lg text-slate-800 mb-4">
                          Variations disponibles ({selectedProduct.variations.length})
                        </h3>
                        
                        {/* Liste des variations sous forme de grille */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {selectedProduct.variations.map((v: any, i: number) => (
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
                                  v.stock === 0 ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-400"
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
                    ) : (
                      /* Message quand il n'y a pas de variations */
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                        <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <h3 className="font-semibold text-slate-700 mb-1">Aucune variation</h3>
                        <p className="text-slate-500 text-sm">Ce produit n'a pas de variations de couleur ou de taille.</p>
                      </div>
                    )}
                  </div>
                </div>
        
                {/* Description et Livraison en parallèle sur toute la largeur */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Description */} 
                  {selectedProduct.description && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h3 className="font-semibold text-lg text-slate-800 mb-3">
                        Description
                      </h3>
                      <div
                        className="prose prose-sm max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                      />
                    </div>
                  )}
                  
                  {/* Livraison */}
                  {selectedProduct.livraison && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h3 className="font-semibold text-lg text-slate-800 mb-3">
                        Informations de livraison
                      </h3>
                      <div
                        className="prose prose-sm max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: selectedProduct.livraison }}
                      />
                    </div>
                  )}
                </div>                
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};