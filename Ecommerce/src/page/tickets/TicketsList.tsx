import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronsUpDown,
  FileText,
  LockOpen,
  Lock,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import api from "../../components/api";

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-4 md:p-6 shadow-md rounded-xl flex items-center justify-between">
    <div>
      <p className="text-sm md:text-base font-medium text-gray-500">{title}</p>
      <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">
        {value}
      </p>
    </div>
    <div className={`p-2 md:p-3 rounded-full ${colorClass}`}>
      <Icon size={20} className="md:size-6" />
    </div>
  </div>
);

const TableHeader = ({ title }) => (
  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
    <div className="flex items-center cursor-pointer hover:text-gray-700">
      {title}
      <ChevronsUpDown size={14} className="ml-2" />
    </div>
  </th>
);

const TableCell = ({ children, className = "" }) => (
  <td
    className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${className}`}
  >
    {children}
  </td>
);

// Mobile Card Component
const MobileTicketCard = ({ ticket, formatDate, normalize, onTicketClick }) => (
  <div 
    className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm"
    onClick={() => onTicketClick(ticket.id)}
  >
    <div className="flex justify-between items-start mb-2">
      <div>
        <div className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
          {ticket.title}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {ticket.code} • {formatDate(ticket.created_at)}
        </div>
      </div>
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
          normalize(ticket.status) === "ouvert"
            ? "bg-teal-100 text-teal-400"
            : normalize(ticket.status) === "ferme"
            ? "bg-pink-100 text-pink-500"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {ticket.status}
      </span>
    </div>
    
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">Type:</span>
        <span className="text-gray-700 font-medium">{ticket.type?.name || "N/A"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Assigné à:</span>
        <div className="flex items-center">
          {ticket.assignee?.nom ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 mr-2">
                {ticket.assignee.nom[0]}
              </div>
              <span className="text-gray-700">{ticket.assignee.nom}</span>
            </>
          ) : (
            <span className="text-gray-400">Non assigné</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Mobile Filter Drawer
const MobileFilterDrawer = ({ 
  isOpen, 
  onClose, 
  types, 
  selectedType, 
  setSelectedType, 
  selectedStatus, 
  setSelectedStatus,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedColumns,
  setSelectedColumns,
  columnsOptions,
  onReset,
  onApply
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Filtres avancés</h3>
            <button onClick={onClose} className="p-2">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Type de ticket */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Type de ticket</h4>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Tous les types</option>
                {types.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Statut</h4>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="ouvert">Ouvert</option>
                <option value="ferme">Fermé</option>
                <option value="en_cours">En cours</option>
              </select>
            </div>

            {/* Période */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Période</h4>
              <div className="space-y-2">
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Date de début"
                  />
                </div>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Date de fin"
                  />
                </div>
              </div>
            </div>

            {/* Colonnes visibles */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Colonnes à afficher</h4>
              <div className="space-y-2">
                {columnsOptions.map((col) => (
                  <label
                    key={col.value}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-gray-700 text-sm">{col.label}</span>
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.value)}
                      onChange={() => {
                        setSelectedColumns((prev) =>
                          prev.includes(col.value)
                            ? prev.filter((v) => v !== col.value)
                            : [...prev, col.value]
                        );
                      }}
                      className="h-4 w-4 text-teal-400 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t space-y-2">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Réinitialiser tout
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="w-full py-3 bg-teal-400 text-white rounded-lg hover:bg-teal-500 text-sm font-medium"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TicketsList() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [types, setTypes] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;

  // filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const normalize = (s) =>
    (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const [selectedColumns, setSelectedColumns] = useState([
    "date",
    "code",
    "title",
    "type",
    "status",
    "assigned_to",
  ]);

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const columnsOptions = [
    { value: "date", label: "Date" },
    { value: "code", label: "Code" },
    { value: "title", label: "Titre" },
    { value: "type", label: "Type" },
    { value: "status", label: "Statut" },
    { value: "assigned_to", label: "Assigné à" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [ticketsRes, typesRes] = await Promise.all([
          api.get("/tickets"),
          api.get("/tickets/types"),
        ]);
        const fetchedTickets = ticketsRes?.data?.tickets || [];
        const fetchedTypes = typesRes?.data?.types || [];
        setTickets(fetchedTickets);
        setFilteredTickets(fetchedTickets);
        setTypes(fetchedTypes);

        const total = fetchedTickets.length;
        const open = fetchedTickets.filter(
          (t) => normalize(t.status) === "ouvert"
        ).length;
        const closed = fetchedTickets.filter((t) =>
          ["ferme", "fermé"].includes(normalize(t.status))
        ).length;
        setStats({ total, open, closed });
      } catch (err) {
        console.error("Erreur chargement tickets/types:", err);
      }
    })();
  }, []);

  const applyFilters = () => {
    let filtered = [...tickets];
    const q = normalize(searchTerm);
    if (q) {
      filtered = filtered.filter(
        (t) =>
          normalize(t.title).includes(q) ||
          normalize(t.code).includes(q) ||
          normalize(t.type?.name).includes(q) ||
          normalize(t.assignee?.nom).includes(q)
      );
    }
    if (selectedType) {
      filtered = filtered.filter((t) => {
        if (!t.type) return false;
        const typeId = String(t.type.id ?? "");
        const typeName = normalize(t.type.name ?? "");
        return typeId === String(selectedType) || typeName === normalize(selectedType);
      });
    }
    if (selectedStatus) {
      const wanted = normalize(selectedStatus);
      filtered = filtered.filter((t) => normalize(t.status) === wanted);
    }
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      filtered = filtered.filter((t) => new Date(t.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      filtered = filtered.filter((t) => new Date(t.created_at) <= to);
    }
    setFilteredTickets(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [tickets, searchTerm, selectedType, selectedStatus, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    setSelectedColumns(["date", "code", "title", "type", "status", "assigned_to"]);
    setFilteredTickets(tickets);
    setShowFilters(false);
    setShowMobileFilters(false);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleTicketClick = (ticketId) => {
    window.location.href = `/ticket/${ticketId}`;
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8">
      {/* TITRE */}
      <div className="flex items-center mb-6 md:mb-8">
        <FileText size={32} className="text-gray-800 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Support</h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-3 mb-6">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={FileText}
          colorClass="bg-gray-100"
        />
        <StatCard
          title="Ouverts"
          value={stats.open}
          icon={LockOpen}
          colorClass="bg-gray-100"
        />
        <StatCard
          title="Fermés"
          value={stats.closed}
          icon={Lock}
          colorClass="bg-gray-100"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* RECHERCHE + FILTRES HEADER */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
              />
            </div>

            {/* Boutons mobiles */}
            <div className="flex gap-2 md:hidden">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <Filter size={16} />
                Filtres
              </button>
              
              {(role === "vendeur" || role === "fournisseur") && (
                <Link
                  to="/ticket/create"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal-400 text-white hover:bg-teal-500 text-sm font-medium"
                >
                  + Nouveau
                </Link>
              )}
            </div>

            {/* Boutons desktop */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium transition ${
                  showFilters ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <Filter size={16} />
                Filtres avancés
              </button>
              
              {(role === "vendeur" || role === "fournisseur") && (
                <Link
                  to="/ticket/create"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-teal-400 text-white hover:bg-teal-500 text-sm font-medium"
                >
                  + Nouveau Ticket
                </Link>
              )}
            </div>
          </div>

          {/* Filtres avancés Desktop */}
          {showFilters && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Filtres avancés</h3>
                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 border border-teal-400 text-teal-400 font-medium rounded-lg hover:bg-teal-50 text-sm"
                  >
                    Appliquer
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 border border-pink-500 text-pink-500 font-medium rounded-lg hover:bg-pink-50 text-sm"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-teal-400"
                >
                  <option value="">Type de ticket</option>
                  {types.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-teal-400"
                >
                  <option value="">Statut</option>
                  <option value="ouvert">Ouvert</option>
                  <option value="ferme">Fermé</option>
                  <option value="en_cours">En cours</option>
                </select>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg text-sm focus:ring-teal-400"
                  placeholder="Date de début"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg text-sm focus:ring-teal-400"
                  placeholder="Date de fin"
                />
              </div>

              {/* Colonnes visibles - Desktop */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Colonnes à afficher</h4>
                <div className="flex flex-wrap gap-3">
                  {columnsOptions.map((col) => (
                    <label
                      key={col.value}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.value)}
                        onChange={() => {
                          setSelectedColumns((prev) =>
                            prev.includes(col.value)
                              ? prev.filter((v) => v !== col.value)
                              : [...prev, col.value]
                          );
                        }}
                        className="h-4 w-4 text-teal-400 rounded"
                      />
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 md:p-6">
          {/* Table Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedColumns.includes("date") && <TableHeader title="Date" />}
                  {selectedColumns.includes("code") && <TableHeader title="Code" />}
                  {selectedColumns.includes("title") && <TableHeader title="Titre" />}
                  {selectedColumns.includes("type") && <TableHeader title="Type" />}
                  {selectedColumns.includes("status") && <TableHeader title="Statut" />}
                  {selectedColumns.includes("assigned_to") && (
                    <TableHeader title="Assigné à" />
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTickets.length > 0 ? (
                  currentTickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTicketClick(t.id)}
                    >
                      {selectedColumns.includes("date") && (
                        <TableCell>{formatDate(t.created_at)}</TableCell>
                      )}
                      {selectedColumns.includes("code") && <TableCell>{t.code}</TableCell>}
                      {selectedColumns.includes("title") && (
                        <TableCell className="font-medium">{t.title}</TableCell>
                      )}
                      {selectedColumns.includes("type") && (
                        <TableCell>{t.type?.name}</TableCell>
                      )}
                      {selectedColumns.includes("status") && (
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                              normalize(t.status) === "ouvert"
                                ? "bg-teal-100 text-teal-400"
                                : normalize(t.status) === "ferme"
                                ? "bg-pink-100 text-pink-500"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {t.status}
                          </span>
                        </TableCell>
                      )}
                      {selectedColumns.includes("assigned_to") && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                              {t.assignee?.nom ? t.assignee.nom[0] : "U"}
                            </div>
                            <span>{t.assignee?.nom || "Non assigné"}</span>
                          </div>
                        </TableCell>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Aucun ticket trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden">
            {currentTickets.length > 0 ? (
              currentTickets.map((t) => (
                <MobileTicketCard
                  key={t.id}
                  ticket={t}
                  formatDate={formatDate}
                  normalize={normalize}
                  onTicketClick={handleTicketClick}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun ticket trouvé.
              </div>
            )}
          </div>

          {/* PAGINATION */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {currentTickets.length} sur {filteredTickets.length} tickets
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="5">5 par page</option>
                  <option value="10">10 par page</option>
                  <option value="20">20 par page</option>
                  <option value="50">50 par page</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} sur {totalPages || 1}
                </span>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer de filtres Mobile */}
      <MobileFilterDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        types={types}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        selectedColumns={selectedColumns}
        setSelectedColumns={setSelectedColumns}
        columnsOptions={columnsOptions}
        onReset={resetFilters}
        onApply={applyFilters}
      />
    </div>
  );
}