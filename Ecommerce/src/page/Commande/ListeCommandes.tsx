import React, { useState, useEffect, useCallback, FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Search, Plus, Download, Filter, RotateCcw } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../components/api";

// --- Interfaces et Types génériques ---
interface ComponentProps extends React.HTMLAttributes<HTMLElement> {}
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'primary' | 'icon';
    size?: 'sm' | 'default' | 'lg';
}
interface SelectItemProps {
    value: string;
    children: ReactNode;
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

// --- 1. Table & related components ---
const Table: FC<ComponentProps> = ({ className, ...props }) => (
    <div className="w-full overflow-auto">
        <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
);
const TableHeader: FC<ComponentProps> = (props) => (
    <thead className="[&_tr]:border-b" {...props} />
);
const TableBody: FC<ComponentProps> = (props) => (
    <tbody className="[&_tr:last-child]:border-0" {...props} />
);
const TableRow: FC<ComponentProps> = ({ className, ...props }) => (
    <tr
        className={`border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100 ${className}`}
        {...props}
    />
);
const TableHead: FC<ComponentProps> = ({ className, ...props }) => (
    <th
        className={`h-12 pt-3 pb-3 px-2 md:px-4 text-left align-middle font-bold text-gray-600 [&:has([role=checkbox])]:pr-0 ${className}`}
        {...props}
    />
);
const TableCell: FC<ComponentProps> = ({ className, ...props }) => (
    <td
        className={`p-2 md:p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
        {...props}
    />
);

// --- 2. Button ---
const Button: FC<ButtonProps> = ({ className, variant = 'default', size = 'default', children, ...props }) => {
    let baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition duration-150";
    
    // Sizes
    switch (size) {
        case 'sm': baseStyles += " h-9 px-3 text-sm"; break;
        case 'lg': baseStyles += " h-12 px-8 text-md"; break;
        default: baseStyles += " h-10 px-4 py-2 text-sm";
    }

    // Variants
    switch (variant) {
        case 'primary': baseStyles += " bg-teal-400 text-white hover:bg-indigo-700 shadow-md"; break;
        case 'outline': baseStyles += " border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"; break;
        case 'ghost': baseStyles += " hover:bg-gray-100 text-gray-700"; break;
        case 'icon': baseStyles = "h-10 w-10 p-0 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center justify-center"; break;
        case 'default':
        default: baseStyles += " bg-gray-200 text-gray-800 hover:bg-gray-300";
    }

    return (
        <button className={`${baseStyles} ${className}`} {...props}>
            {children}
        </button>
    );
};

// --- 3. Badge ---
const Badge: FC<ComponentProps> = ({ className, ...props }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase transition-colors ${className}`}
        {...props}
    />
);

// --- 4. Input ---
const Input: FC<InputProps> = ({ className, ...props }) => (
    <input
        className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
    />
);

// --- 5. Card ---
const Card: FC<ComponentProps> = ({ className, ...props }) => (
    <div
        className={`rounded-xl border bg-white text-gray-900 shadow-lg ${className}`}
        {...props}
    />
);
const CardContent: FC<ComponentProps> = ({ className, ...props }) => (
    <div className={`p-0 pt-0 ${className}`} {...props} />
);

// --- Interfaces Backend (inchangées) ---
interface Client { prenom: string; nom: string; telephone: string; }
interface Produit { nom: string; medias: { url: string }[]; }
interface LigneCommande { produit?: Produit; }
interface SousCommande { code: string; statut: string; lignes?: LigneCommande[]; }
interface CommandeType {
    id: number; code: string; client: Client; cree_le: string; total: number | string;
    etat_confirmation: string; sous_commandes?: SousCommande[]; collis_date: string;
    source: string; delai_livraison?: string;
}

const getStatutBadgeClasses = (statut: string): string => {
    switch (statut.toLowerCase()) {
        case "livree": return "bg-teal-100 text-teal-500 border border-teal-200";
        case "confirmee": return "bg-blue-100 text-blue-700 border border-blue-200";
        case "expediee": return "bg-indigo-100 text-indigo-700 border border-indigo-200";
        case "annulee": return "bg-pink-100 text-pink-500 border border-red-200";
        case "livrée payée": return "bg-green-100 text-green-700 border border-green-200";
        case "emballage_en_cours":
         return "bg-blue-50 text-blue-500 border border-blue-200";
        case "tentative de confirmation 1":
        case "tentative de confirmation 2":
        case "tentative de confirmation 3":
        case "tentative de confirmation 4":
        case "tentative de confirmation 5":
          return "bg-orange-100 text-orange-600 border border-orange-200";
        case "en_attente_enlevement": return "bg-purple-100 text-purple-600 border border-purple-200";
        case "colis enlevé": return "bg-green-100 text-green-600 border border-green-200";
        case "problème d'enlèvement": return "bg-red-100 text-red-600 border border-red-200";
        case "réception_dépôt": return "bg-cyan-100 text-cyan-600 border border-cyan-200";
        case "en_cours_livraison": return "bg-blue-100 text-blue-600 border border-blue-200";
        case "problème de livraison": return "bg-red-100 text-red-500 border border-red-200";
        case "à retourner": return "bg-orange-50 text-orange-700 border border-orange-200";
        case "colis retourné": return "bg-gray-100 text-gray-600 border border-gray-200";
        case "retournée payée": return "bg-green-100 text-green-700 border border-green-200";
        case "non disponible": return "bg-gray-200 text-gray-700 border border-gray-300";
        case "en_attente": default: return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    }
};
const getSourceBadgeClasses = (source: string): string => {
    switch (source) {
        case "Facebook": return "bg-blue-50 text-blue-600";
        case "WooCommerce": return "bg-purple-100 text-purple-600";
        case "Tik Tok Pro": return "bg-black text-white";
        case "Shopify": return "bg-green-50 text-green-600";
        case "Instagram": return "bg-pink-50 text-pink-600";
        default: return "bg-gray-100 text-gray-600";
    }
};

const getSourceClasses = (source: string): string => {
    switch (source) {
        case "site_web": return "#2563eb";
        case "Facebook": return "#1877F2";
        case "Converty": return "#f97316";
        case "WooCommerce": return "#96588a";
        case "Tik Tok Pro": return "#000000";
        case "Shopify": return "#509249";
        case "Téléphone": return "#10b981";
        case "Instagram": return "#c13584";
        case "WhatsApp": return "#25D366";
        default: return "#4b5563";
    }
};
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    } catch {
        return "N/A";
    }
};

