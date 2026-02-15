import React, { useEffect, useState, useMemo } from "react";
import RetraitModal from "./RetraitModal";
import Swal from "sweetalert2";
import {
    Clock,
    PlusSquare,
    RefreshCw,
    Maximize2,
    Search,
    Filter,
    ArrowUpDown,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
    Calendar,
    MoreVertical
} from "lucide-react";
import api from "../../components/api";

// --- Types ---
type Demande = {
    id: number;
    code_retrait: string;
    montant: string;
    statut: string;
    cree_le: string;
};

type Transaction = {
    id: number;
    code_transaction: string;
    type: string;
    montant: number;
    meta?: any;
    cree_le: string;
};

// --- Skeleton ---
const TableSkeleton: React.FC<{ rows?: number, cols?: number }> = ({ rows = 5, cols = 3 }) => (
    <div className="animate-pulse space-y-2 p-4">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex space-x-4 items-center p-2 rounded bg-gray-50">
                {[...Array(cols)].map((_, j) => (
                     <div key={j} className="h-4 bg-gray-200 rounded" style={{ width: `${100/cols}%` }}></div>
                ))}
            </div>
        ))}
    </div>
);

// --- Skeleton Mobile ---
const MobileSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
    <div className="space-y-3 p-4">
        {[...Array(items)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        ))}
    </div>
);

// --- Composant de Pagination ---
const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
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

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-gray-200 bg-white">
            <div className="text-sm text-gray-700 mb-3 sm:mb-0">
                Page {currentPage} sur {totalPages}
            </div>
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <ChevronLeft size={16} />
                </button>
                
                <div className="hidden sm:flex space-x-1">
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1 rounded border text-sm ${
                                currentPage === page
                                    ? "bg-gray-100 text-gray-700 border-gray-400"
                                    : "border-gray-300 hover:bg-gray-50 text-gray-600"
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                
                <div className="sm:hidden">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded border border-gray-400">
                        {currentPage}
                    </span>
                </div>
                
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};

// --- Mobile Filter Drawer ---
const FilterDrawer: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    dateMin: string;
    setDateMin: (value: string) => void;
    dateMax: string;
    setDateMax: (value: string) => void;
    visibleColumns: any;
    setVisibleColumns: (value: any) => void;
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    onReset: () => void;
}> = ({ 
    isOpen, 
    onClose, 
    dateMin, 
    setDateMin, 
    dateMax, 
    setDateMax, 
    visibleColumns, 
    setVisibleColumns,
    typeFilter,
    setTypeFilter,
    onReset 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Filtres et options</h3>
                        <button onClick={onClose} className="p-2">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Type de transaction */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Type de transaction</h4>
                            <div className="space-y-2">
                                {["all", "credit", "debit"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`w-full text-left px-4 py-3 rounded-lg border ${
                                            typeFilter === type 
                                                ? "bg-blue-50 border-blue-500 text-blue-700" 
                                                : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        {type === "all" && "Tous les types"}
                                        {type === "credit" && "Paiements"}
                                        {type === "debit" && "Remboursements"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filtre par date */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Filtrer par date</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Date de début</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateMin}
                                            onChange={(e) => setDateMin(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Date de fin</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateMax}
                                            onChange={(e) => setDateMax(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonnes à afficher */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Colonnes à afficher</h4>
                            <div className="space-y-2">
                                {Object.entries(visibleColumns).map(([key, value]) => (
                                    <label key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <span className="text-gray-700">
                                            {key === "date" && "Date de création"}
                                            {key === "code" && "Code transaction"}
                                            {key === "type" && "Type"}
                                            {key === "montant" && "Montant"}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={value as boolean}
                                            onChange={() => setVisibleColumns((prev: any) => ({ 
                                                ...prev, 
                                                [key]: !prev[key] 
                                            }))}
                                            className="h-5 w-5 text-blue-600 rounded"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 border-t space-y-3">
                        <button
                            onClick={onReset}
                            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Réinitialiser tout
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Appliquer les filtres
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Composant principal ---
const Transactions: React.FC = () => {
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [solde, setSolde] = useState(0);
    const [loadingDemandes, setLoadingDemandes] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // États pour les filtres et la pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [dateMin, setDateMin] = useState("");
    const [dateMax, setDateMax] = useState("");
    const [columnFilter, setColumnFilter] = useState("all");
    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        code: true,
        type: true,
        montant: true
    });

    // --- Fonctions de chargement des données ---
    const fetchDemandes = async () => {
        setLoadingDemandes(true);
        try {
            const res = await api.get("/retraits");
            setDemandes(res.data.demandes || []);
            setError(null);
        } catch (err) {
            setError("Impossible de charger les demandes de retrait.");
            setDemandes([]);
        } finally {
            setLoadingDemandes(false);
        }
    };

    const fetchSolde = async () => {
        try {
            const res = await api.get("/users/me");
            const userData = res.data;
            
            if (userData.role === "vendeur" || userData.role === "fournisseur") {
                setSolde(Number(userData?.solde_portefeuille) || 0);
            } else {
                setSolde(0);
            }
        } catch {
            setSolde(0);
        }
    }

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const res = await api.get("/commande/transactions");
            setTransactions(res.data || []);
            setError(null);
        } catch (err) {
            console.error("Erreur lors du chargement des transactions :", err);
            setError("Impossible de charger l'historique des transactions.");
            setTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
    };

    // --- Chargement initial ---
    useEffect(() => {
        fetchSolde();
        fetchDemandes();
        fetchTransactions();
    }, []);

    // --- Filtrage des transactions ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            // Filtre texte global
            const matchesSearch = searchTerm === "" ||
                transaction.code_transaction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.type?.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtre par type
            const matchesType = typeFilter === "all" || transaction.type === typeFilter;

            // Filtre par date
            const transactionDate = new Date(transaction.cree_le);
            const afterMin = !dateMin || transactionDate >= new Date(dateMin);
            const beforeMax = !dateMax || transactionDate <= new Date(dateMax);

            return matchesSearch && matchesType && afterMin && beforeMax;
        });
    }, [transactions, searchTerm, typeFilter, dateMin, dateMax]);

    // --- Pagination ---
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // --- Gestion du changement de page ---
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // --- Réinitialiser la pagination quand les filtres changent ---
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter]);

    // --- Traduction des types de transaction ---
    const traduireType = (type: string): string => {
        switch (type?.toLowerCase()) {
            case "credit": return "Paiement";
            case "debit": return "Remboursement";
            default: return type || "Inconnu";
        }
    };

    // --- Formatage de la date ---
    const formatDate = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleDateString("fr-FR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleString("fr-FR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };
    
    // --- Capitaliser et remplacer underscore ---
    const formatStatus = (status: string): string => {
        if (!status) return "Inconnu";
        const formatted = status.replace("_", " ");
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    // --- Formatage du montant ---
    const formatAmount = (amount: number): string => {
        return Math.abs(amount).toFixed(2);
    };

    // --- Réinitialiser les filtres ---
    const handleResetFilters = () => {
        setDateMin("");
        setDateMax("");
        setVisibleColumns({ date: true, code: true, type: true, montant: true });
        setTypeFilter("all");
        setSearchTerm("");
        setCurrentPage(1);
    };

    // --- Composant pour carte mobile ---
    const MobileTransactionCard = ({ transaction }: { transaction: Transaction }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {traduireType(transaction.type)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {formatDateTime(transaction.cree_le)}
                    </div>
                </div>
                <div className={`text-sm font-semibold ${
                    transaction.type === "credit" ? "text-teal-400" : "text-pink-500"
                }`}>
                    {transaction.type === "credit" ? "+" : "-"}
                    {formatAmount(transaction.montant)} TND
                </div>
            </div>
            
            <div className="space-y-1 mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Code:</span>
                    <span className="font-mono text-gray-700">{transaction.code_transaction}</span>
                </div>
                {transaction.meta?.code_sousCommande && (
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Commande:</span>
                        <span className="text-gray-700">{transaction.meta.code_sousCommande}</span>
                    </div>
                )}
            </div>
        </div>
    );

    const MobileDemandeCard = ({ demande }: { demande: Demande }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {formatDate(demande.cree_le)}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                        {parseFloat(demande.montant).toFixed(2)} TND
                    </div>
                </div>
                <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        demande.statut === "approuve" ? "bg-teal-100 text-teal-400" :
                        demande.statut === "en_attente" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-pink-500"
                    }`}>
                        {formatStatus(demande.statut)}
                    </span>
                </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
                Code: {demande.code_retrait}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen px-4 py-4 md:px-8 md:py-6 space-y-6 md:space-y-8">
            {/* Titre Principal */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign size={28} className="md:size-8" />
                    <span>Transactions</span>
                </h1>
            </div>

            {/* Affichage d'erreur globale */}
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md" role="alert">
                    <span className="font-medium">Erreur:</span> {error}
                </div>
            )}

            {/* ================================== */}
            {/* Section Demandes de retrait        */}
            {/* ================================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                {/* En-tête de la section */}
                <div className="mb-4 md:mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                            <Clock size={20} className="text-gray-700 mr-2" />
                            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Demandes de retrait</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={fetchDemandes}
                                title="Rafraîchir"
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hidden md:block">
                                <Maximize2 size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Voici toutes les demandes de retrait que vous avez envoyées.
                    </p>
                </div>

                {/* Bouton principal mobile */}
                <div className="mb-4 md:hidden">
                    <button 
                        onClick={() => setOpenModal(true)}
                        className="w-full bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <PlusSquare size={18} />
                        Demander un retrait
                    </button>
                </div>

                {/* Contrôles Desktop */}
                <div className="hidden md:flex justify-between items-center mb-4">
                    <input 
                        type="text"
                        placeholder="Rechercher une demande..."
                        className="border border-gray-300 rounded-lg px-4 py-2 w-1/2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setOpenModal(true)}
                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <PlusSquare size={16} />
                            Demander un retrait
                        </button>
                    </div>
                </div>

                {/* Tableau Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Date</th>
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Montant</th>
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingDemandes ? (
                                <tr><td colSpan={3}><TableSkeleton rows={3} cols={3} /></td></tr>
                            ) : demandes.length > 0 ? (
                                demandes.map((d) => (
                                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-4 text-gray-700">{formatDateTime(d.cree_le)}</td>
                                        <td className="py-4 px-4 font-medium">{parseFloat(d.montant).toFixed(2)} TND</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                d.statut === "approuve" ? "bg-teal-100 text-teal-400" :
                                                d.statut === "en_attente" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-red-100 text-pink-500"
                                            }`}>
                                                {formatStatus(d.statut)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-gray-500">
                                        Aucune demande de retrait
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Version Mobile */}
                <div className="md:hidden">
                    {loadingDemandes ? (
                        <MobileSkeleton items={3} />
                    ) : demandes.length > 0 ? (
                        demandes.map((d) => (
                            <MobileDemandeCard key={d.id} demande={d} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Aucune demande de retrait trouvée
                        </div>
                    )}
                </div>
            </div>

            {/* ================================== */}
            {/* Section Historique Transactions    */}
            {/* ================================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* En-tête avec recherche */}
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Historique des transactions</h2>
                    
                    {/* Barre de recherche mobile */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Rechercher une transaction..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Contrôles mobiles */}
                    <div className="flex gap-2 mb-4 md:hidden">
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Filter size={16} />
                            Filtres
                        </button>
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                    </div>

                    {/* Contrôles desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex-1 flex items-center gap-4">
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            >
                                <option value="all">Tous les types</option>
                                <option value="credit">Paiements</option>
                                <option value="debit">Remboursements</option>
                            </select>
                            
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            >
                                <option value="10">10 par page</option>
                                <option value="20">20 par page</option>
                                <option value="50">50 par page</option>
                            </select>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Filter size={16} />
                                Plus de filtres
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tableau Desktop */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {visibleColumns.date && (
                                        <th className="py-3 px-6 text-left text-gray-600 font-medium">
                                            <div className="flex items-center gap-1">
                                                Date <ArrowUpDown size={14} />
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.code && (
                                        <th className="py-3 px-6 text-left text-gray-600 font-medium">
                                            <div className="flex items-center gap-1">
                                                Code <ArrowUpDown size={14} />
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.type && (
                                        <th className="py-3 px-6 text-left text-gray-600 font-medium">
                                            <div className="flex items-center gap-1">
                                                Type <ArrowUpDown size={14} />
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.montant && (
                                        <th className="py-3 px-6 text-right text-gray-600 font-medium">
                                            <div className="flex items-center gap-1 justify-end">
                                                Montant <ArrowUpDown size={14} />
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.code && (
                                      <th className="px-6 py-3 text-left font-semibold">
                                        <span className="flex items-center gap-1">
                                          Code_Commande <ArrowUpDown size={14} />
                                        </span>
                                      </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTransactions ? (
                                    <tr><td colSpan={4}><TableSkeleton rows={5} cols={4} /></td></tr>
                                ) : paginatedTransactions.length > 0 ? (
                                    paginatedTransactions.map((t) => (
                                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            {visibleColumns.date && (
                                                <td className="py-4 px-6 text-gray-700">
                                                    {formatDateTime(t.cree_le)}
                                                </td>
                                            )}
                                            {visibleColumns.code && (
                                                <td className="py-4 px-6 font-mono text-xs text-gray-800">
                                                    {t.code_transaction}
                                                </td>
                                            )}
                                            {visibleColumns.type && (
                                                <td className="py-4 px-6 text-gray-700">
                                                    {traduireType(t.type)}
                                                </td>
                                            )}
                                            {visibleColumns.montant && (
                                                <td className={`py-4 px-6 text-right font-medium ${
                                                    t.type === "credit" ? "text-teal-400" : "text-pink-600"
                                                }`}>
                                                    {t.type === "credit" ? "+" : "-"}
                                                    {formatAmount(t.montant)} TND
                                                </td>
                                            )}
                                            {visibleColumns.type && (
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                              {t.meta && t.meta.code_sousCommande
                                                ? t.meta.code_sousCommande
                                                : "-"}
                                            </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500">
                                            {searchTerm ? "Aucune transaction trouvée" : "Aucune transaction"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Desktop */}
                    {filteredTransactions.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                {/* Version Mobile */}
                <div className="md:hidden">
                    {loadingTransactions ? (
                        <MobileSkeleton items={5} />
                    ) : paginatedTransactions.length > 0 ? (
                        <div className="p-4">
                            {paginatedTransactions.map((t) => (
                                <MobileTransactionCard key={t.id} transaction={t} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? "Aucune transaction trouvée" : "Aucune transaction"}
                        </div>
                    )}
                    
                    {/* Pagination Mobile */}
                    {filteredTransactions.length > 0 && (
                        <div className="px-4 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Panneau de filtres Desktop */}
            {showFilters && (
                <div className="hidden md:block fixed inset-0 z-40">
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowFilters(false)}></div>
                    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">Filtres avancés</h3>
                                <button onClick={() => setShowFilters(false)} className="p-2">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Période</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Du</label>
                                            <input
                                                type="date"
                                                value={dateMin}
                                                onChange={(e) => setDateMin(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Au</label>
                                            <input
                                                type="date"
                                                value={dateMax}
                                                onChange={(e) => setDateMax(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Colonnes</h4>
                                    <div className="space-y-2">
                                        {Object.entries(visibleColumns).map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={value as boolean}
                                                    onChange={() => setVisibleColumns((prev: any) => ({ 
                                                        ...prev, 
                                                        [key]: !prev[key] 
                                                    }))}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {key === "date" && "Date de création"}
                                                    {key === "code" && "Code transaction"}
                                                    {key === "type" && "Type"}
                                                    {key === "montant" && "Montant"}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleResetFilters}
                                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Réinitialiser
                                    </button>
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Appliquer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawer de filtres Mobile */}
            <FilterDrawer
                isOpen={showMobileFilters}
                onClose={() => setShowMobileFilters(false)}
                dateMin={dateMin}
                setDateMin={setDateMin}
                dateMax={dateMax}
                setDateMax={setDateMax}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                onReset={handleResetFilters}
            />

            {/* Modal de Retrait */}
            <RetraitModal open={openModal} onClose={() => setOpenModal(false)} onSuccess={fetchDemandes} solde={solde} />
        </div>
    );
};

export default Transactions;