const TRACKING_STATUSES = [
  "en_attente",
  "emballage_en_cours",
  "annulee",
  "Tentative de confirmation 1",
  "Tentative de confirmation 2",
  "Tentative de confirmation 3",
  "Tentative de confirmation 4",
  "Tentative de confirmation 5",
  "en_attente_enlevement",
  "Colis enlevé",
  "Problème d'enlèvement",
  "Réception_dépôt",
  "en_cours_livraison",
  "Problème de livraison",
  "livree",
  "Livrée payée",
  "À retourner",
  "Colis retourné",
  "Retournée payée",
  "Non disponible",
];

// --- Composant Principal ---
const ListeCommandes: React.FC = () => {
    const navigate = useNavigate();
    const [commandes, setCommandes] = useState<CommandeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("tous");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const lignesParPage = 10;
    const [rechercheProduit, setRechercheProduit] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [trackingFilter, setTrackingFilter] = useState<string[]>([]);
    const [produitFilter, setProduitFilter] = useState<string[]>([]);
    const [dateCreationStart, setDateCreationStart] = useState<string>("");
    const [dateCreationEnd, setDateCreationEnd] = useState<string>("");
    const [dateCompletionStart, setDateCompletionStart] = useState<string>("");
    const [dateCompletionEnd, setDateCompletionEnd] = useState<string>("");
    const [produits, setProduits] = useState<Produit[]>([]);
    const [colonnesAffichees, setColonnesAffichees] = useState<string[]>([
      "code", "client", "telephone", "total", "statut", "produit", "cree_le", "collis_date", "sousCmd", "source", "delai_livraison"
    ]);
    const [selectedCommandes, setSelectedCommandes] = useState<number[]>([]);

    const debounce = (func: (...args: any[]) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const debouncedSetRecherche = useCallback(debounce((v:string) => { setRecherche(v); setPage(1); }, 500), []);
    const handleSearchChange = (value: string) => { setSearchValue(value); debouncedSetRecherche(value.trim()); };
  
    const trackingCount = trackingFilter.length;
    const produitCount = produitFilter.length;
    const totalFilters = trackingCount + produitCount + (dateCreationStart ? 1 : 0) + (dateCreationEnd ? 1 : 0) + (dateCompletionStart ? 1 : 0) + (dateCompletionEnd ? 1 : 0);

    const handleResetFilters = () => {
      setTrackingFilter([]);
      setProduitFilter([]);
      setDateCreationStart(""); setDateCreationEnd("");
      setDateCompletionStart(""); setDateCompletionEnd("");
    };
    const handleApplyFilters = () => {
      setShowAdvancedFilters(false);
      setPage(1);
    };
  
    useEffect(() => {
      const fetchProduits = async () => {
        try {
          const res = await api.get("/produits/all-vendeurs");
          if (Array.isArray(res.data)) {
            setProduits(res.data);
          } else if (Array.isArray(res.data.produits)) {
            setProduits(res.data.produits);
          } else {
            console.error("⚠️ Format inattendu pour produits:", res.data);
            setProduits([]);
          }
        } catch (err) {
          console.error("Erreur fetch produits:", err);
          setProduits([]);
        }
      };
      fetchProduits();
    }, []);

    const chargerCommandes = async () => {
    try {
        setLoading(true);
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: lignesParPage.toString(),
        });

        if (recherche.trim()) params.append("search", recherche.trim());
        if (filtreStatut && filtreStatut !== "tous") params.append("statut", filtreStatut);
        
        if (trackingFilter.length > 0) {
            params.append("tracking", trackingFilter.join(","));
        }
        if (produitFilter.length > 0) {
            params.append("produit", produitFilter.join(","));
        }
        if (dateCreationStart) params.append("dateCreationStart", dateCreationStart);
        if (dateCreationEnd) params.append("dateCreationEnd", dateCreationEnd);
        if (dateCompletionStart) params.append("dateCompletionStart", dateCompletionStart);
        if (dateCompletionEnd) params.append("dateCompletionEnd", dateCompletionEnd);

        // ✅ Utiliser api au lieu de fetch avec token manuel
        const response = await api.get(`/commande?${params.toString()}`);
        
        console.log("✅ Réponse API:", {
            commandesCount: response.data.commandes?.length,
            total: response.data.total,
            page: response.data.page,
            totalPages: response.data.totalPages
        });
        
        setCommandes(response.data.commandes || []);
        setTotalPages(response.data.totalPages || 1);
    } catch (error) {
        console.error("❌ Erreur chargement commandes:", error);
        setCommandes([]);
        setTotalPages(1);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
      chargerCommandes();
    }, [
      page,
      recherche,
      filtreStatut,
      trackingFilter,
      produitFilter,
      dateCreationStart,
      dateCreationEnd,
      dateCompletionStart,
      dateCompletionEnd,
    ]);

    const produitOptions = produits.map((p) => {
      const medias = p.medias || [];
    
      // Détecter image
      const imageMedia = medias.find((m) =>
        m.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
      );
    
      // Si aucune image, prendre une vidéo
      const videoMedia = !imageMedia
        ? medias.find((m) =>
            m.url.match(/\.(mp4|mov|avi|mkv|webm)$/i)
          )
        : null;
    
      const mediaUrl = imageMedia
        ? imageMedia.url
        : videoMedia
        ? videoMedia.url
        : null;
    
      const isVideo = !imageMedia && !!videoMedia;
    
      return {
        value: p.nom,
        label: p.nom,
        image: mediaUrl,
        isVideo: isVideo,
      };
    });

    const changerPage = (nouvellePage: number) => {
        if (nouvellePage >= 1 && nouvellePage <= totalPages) setPage(nouvellePage);
    };

    const trackingOptions = TRACKING_STATUSES.map((status) => ({
        value: status,
        label: status,
    }));

    const toggleSelection = (id: number) => {
      setSelectedCommandes(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };
    
    const selectAll = (checked: boolean) => {
      if (checked) {
        setSelectedCommandes(commandes.map(c => c.id));
      } else {
        setSelectedCommandes([]);
      }
    };
    const handleDeleteSelected = async () => {
      const result = await Swal.fire({
        title: "Confirmer la suppression",
        text: `Voulez-vous vraiment supprimer ${selectedCommandes.length} commande(s) ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "oklch(.592 .249 .584)",
        cancelButtonColor: "oklch(.777 .152 181.912)",
        confirmButtonText: "Supprimer",
        cancelButtonText: "Annuler",
      });
    
      if (result.isConfirmed) {
        try {  
        await api.post(
          "/commande/supprimer",
          { ids: selectedCommandes }
        );
    
          Swal.fire("Supprimé !", "Les commandes ont été supprimées avec succès.", "success");
          setSelectedCommandes([]);
          chargerCommandes();
        } catch (error) {
          console.error("Erreur suppression :", error);
          Swal.fire("Erreur", "Impossible de supprimer les commandes.", "error");
        }
      }
    };

    return (
  <div className="p-3 sm:p-5 lg:p-8 min-h-screen">

    {/* --- EN-TÊTE PRINCIPAL --- */}
    <motion.div
      className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-gray-200 mb-6"
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 md:mb-0 text-center md:text-left">
        Gestion des Commandes
      </h1>
    </motion.div>

    {/* --- BARRE DE CONTROLES --- */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
      {/* ---- GAUCHE ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
        {/* Barre de recherche */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher code, client ou téléphone..."
            className="pl-10 w-full"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
    
        {/* Bouton Filtrer */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-md transition duration-150 w-full sm:w-auto justify-center ${
            showAdvancedFilters
              ? "bg-gray-50 border-gray-300"
              : "bg-white border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter size={18} />
          <span className="text-sm sm:text-base font-medium">Filtrer</span>
          <Badge className="ml-2 bg-blue-50 text-blue-700 text-xs">{totalFilters}</Badge>
        </button>
      </div>
    
      {/* ---- DROITE ---- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
        {selectedCommandes.length > 0 && (
          <Button
            onClick={handleDeleteSelected}
            className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto justify-center"
          >
            Supprimer ({selectedCommandes.length})
          </Button>
        )}
    
        <Button
          variant="primary"
          size="default"
          onClick={() => navigate("/CreerCommande")}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> Créer Commande
        </Button>
      </div>
    </div>
    
    {/* Advanced Filters Panel (inspired by code2) */}
    {showAdvancedFilters && (
      <div className="mb-6 p-4 sm:p-6 bg-white rounded-xl shadow border border-gray-200">
        {(() => {
          const produitsFiltres = Array.isArray(produits)
          ? produits.filter(p => p.nom && p.nom.toLowerCase().includes(rechercheProduit.toLowerCase()))
          : [];
          return (
            <>
              {/* EN-TÊTE DU PANNEAU (avec boutons Appliquer/Réinitialiser) */}
              <div className="flex flex-col justify-between mb-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 mb-3 sm:mb-0">
                      <Filter size={20} className="text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Filtres Avancés</h3>
                  </div>
                  <div className="flex gap-2">
                      <Button className="border border-pink-600 text-white bg-pink-600 hover:bg-pink-700" size="sm" onClick={handleResetFilters}>
                          <RotateCcw size={16} className="mr-2" /> Réinitialiser
                      </Button>
                      {/* Le bouton primary utilise la couleur indigo mise à jour */}
                      <Button onClick={handleApplyFilters} className="border border-teal-400 bg-white text-teal-400 hover:bg-gray-50 shadow-md" size="sm">Fermer & Appliquer</Button>
                  </div>
              </div>
    
              {/* GRILLE PRINCIPALE DES FILTRES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
    
                {/* 1. Tracking (react-select) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking (statuts)
                  </label>
                  <Select
                    isMulti
                    options={trackingOptions}
                    placeholder="Tracking"
                    value={trackingFilter.map((s) => ({ label: s, value: s }))}
                    onChange={(options) =>
                      setTrackingFilter(options ? options.map((opt) => opt.value) : [])
                    }
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#E5E7EB",
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": { borderColor: "#9CA3AF" },
                        minHeight: "42px",
                        fontSize: "14px"
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#6B7280",
                        fontSize: "0.875rem",
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: "#E0E7FF",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: "#3730A3",
                        fontSize: "13px"
                      }),
                    }}
                  />
                  {trackingFilter.length > 0 && (
                    <div className="mt-2 text-sm text-blue-700 font-medium">
                      {trackingFilter.length} sélectionné(s)
                    </div>
                  )}
                </div>
    
                {/* 2. Produits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produits de la commande
                  </label>
                  <Select
                    isMulti
                    options={produitOptions}
                    onChange={(options) =>
                      setProduitFilter(options ? options.map((o) => o.value) : [])
                    }
                    value={produitOptions.filter((opt) =>
                      produitFilter.includes(opt.value)
                    )}
                    placeholder="Sélectionnez un ou plusieurs produits..."
                    formatOptionLabel={(option) => (
                      <div className="flex items-center gap-2">
                        {option.image ? (
                          option.isVideo ? (
                            <video
                              src={option.image}
                              className="w-7 h-7 rounded-md object-contain"
                            />
                          ) : (
                            <img
                              src={option.image}
                              className="w-7 h-7 rounded-md object-contain"
                            />
                          )
                        ) : (
                          <div className="w-7 h-7 bg-gray-200 rounded" />
                        )}
                  
                        <span className="text-sm">{option.label}</span>
                      </div>
                    )}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#E5E7EB",
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": { borderColor: "#9CA3AF" },
                        minHeight: "42px",
                        fontSize: "14px"
                      }),
                    }}
                  />
                
                  {produitFilter.length > 0 && (
                    <div className="mt-2 text-sm text-blue-700 font-medium">
                      {produitFilter.length} produit(s) sélectionné(s)
                    </div>
                  )}
                </div>
    
                {/* 3. Date de Création */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-10">Du:</span>
                      <input type="date" value={dateCreationStart} onChange={(e)=>setDateCreationStart(e.target.value)} className="w-full h-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-10">Au:</span>
                      <input type="date" value={dateCreationEnd} onChange={(e)=>setDateCreationEnd(e.target.value)} className="w-full h-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                  </div>
                </div>
                
                {/* 4. Date de Complétion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de complétion</label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-10">Du:</span>
                      <input type="date" value={dateCompletionStart} onChange={(e)=>setDateCompletionStart(e.target.value)} className="w-full h-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-10">Au:</span>
                      <input type="date" value={dateCompletionEnd} onChange={(e)=>setDateCompletionEnd(e.target.value)} className="w-full h-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 5. Colonnes à afficher */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sélectionnez les colonnes à afficher
                </label>
                <Select
                  isMulti
                  placeholder="Toutes les colonnes"
                  value={colonnesAffichees.map((c) => ({ value: c, label: c }))}
                  options={[
                    { value: "cree_le", label: "Date Création" },
                    { value: "collis_date", label: "Date Complétion" },
                    { value: "code", label: "Code Commande" },
                    { value: "client", label: "Client (Nom/Prénom)" },
                    { value: "telephone", label: "Téléphone" },
                    { value: "total", label: "Total" },
                    { value: "statut", label: "Statut" },
                    { value: "produit", label: "Produits" },
                    { value: "sousCmd", label: "sous_commande" },
                    { value: "source", label: "Source" },
                    { value: "delai_livraison", label: "Delai_livraison" },
                    
                  ]}
                  onChange={(selected) => {
                    const values = selected.map((s) => s.value);
                    setColonnesAffichees(values);
                  }}
                  className="text-sm"
                  styles={{
                    control: (base) => ({ 
                      ...base, 
                      borderColor: "#E5E7EB", 
                      borderRadius: "8px", 
                      minHeight: "42px",
                      fontSize: "14px"
                    }),
                    placeholder: (base) => ({ 
                      ...base, 
                      color: "#6B7280", 
                      fontSize: "0.875rem" 
                    }),
                  }}
                />
                {colonnesAffichees.length > 0 && (
                  <div className="mt-2 text-sm text-blue-700 font-medium">
                    {colonnesAffichees.length} colonne(s) affichée(s)
                  </div>
                )}
              </div>
    
              {/* PIED DE PAGE DES FILTRES */}
              <div className="mt-6 border-t pt-4 text-sm text-gray-700 flex items-center justify-between">
                <div className="font-medium text-gray-600">{totalFilters} filtre(s) appliqué(s)</div>
              </div>
            </>
          );
        })()}
      </div>
    )}

    {/* --- TABLE RESPONSIVE --- */}
    <Card className="shadow-xl rounded-2xl overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-4xl text-indigo-500">
            🔄
          </motion.div>
          <span className="ml-4 text-lg text-gray-600">Chargement...</span>
        </div>
      ) : commandes.length === 0 ? (
        <div className="p-10 text-center text-lg text-gray-500">
          😔 Aucune commande trouvée.
        </div>
      ) : (
       <CardContent className="p-0">
          {/* Tableau pour desktop et tablette (landscape à partir de md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-sm">
                  <TableHead className="px-2 py-2">
                    <input
                      type="checkbox"
                      onChange={(e) => selectAll(e.target.checked)}
                      checked={
                        selectedCommandes.length === commandes.length &&
                        commandes.length > 0
                      }
                    />
                  </TableHead>
                  {colonnesAffichees.includes("cree_le") && ( <TableHead className="font-bold text-gray-700">Date</TableHead>)}
                  {colonnesAffichees.includes("collis_date") && ( <TableHead className="font-bold text-gray-700">Colis Daté</TableHead>)}
                  {colonnesAffichees.includes("code") && ( <TableHead className="font-bold text-gray-700">Code</TableHead>)}
                  {colonnesAffichees.includes("client") && ( <TableHead className="font-bold text-gray-700">Client</TableHead>)}
                  {colonnesAffichees.includes("telephone") && ( <TableHead className="font-bold text-gray-700">Téléphone</TableHead>)}
                  {colonnesAffichees.includes("produit") && ( <TableHead className="font-bold text-gray-700">Produit</TableHead>)}
                  {colonnesAffichees.includes("sousCmd") && ( <TableHead className="font-bold text-gray-700">Sous-Commande</TableHead>)}
                  {colonnesAffichees.includes("total") && ( <TableHead className="font-bold text-gray-700 text-right">Total</TableHead>)}
                  {colonnesAffichees.includes("source") && (<TableHead className="font-bold text-gray-700">Source</TableHead>)}
                  {colonnesAffichees.includes("statut") && (<TableHead className="font-bold text-gray-700">Tracking</TableHead>)}
                  {colonnesAffichees.includes("delai_livraison") && (<TableHead className="font-bold text-gray-700">Délai livraison</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {commandes.map((commande, index) => {
                  const sousCmd = commande.sous_commandes?.[0];
                  const ligneProduit = sousCmd?.lignes?.[0]?.produit;
                  
                  return (
                    <motion.tr
                      key={commande.id}
                      className={`cursor-pointer ${index % 2 !== 0 ? 'bg-gray-50/50' : 'bg-white'} hover:bg-gray-100`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TableCell className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedCommandes.includes(commande.id)}
                          onChange={() => toggleSelection(commande.id)}
                        />
                      </TableCell>
                       {/* Créée le */}
                      {colonnesAffichees.includes("cree_le") && (
                        <TableCell className="py-3 text-sm text-gray-600"onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }} >{formatDate(commande.cree_le)}</TableCell>
                      )}
                      
                      {/* Colis Daté */}
                      {colonnesAffichees.includes("collis_date") && (
                        <TableCell className="py-3 text-sm text-indigo-600 font-medium" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>{formatDate(commande.collis_date)}</TableCell>
                      )}
                      
                      {/* Code */}
                      {colonnesAffichees.includes("code") && (
                        <TableCell className="py-3" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          <span className='text-xs lg:text-sm font-bold text-indigo-700 truncate max-w-[100px] lg:max-w-none block'>{commande.code}</span>
                      </TableCell>
                      )}
                      
                      {/* Client */}
                      {colonnesAffichees.includes("client") && (
                        <TableCell className="py-3 text-sm text-gray-700" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          <span className="truncate max-w-[80px] lg:max-w-none block">{commande.client.prenom} {commande.client.nom}</span>
                      </TableCell>
                      )}
                      
                      {/* Téléphone */}
                      {colonnesAffichees.includes("telephone") && (
                        <TableCell className="py-3 text-sm text-gray-500" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>{commande.client.telephone}</TableCell>
                      )}
                  
                      {/* Produit */}
                      {colonnesAffichees.includes("produit") && ( 
                        <TableCell
                          className="py-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/commande/${commande.id}`);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const medias = ligneProduit?.medias || [];
                              const imageMedia = medias.find((m: any) => m.type?.startsWith("image"));
                              const videoMedia = !imageMedia ? medias.find((m: any) => m.type?.startsWith("video")) : null;
                      
                              if (imageMedia) {
                                return (
                                  <img
                                    src={imageMedia.url}
                                    alt={ligneProduit?.nom || "Produit"}
                                    className="w-6 h-6 lg:w-8 lg:h-8 object-contain rounded-md border border-gray-200"
                                  />
                                );
                              } else if (videoMedia) {
                                return (
                                  <video
                                    src={videoMedia.url}
                                    className="w-6 h-6 lg:w-8 lg:h-8 object-contain rounded-md border border-gray-200"
                                    controls
                                  />
                                );
                              } else {
                                return (
                                  <img
                                    src="/placeholder.png"
                                    alt="Produit"
                                    className="w-6 h-6 lg:w-8 lg:h-8 object-contain rounded-md border border-gray-200"
                                  />
                                );
                              }
                            })()}
                            <span className="text-xs lg:text-sm font-medium text-gray-700 truncate max-w-[80px] lg:max-w-[150px]">
                              {ligneProduit?.nom || "—"}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Sous-commande */}
                      {colonnesAffichees.includes("sousCmd") && (
                        <TableCell className="py-3" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          <span className='text-xs lg:text-sm text-indigo-700 truncate max-w-[80px] lg:max-w-none block'>{sousCmd?.code || "—"}</span>
                      </TableCell>
                      )}
                      
                      {/* Total */}
                      {colonnesAffichees.includes("total") && (
                        <TableCell className="py-3 font-semibold text-right text-teal-600 text-sm" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          {parseFloat(commande.total.toString()).toFixed(2)} DT
                        </TableCell>
                      )}
                      
                      {/* Source */}
                      {colonnesAffichees.includes("source") && (
                        <TableCell className="py-3" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          <Badge className={`text-xs ${getSourceBadgeClasses(commande.source)}`}>
                              {commande.source}
                          </Badge>
                        </TableCell>
                      )}
                      
                      {/* Statut */}
                      {colonnesAffichees.includes("statut") && (
                        <TableCell className="py-3" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          <Badge className={`text-xs ${getStatutBadgeClasses(sousCmd?.statut || "N/A")}`}>
                              {sousCmd?.statut?.replace(/_/g, " ") || "N/A"}
                          </Badge>
                        </TableCell>
                      )}
                      
                      {/* Délai de livraison */}
                      {colonnesAffichees.includes("delai_livraison") && (
                        <TableCell className="py-3 text-xs lg:text-sm text-gray-600" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commande/${commande.id}`);
                      }}>
                          {commande.delai_livraison || 'N/A'}
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Cartes Mobile uniquement (< md, portrait tablette inclus) */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {commandes.map((commande, index) => {
              const sousCmd = commande.sous_commandes?.[0];
              const ligneProduit = sousCmd?.lignes?.[0]?.produit;
              const total = parseFloat(commande.total.toString()).toFixed(2);
              
              return (
                <motion.div
                  key={commande.id}
                  className="p-4 rounded-xl border border-gray-200 shadow-md bg-white cursor-pointer hover:border-indigo-400 transition"
                  onClick={() => navigate(`/commande/${commande.id}`)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold text-indigo-700">
                        {commande.code}
                      </span>
                      <Badge className={`mt-1 text-xs ${getStatutBadgeClasses(sousCmd?.statut || "N/A")}`}>
                        {sousCmd?.statut?.replace(/_/g, " ") || "N/A"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-teal-600">
                        {total} <span className="text-sm font-medium">DT</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Client:</span>
                      <span className="font-medium text-gray-800 truncate max-w-[60%]">
                        {commande.client.prenom} {commande.client.nom}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Téléphone:</span>
                      <span className="font-medium text-gray-800">
                        {commande.client.telephone}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Source:</span>
                      <Badge className={`text-xs ${getSourceBadgeClasses(commande.source)}`}>
                        {commande.source}
                      </Badge>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Produit:</span>
                      <span className="font-medium text-gray-800 truncate max-w-[50%]">
                        {ligneProduit?.nom || "N/A"}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Créée le:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(commande.cree_le)}
                      </span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>

    {/* --- PAGINATION --- */}
    <div className="flex flex-wrap justify-center items-center mt-6 gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-sm">
      <Button variant="outline" size="sm" onClick={() => changerPage(page - 1)} disabled={page === 1} className="w-full sm:w-auto justify-center">
        <ChevronLeft size={16} className="mr-1" /> Précédent
      </Button>
      <span className="text-gray-600 font-semibold text-center w-full sm:w-auto">Page {page} sur {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => changerPage(page + 1)} disabled={page === totalPages} className="w-full sm:w-auto justify-center">
        Suivant <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  </div>
);
};

export default ListeCommandes;