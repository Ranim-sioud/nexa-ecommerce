import React, { useEffect, useState, useMemo } from "react";
import "../../styles/commande.css";
import { Link } from "react-router-dom";
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Filter, Printer, RotateCcw, Search } from "lucide-react";
import Select from "react-select";
import api from "../../components/api";

// Types adaptés au nouveau backend
type Client = {
  prenom: string;
  nom: string;
  telephone?: string;
  adresse?: string;
  gouvernorat?: string;
};

type Media = {
  id: number;
  type: string;
  url: string;
  principale: boolean;
  cree_le?: string;
  modifie_le?: string;
}

type Produit = {
  id: number;
  nom?: string;
  prix_vente?: number;
  medias: Media[];
};

type Ligne = {
  id: number;
  id_produit?: number;
  quantite?: number;
  prix_vente: string | number;
  produit?: Produit;
};

type SousCommande = {
  id: number;
  code?: string;
  statut?: string;
  total?: string | number;
  totalAvecLivraison?: number | string;
  fraisLivraison?: number;
  commande?: {
    id?: number;
    code?: string;
    colis_fragile?: boolean;
    colis_ouvrable?: boolean;
    demande_confirmation?: boolean;
    client?: Client;
    collis_date?: string | null;
    cree_le?: string;
    sous_commandes?: any[];
  };
  lignes?: Ligne[];
  cree_le?: string;
};

type Row = {
  commandeId: number;
  sousCommandeId: number;
  client?: Client;
  date: string;
  code: string;
  produits: { nom: string; quantite: number }[];
  statut: string;
  colis_date?: string | null;
  sousCommande?: SousCommande;
};

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: 'white',
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
        },
        borderRadius: '0.375rem',
        minHeight: '42px',
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#9ca3af',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : '#1f2937',
    }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: '#eff6ff',
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: '#3b82f6',
    }),
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

function getStatusClass(statut: string) {
  let cls = statut.toLowerCase();
  cls = cls.replace(/\s+/g, "_").replace(/'/g, "");
  cls = cls.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `status-${cls}`;
}

const extractSousCommandesFromResponse = (data: any): SousCommande[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.sousCommandes)) return data.sousCommandes;
  if (Array.isArray(data.sousCommande)) return data.sousCommande;
  return [];
};

const ListeCommandeFournisseur: React.FC = () => {
  const [sousCommandes, setSousCommandes] = useState<SousCommande[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [trackingFilter, setTrackingFilter] = useState<string[]>([]);
  const [produitFilter, setProduitFilter] = useState<string[]>([]);
  const [dateCreationStart, setDateCreationStart] = useState<string>("");
  const [dateCreationEnd, setDateCreationEnd] = useState<string>("");
  const [dateCompletionStart, setDateCompletionStart] = useState<string>("");
  const [dateCompletionEnd, setDateCompletionEnd] = useState<string>("");
  const [produits, setProduits] = useState<Produit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<SousCommande[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const fetchSousCommandes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/commande/commandes`);
      const extracted = extractSousCommandesFromResponse(res.data);
      const normalized = extracted.map((sc) => {
        const frais =
          (sc as any).fraisLivraison ??
          (sc as any).frais_livraison ??
          sc.fraisLivraison ??
          (sc.commande && (sc.commande as any).frais_livraison) ??
          undefined;
        const totalAvecLiv =
          (sc as any).totalAvecLivraison ??
          (sc as any).total_avec_livraison ??
          sc.totalAvecLivraison ??
          (typeof sc.total === "number" && typeof frais === "number"
            ? sc.total + frais
            : undefined);

        return {
          ...sc,
          fraisLivraison: frais !== undefined ? Number(frais) : undefined,
          totalAvecLivraison: totalAvecLiv !== undefined ? Number(totalAvecLiv) : undefined,
        } as SousCommande;
      });

      setSousCommandes(normalized);
    } catch (err) {
      console.error("Erreur fetchSousCommandes:", err);
      setSousCommandes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newRows: Row[] = sousCommandes.map((sc) => {
      const produitsList =
        Array.isArray(sc.lignes) && sc.lignes.length > 0
          ? sc.lignes.map((l) => ({
              nom: l.produit?.nom ?? `Produit #${l.id_produit ?? "?"}`,
              quantite: l.quantite ?? 0,
            }))
          : [];

      return {
        commandeId: sc.commande?.id ?? sc.id,
        sousCommandeId: sc.id,
        client: sc.commande?.client,
        date: sc.cree_le ?? sc.commande?.cree_le ?? "",
        code: sc.code ?? sc.commande?.code ?? "—",
        produits: produitsList,
        statut: sc.statut ?? "Inconnu",
        colis_date: sc.commande?.collis_date ?? null,
        sousCommande: sc,
      };
    });

    setRows(newRows);
  }, [sousCommandes]);

  const toggle = (id: number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAll = () => {
    const all: Record<number, boolean> = {};
    filteredRows.forEach(row => all[row.sousCommandeId] = true);
    setSelected(all);
  };

  const clearAll = () => setSelected({});

  const selectedIds = Object.keys(selected)
    .filter(k => selected[parseInt(k)])
    .map(k => parseInt(k));

  const selectedItems = rows
    .filter(row => selectedIds.includes(row.sousCommandeId))
    .map(row => row.sousCommande)
    .filter(Boolean) as SousCommande[];

  const applyFilters = (data: Row[]) => {
    return data.filter((row) => {
      if (
        trackingFilter.length > 0 &&
        !trackingFilter.some((f) => row.statut.toLowerCase() === f.toLowerCase())
      ) {
        return false;
      }
  
      if (
        produitFilter.length > 0 &&
        !row.produits.some((p) =>
          produitFilter.some((f) => p.nom.toLowerCase().includes(f.toLowerCase()))
        )
      ) {
        return false;
      }
  
      const dateCreation = new Date(row.date);
      if (dateCreationStart && dateCreation < new Date(dateCreationStart)) return false;
      if (dateCreationEnd && dateCreation > new Date(dateCreationEnd)) return false;
  
      if (row.colis_date) {
        const dateCompletion = new Date(row.colis_date);
        if (dateCompletionStart && dateCompletion < new Date(dateCompletionStart)) return false;
        if (dateCompletionEnd && dateCompletion > new Date(dateCompletionEnd)) return false;
      }
  
      return true;
    });
  };
  
  const filteredRows = useMemo(() => {
    const basicFiltered = rows.filter((row) => {
      if (selectedStatus && row.statut !== selectedStatus) return false;
      const term = searchTerm.toLowerCase();
      if (term) {
        const inCode = row.code?.toLowerCase().includes(term);
        const inClient =
          row.client?.nom?.toLowerCase().includes(term) ||
          row.client?.prenom?.toLowerCase().includes(term) ||
          row.client?.telephone?.includes(term);
        const inProduits = row.produits.some((p) => p.nom.toLowerCase().includes(term));
        return inCode || inClient || inProduits;
      }
      return true;
    });
  
    return applyFilters(basicFiltered);
  }, [
    rows,
    selectedStatus,
    searchTerm,
    trackingFilter,
    produitFilter,
    dateCreationStart,
    dateCreationEnd,
    dateCompletionStart,
    dateCompletionEnd,
  ]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await api.get<SousCommande[]>("/pickup/en_attente_enlevement");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Erreur chargement sous-commandes");
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    fetchData();
  }, []);

  const createPickup = async () => {
    if (selectedIds.length === 0) return alert("Sélectionnez des sous-commandes");
    try {
      await api.post("/pickup", { sousCommandeIds: selectedIds });
      alert("Pickup créé !");
      fetchData();
      setSelected({});
    } catch (err) {
      console.error(err);
      alert("Erreur création pickup");
    }
  };

  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, itemsPerPage]);

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

  const fetchProduits = async () => {
    try {
      const res = await api.get(`/produits`);
      setProduits(res.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
    }
  };

  useEffect(() => {
    fetchSousCommandes();
    fetchProduits();
  }, []);

  const trackingCount = trackingFilter.length;
  const produitCount = produitFilter.length;
  const totalFilters = trackingCount + produitCount + 
    (dateCreationStart ? 1 : 0) + (dateCreationEnd ? 1 : 0) + 
    (dateCompletionStart ? 1 : 0) + (dateCompletionEnd ? 1 : 0);
 
  const handleResetFilters = () => {
    setTrackingFilter([]);
    setProduitFilter([]);
    setDateCreationStart("");
    setDateCreationEnd("");
    setDateCompletionStart("");
    setDateCompletionEnd("");
  };

  const handleApplyFilters = () => {
    setShowAdvancedFilters(false);
    setIsMobileFiltersOpen(false);
  };

  const produitOptions = produits.map((p) => {
    const medias = p.medias || [];
    const image = medias.find((m) => m.type?.startsWith("image"));
    const video = !image ? medias.find((m) => m.type?.startsWith("video")) : null;
  
    return {
      value: p.nom,
      label: p.nom,
      image: image ? image.url : video ? video.url : null,
      isVideo: !image && !!video,
    };
  });

  const trackingOptions = TRACKING_STATUSES.map((status) => ({
    value: status,
    label: status,
  }));

  const trackingValue = trackingFilter.map((v) => ({ value: v, label: v }));
  const produitValue = produitFilter.map((v) => ({
    value: v,
    label: produits.find(p => p.nom === v)?.nom || v
  }));

  function openPrintWindowForBoth(selectedItems: SousCommande[]) {
    const html = `
    <html>
      <head>
        <title>Étiquettes Complètes</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128+Text&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Roboto', Arial, sans-serif; 
            background: #f5f5f5;
            padding: 0;
            margin: 0;
          }
          
          .page { 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 100vh;
            page-break-after: always;
            padding: 10px;
          }
          
          .shipping-label {
            width: 380px;
            min-height: 550px;
            background: white;
            border: 2px solid #333;
            padding: 15px;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          
          .delivery-label {
            width: 400px;
            min-height: 550px;
            background: white;
            border: 2px solid #333;
            padding: 15px;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          
          .label-header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 10px;
            text-align: center;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #2c5530;
            margin-bottom: 3px;
          }
          
          .label-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }
          
          .barcode-area {
            background: #f8f8f8;
            border: 1px dashed #999;
            padding: 10px 15px;
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 128 Text', monospace;
            font-size: 30px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .barcode-text {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            text-align: center;
            margin-top: 3px;
            color: #333;
          }
          
          .address-box {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 8px;
            margin: 8px 0;
            font-size: 11px;
            line-height: 1.3;
          }
          
          .handling-stamps {
            display: flex;
            justify-content: center;
            margin: 8px 0;
            flex-wrap: wrap;
            gap: 4px;
          }
          
          .stamp {
            border: 1px solid;
            padding: 3px 6px;
            font-weight: 700;
            font-size: 9px;
            transform: rotate(-5deg);
          }
          
          .stamp-fragile { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
          .stamp-ouvrable { border-color: #d97706; color: #d97706; background: #fffbeb; }
          .stamp-urgent { border-color: #059669; color: #059669; background: #f0fdf4; }
          
          .shipping-info {
            background: #e8f5e8;
            padding: 6px;
            font-size: 9px;
            text-align: center;
            margin: 8px 0;
            border-radius: 3px;
          }
          
          .footer {
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 6px;
            margin-top: auto;
          }
          
          .section {
            margin-bottom: 8px;
          }
          
          .section-title {
            font-weight: 600;
            color: #2c5530;
            font-size: 11px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            font-size: 10px;
          }
          
          .info-item {
            margin-bottom: 3px;
          }
          
          .info-label {
            font-weight: 600;
            color: #666;
            display: inline-block;
            min-width: 75px;
          }
          
          .products-table-compact {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin: 5px 0;
          }
          
          .products-table-compact th {
            background: #f0f0f0;
            padding: 3px 2px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: 600;
          }
          
          .products-table-compact td {
            padding: 2px;
            border: 1px solid #ddd;
          }
          
          .products-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin: 6px 0;
          }
          
          .products-table th {
            background: #f0f0f0;
            padding: 4px 3px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: 600;
          }
          
          .products-table td {
            padding: 3px;
            border: 1px solid #ddd;
          }
          
          .signature-section {
            margin-top: 10px;
            border: 1px solid #333;
            padding: 8px;
            background: #fafafa;
          }
          
          .signature-title {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            color: #2c5530;
          }
          
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .signature-field {
            margin-bottom: 8px;
          }
          
          .signature-line {
            border-bottom: 1px dashed #333;
            height: 18px;
            margin-bottom: 3px;
          }
          
          .signature-label {
            font-size: 8px;
            color: #666;
            text-align: center;
          }
          
          .signature-area-large {
            margin: 12px 0;
            border: 1px dashed #333;
            height: 40px;
            position: relative;
            background: white;
          }
          
          .signature-dots {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(circle, #999 1px, transparent 1px);
            background-size: 8px 8px;
            opacity: 0.3;
          }
          
          .signature-instructions {
            text-align: center;
            font-size: 8px;
            color: #666;
            margin-top: 3px;
          }
          
          .signature-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 8px;
          }
          
          .stamp-area {
            border: 1px dashed #333;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #666;
            background: white;
          }
          
          .delivery-instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 6px;
            margin: 8px 0;
            font-size: 9px;
            border-radius: 3px;
          }
          
          .contact-info {
            background: #e8f5e8;
            padding: 6px;
            border-radius: 3px;
            font-size: 9px;
            margin: 6px 0;
            text-align: center;
          }
          
          .confirmation-notice {
            background: #e0f2fe;
            border: 1px solid #7dd3fc;
            padding: 6px;
            margin: 6px 0;
            border-radius: 3px;
            font-size: 9px;
            text-align: center;
          }
          
          .verification-section {
            margin: 8px 0;
            padding: 6px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            font-size: 9px;
          }
          
          .verification-item {
            display: flex;
            align-items: center;
            margin-bottom: 3px;
          }
          
          .verification-checkbox {
            width: 10px;
            height: 10px;
            border: 1px solid #333;
            margin-right: 6px;
            display: inline-block;
          }
          
          @media print {
            body { 
              background: white; 
              padding: 0; 
              margin: 0;
            }
            .page { 
              display: flex !important;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              page-break-after: always;
              margin: 0;
              padding: 10px;
            }
            .shipping-label, .delivery-label { 
              box-shadow: none;
              border: 2px solid #333;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${selectedItems.map(si => {
          const frais = typeof si.fraisLivraison === "number" ? si.fraisLivraison : 0;
          const totalAvec = typeof si.totalAvecLivraison === "number"
              ? si.totalAvecLivraison
              : (typeof si.total === "number" ? si.total + frais : si.total);
              
          const isFragile = si.commande?.colis_fragile || false;
          const isOuvrable = si.commande?.colis_ouvrable || false;
          const needsConfirmation = si.commande?.demande_confirmation || false;
          
          const stamps = [];
          if (isFragile) stamps.push({ type: 'fragile', text: 'FRAGILE' });
          if (isOuvrable) stamps.push({ type: 'ouvrable', text: 'OUVRABLE' });
          stamps.push({ type: 'urgent', text: 'URGENT' });
          
          return `
            <!-- ÉTIQUETTE COLIS -->
            <div class="page">
              <div class="shipping-label">
                <div class="label-header">
                  <div class="company-name">LOGISTICS PRO</div>
                  <div class="label-title">ÉTIQUETTE COLIS</div>
                </div>
                
                <div class="barcode-area">
                  *${si.code}*
                </div>
                <div class="barcode-text">${si.code}</div>
                
                ${stamps.length > 0 ? `
                <div class="handling-stamps">
                  ${stamps.map(stamp => `
                    <div class="stamp stamp-${stamp.type}">${stamp.text}</div>
                  `).join('')}
                </div>
                ` : ''}
                
                <div class="section">
                  <div class="section-title">DESTINATAIRE</div>
                  <div class="address-box">
                    <strong>${si.commande?.client ? si.commande.client.prenom + ' ' + si.commande.client.nom : 'NON RENSEIGNÉ'}</strong><br/>
                    ${si.commande?.client?.adresse || 'ADRESSE NON RENSEIGNÉE'}<br/>
                    ${si.commande?.client?.telephone ? 'Tél: ' + si.commande.client.telephone : ''}
                  </div>
                </div>
                
                <div class="section">
                  <div class="section-title">INFORMATIONS COMMANDE</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Commande:</span> ${si.commande?.code || '-'}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Sous-cde:</span> ${si.code}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date:</span> ${new Date().toLocaleDateString('fr-FR')}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Colis:</span> 1/1
                    </div>
                  </div>
                </div>

                ${si.lignes && si.lignes.length > 0 ? `
                <div class="section">
                  <div class="section-title">ARTICLES (${si.lignes.length})</div>
                  <table class="products-table-compact">
                    <thead>
                      <tr>
                        <th>Réf.</th>
                        <th>Produit</th>
                        <th style="text-align: center;">Qté</th>
                        <th style="text-align: right;">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${si.lignes.slice(0, 6).map(ligne => `
                        <tr>
                          <td style="font-family: 'Courier New', monospace;">${ligne.id_produit}</td>
                          <td>${ligne.produit?.nom || `Produit ${ligne.id_produit}`}</td>
                          <td style="text-align: center;">${ligne.quantite}</td>
                          <td style="text-align: right;">${typeof ligne.prix_vente === 'number' ? ligne.prix_vente.toFixed(2) + 'TND' : ligne.prix_vente}</td>
                        </tr>
                      `).join('')}
                      ${si.lignes.length > 6 ? `
                        <tr>
                          <td colspan="4" style="text-align: center; font-style: italic; font-size: 7px;">
                            ... et ${si.lignes.length - 6} autre(s) article(s)
                          </td>
                        </tr>
                      ` : ''}
                      <tr class="total-row">
                        <td colspan="3" style="text-align:right;font-size:10px;">Frais de livraison</td>
                        <td style="text-align:right;font-size:10px;">${si.fraisLivraison.toFixed(2)} TND</td>
                      </tr>
                      <tr style="border-top: 1px solid #333; font-weight: bold;">
                        <td colspan="3" style="text-align: right; padding: 3px 2px;">TOTAL:</td>
                        <td style="text-align: right; padding: 3px 2px;">${typeof si.totalAvecLivraison === 'number' ? si.totalAvecLivraison.toFixed(2) + 'TND' : si.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                ` : ''}
                
                <div class="shipping-info">
                  🕒 Livraison prévue • ⚠ Ne pas plier
                </div>
                
                <div class="footer">
                  Éditée le ${new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            
            <!-- BON DE LIVRAISON -->
            <div class="page">
              <div class="delivery-label">
                <div class="label-header">
                  <div class="company-name">LOGISTICS PRO</div>
                  <div style="font-size: 14px; font-weight: 600;">BON DE LIVRAISON</div>
                </div>
                
                <div class="barcode-area">*${si.code}*</div>
                <div class="barcode-text">${si.code}</div>
                
                <div class="section">
                  <div class="section-title">INFORMATIONS LIVRAISON</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">N° Commande:</span> ${si.commande?.code || '-'}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Sous-commande:</span> ${si.code}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date:</span> ${new Date().toLocaleDateString('fr-FR')}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Heure:</span> ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
                
                ${stamps.length > 0 ? `
                <div class="handling-stamps">
                  ${stamps.map(stamp => `<div class="stamp stamp-${stamp.type}">${stamp.text}</div>`).join('')}
                </div>
                ` : ''}
                
                ${needsConfirmation ? `
                <div class="confirmation-notice">
                  <strong>⚠ CONFIRMATION REQUISE:</strong> Le client doit confirmer la réception
                </div>
                ` : ''}
                
                <div class="section">
                  <div class="section-title">DESTINATAIRE</div>
                  <div class="info-item">
                    <span class="info-label">Nom:</span> ${si.commande?.client ? si.commande.client.prenom + ' ' + si.commande.client.nom : '-'}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Téléphone:</span> ${si.commande?.client?.telephone || '-'}
                  </div>
                  <div class="address-box">
                    <strong>Adresse de livraison:</strong><br/>
                    ${si.commande?.client?.adresse || 'Adresse non spécifiée'}
                  </div>
                </div>
                
                ${si.lignes && si.lignes.length > 0 ? `
                <div class="section">
                  <div class="section-title">DÉTAIL DES ARTICLES (${si.lignes.length})</div>
                  <table class="products-table">
                    <thead>
                      <tr>
                        <th>Réf.</th>
                        <th>Produit</th>
                        <th style="text-align: center;">Qté</th>
                        <th style="text-align: right;">Prix unit.</th>
                        <th style="text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                        ${si.lignes.map(ligne => {
                        const prixUnitaire = typeof ligne.prix_vente === 'number' ? ligne.prix_vente : parseFloat(ligne.prix_vente) || 0;
                        const totalLigne = prixUnitaire * (ligne.quantite || 0);
                        return `
                          <tr>
                            <td style="font-family: 'Courier New', monospace;">${ligne.id_produit}</td>
                            <td>${ligne.produit?.nom || `Produit ${ligne.id_produit}`}</td>
                            <td style="text-align: center;">${ligne.quantite}</td>
                            <td style="text-align: right;">${prixUnitaire.toFixed(2)}TND</td>
                            <td style="text-align: right;">${totalLigne.toFixed(2)}TND</td>
                          </tr>
                        `;
                      }).join('')}
                      <tr class="total-row">
                        <td colspan="4" style="text-align:right;font-size:10px;">Frais de livraison</td>
                        <td style="text-align:right;font-size:10px;">${si.fraisLivraison.toFixed(2)} TND</td>
                      </tr>
                      <tr style="border-top: 2px solid #333; font-weight: bold;">
                        <td colspan="4" style="text-align: right; padding: 6px 4px;">TOTAL COMMANDE:</td>
                        <td style="text-align: right; padding: 6px 4px;">${typeof si.totalAvecLivraison === 'number' ? si.totalAvecLivraison.toFixed(2) + 'TND' : si.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                ` : ''}
                
                <div class="delivery-instructions">
                  <strong>Instructions spéciales:</strong> Vérifier l'état du colis avant signature.
                  ${isFragile ? '<br>📦 <strong>Colis fragile</strong> - Manipuler avec précaution' : ''}
                  ${isOuvrable ? '<br>🔓 <strong>Colis ouvrable</strong> - Peut être ouvert pour vérification' : ''}
                </div>

                <div class="verification-section">
                  <div class="section-title">VÉRIFICATION AVANT SIGNATURE</div>
                  <div class="verification-item">
                    <span class="verification-checkbox"></span>
                    Colis reçu en bon état
                  </div>
                  <div class="verification-item">
                    <span class="verification-checkbox"></span>
                    Emballage intact et non altéré
                  </div>
                  <div class="verification-item">
                    <span class="verification-checkbox"></span>
                    Contenu conforme à la commande
                  </div>
                </div>
                
                <div class="signature-section">
                  <div class="signature-title">BON POUR RÉCEPTION</div>
                  
                  <div class="signature-grid">
                    <div class="signature-field">
                      <div class="signature-line"></div>
                      <div class="signature-label">Nom du destinataire</div>
                    </div>
                    
                    <div class="signature-field">
                      <div class="signature-line"></div>
                      <div class="signature-label">Date</div>
                    </div>
                  </div>
                  
                  <div class="signature-area-large">
                    <div class="signature-dots"></div>
                  </div>
                  <div class="signature-instructions">Signature du client</div>
                  
                  <div class="signature-footer">
                    <div class="signature-field">
                      <div class="signature-line"></div>
                      <div class="signature-label">Heure</div>
                    </div>
                    
                    <div class="stamp-area">
                      Cachet entreprise
                    </div>
                  </div>
                </div>
                
                <div class="footer">
                  Document émis le ${new Date().toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
        <script>
          setTimeout(() => { 
            window.print(); 
            setTimeout(() => { window.close(); }, 500);
          }, 500);
        </script>
      </body>
    </html>
  `;

    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) {
      alert("Popup bloquée — autorise les popups pour imprimer.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      alert("Sélectionnez une ou plusieurs sous-commandes à imprimer.");
      return;
    }
    openPrintWindowForBoth(selectedItems);
  };

  return (
    <div className="list-page-container">
      <div className="list-header">
        <h2 className="list-title">
          <i className="fas fa-boxes-stacked"></i> Commandes
        </h2>
        
        {/* Version desktop - Exactement comme votre code original */}
        <div className="hidden md:block md:p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Section Gauche: Recherche et Filtres */}
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="w-full md:w-64 pl-4 pr-10 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50 transition duration-150">
                <Search size={18} className="text-gray-700" />
                <span className="text-base font-medium text-gray-800">Rechercher</span>
              </button>
              
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-md shadow-sm transition duration-150
                  ${showAdvancedFilters ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
              >
                <Filter size={18} />
                <span className="text-base font-medium">Filtrer</span>
              </button>
            </div>
            
            {/* Section Droite: Actions */}
            <div className="flex items-center gap-2">
              <button
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50 transition duration-150"
                onClick={createPickup} 
                disabled={selectedIds.length === 0}
              >
                <FileDown size={18} className="text-gray-800" /> 
                <span className="text-base font-medium text-gray-800">
                  Créer Pickup ({selectedIds.length})
                </span>
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50 transition duration-150"
                onClick={handlePrint}
              >
                <Printer size={18} className="text-gray-800" />
                <span className="text-base font-medium text-gray-800">
                  Imprimer ({selectedIds.length})
                </span>
              </button>
            </div>
          </div>
          
          {/* PANNEAU DE FILTRES AVANCÉS - Version desktop */}
          {showAdvancedFilters && (
                <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    
                    {/* En-tête des filtres avancés */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Filter size={20} className="text-gray-700" />
                                <h3 className="text-lg font-semibold text-gray-900">Filtres Avancés</h3>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Vous pouvez utiliser les filtres avancés pour filtrer les données en fonction de plusieurs critères.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleApplyFilters}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition duration-150"
                            >
                                <Filter size={18} className="text-gray-700" />
                                <span className="text-base font-medium text-gray-800">Appliquer</span>
                            </button>
                            <button 
                                onClick={handleResetFilters}
                                className="flex items-center gap-2 px-4 py-2 border border-transparent bg-pink-600 text-white rounded-md hover:bg-pink-700 transition duration-150"
                            >
                                <RotateCcw size={18} />
                                <span className="text-base font-medium">Réinitialiser</span>
                            </button>
                        </div>
                    </div>  
                    {/* Grille des filtres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Filtre Tracking */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking</label>
                            <Select
                                isMulti
                                options={trackingOptions}
                                styles={customSelectStyles}
                                onChange={(options) =>
                                    setTrackingFilter(options ? options.map((o) => o.value) : [])
                                }
                                value={trackingValue}
                                placeholder="Sélectionnez un statut..."
                            />
                            {trackingCount > 0 &&
                            <span className="text-sm font-medium text-blue-700">
                              {trackingCount} filtre(s) appliqué(s) 
                            </span>
                            }
                        </div>  
                        {/* Filtre Produit(s) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Produit(s) de la commande</label>
                            <Select
                              isMulti
                              options={produitOptions}
                              styles={customSelectStyles}
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
                                        className="w-7 h-7 rounded-md object-cover"
                                        muted
                                      />
                                    ) : (
                                      <img
                                        src={option.image}
                                        className="w-7 h-7 rounded-md object-cover"
                                      />
                                    )
                                  ) : (
                                    <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                      ?
                                    </div>
                                  )}
                                  <span>{option.label}</span>
                                </div>
                              )}
                            />
                            {produitCount > 0 &&
                            <span className="text-sm font-medium text-blue-700">
                              {produitCount} filtre(s) appliqué(s) 
                            </span>
                            }
                        </div>  
                        {/* Filtres Date de Création (Adapté) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                            {/* NOTE: Les captures montrent un DateRangePicker. C'est complexe.
                                J'utilise vos <input type="date"> existants, mais stylisés. */}
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                   <label className="text-xs text-gray-500">Du</label>
                                   <input 
                                       type="date" 
                                       value={dateCreationStart} 
                                       onChange={(e) => setDateCreationStart(e.target.value)}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   />
                               </div>
                               <div className="space-y-1">
                                   <label className="text-xs text-gray-500">Au</label>
                                   <input 
                                       type="date" 
                                       value={dateCreationEnd} 
                                       onChange={(e) => setDateCreationEnd(e.target.value)}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   />
                               </div>
                            </div>
                        </div>  
                        {/* Filtres Date de Complétion (Adapté) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de complétion</label>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                   <label className="text-xs text-gray-500">Du</label>
                                   <input 
                                       type="date" 
                                       value={dateCompletionStart} 
                                       onChange={(e) => setDateCompletionStart(e.target.value)}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   />
                               </div>
                               <div className="space-y-1">
                                   <label className="text-xs text-gray-500">Au</label>
                                   <input 
                                       type="date" 
                                       value={dateCompletionEnd} 
                                       onChange={(e) => setDateCompletionEnd(e.target.value)}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   />
                               </div>
                            </div>
                        </div>  
                        {/* Colonnes à afficher (Manquant dans votre code, ajouté depuis la capture) */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes à afficher</label>
                             <Select
                                // isMulti
                                // options={...}
                                styles={customSelectStyles}
                                // onChange={...}
                                // value={...}
                                placeholder="Sélectionnez les colonnes..."
                            />
                        </div>  
                    </div>  
                    {/* Pied de page des filtres */}
                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <span className="text-sm font-medium text-blue-700">
                            {totalFilters} filtre(s) appliqué(s)
                        </span>
                    </div>  
                </div>
            )}
        </div>

        {/* Version mobile - Barre d'outils simplifiée */}
        <div className="md:hidden px-4 pb-4">
          <div className="flex flex-col space-y-3">
            {/* Barre de recherche mobile */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <button 
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className={`px-3 py-2.5 border rounded-lg transition duration-150 ${
                  isMobileFiltersOpen ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-300'
                }`}
              >
                <Filter size={18} className={isMobileFiltersOpen ? 'text-blue-600' : 'text-gray-600'} />
              </button>
            </div>
            
            {/* Actions mobiles */}
            <div className="flex items-center gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition duration-150"
                onClick={createPickup} 
                disabled={selectedIds.length === 0}
              >
                <FileDown size={16} className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-700'} />
                <span className={`text-sm font-medium ${selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                  Pickup ({selectedIds.length})
                </span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition duration-150"
                onClick={handlePrint}
                disabled={selectedIds.length === 0}
              >
                <Printer size={16} className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-700'} />
                <span className={`text-sm font-medium ${selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                  Imprimer ({selectedIds.length})
                </span>
              </button>
            </div>
          </div>

          {/* Panneau de filtres mobile */}
          {isMobileFiltersOpen && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtres</h3>
                <button 
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 text-white rounded-md text-sm"
                >
                  <RotateCcw size={14} />
                  Réinitialiser
                </button>
              </div>

              <div className="space-y-4">
                {/* Filtre Tracking mobile simplifié */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    multiple
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setTrackingFilter(values);
                    }}
                  >
                    {TRACKING_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre Produits mobile simplifié */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Produits</label>
                  <select
                    multiple
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setProduitFilter(values);
                    }}
                  >
                    {produits.map(p => (
                      <option key={p.id} value={p.nom}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtres Date mobile */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date création</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={dateCreationStart} 
                      onChange={(e) => setDateCreationStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Du"
                    />
                    <input 
                      type="date" 
                      value={dateCreationEnd} 
                      onChange={(e) => setDateCreationEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Au"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date complétion</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={dateCompletionStart} 
                      onChange={(e) => setDateCompletionStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Du"
                    />
                    <input 
                      type="date" 
                      value={dateCompletionEnd} 
                      onChange={(e) => setDateCompletionEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Au"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleApplyFilters();
                  }}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium"
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des sous-commandes...</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-box-open empty-icon"></i>
          <h3>Aucune sous-commande trouvée</h3>
          <p>Aucune correspondance pour votre filtre ou recherche.</p>
        </div>
      ) : (
        <>
          {/* Version desktop - Tableau complet */}
          <div className="hidden md:block table-wrapper">
            <table className="commandes-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      onChange={() => filteredRows.length === selectedIds.length ? clearAll() : selectAll()}
                      checked={filteredRows.length > 0 && filteredRows.length === selectedIds.length}
                    />
                  </th>
                  <th>Date</th>
                  <th>Code</th>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Gouvernorat</th>
                  <th>Produits</th>
                  <th className="th-center">Statut</th>
                  <th>Colis daté</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((row) => (
                  <tr key={row.sousCommandeId} className={selected[row.sousCommandeId] ? "selected" : ""}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={!!selected[row.sousCommandeId]}
                        onChange={() => toggle(row.sousCommandeId)}
                      />
                    </td>
                    <td className="td-date">
                      <span>{new Date(row.date).toLocaleDateString("fr-FR")}</span>
                      <small>
                        {new Date(row.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </td>
                    <td className="td-code">{row.code}</td>
                    <td className="td-client">
                      <span>{row.client?.nom}</span>
                      <small>{row.client?.prenom}</small>
                    </td>
                    <td>{row.client?.telephone}</td>
                    <td>{row.client?.gouvernorat}</td>
                    <td className="td-produits">
                      {row.produits.length > 0
                        ? `${row.produits[0].nom} (x${row.produits.length})`
                        : "—"}
                    </td>
                    <td className="td-status">
                      <span className={`status-badge ${getStatusClass(row.statut)}`}>
                        {row.statut.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {row.colis_date ? (
                        <>
                          <span>{new Date(row.colis_date).toLocaleDateString("fr-FR")}</span>
                          <small>
                            {new Date(row.colis_date).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </>
                      ) : "-"}
                    </td>
                    <td className="td-actions">
                      <Link
                        to={`/CommandeDetailsFournisseur/${row.sousCommandeId}`}
                        className="btn-details"
                      >
                        <i className="fas fa-eye"></i>
                        <span>Détails</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version mobile - Cartes commandes */}
          <div className="md:hidden space-y-3 px-4">
            {currentItems.map((row) => (
              <div 
                key={row.sousCommandeId} 
                className={`bg-white rounded-lg border ${
                  selected[row.sousCommandeId] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } p-4 shadow-sm`}
              >
                {/* En-tête avec checkbox et code */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={!!selected[row.sousCommandeId]}
                      onChange={() => toggle(row.sousCommandeId)}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{row.code}</span>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        {new Date(row.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusClass(row.statut)} text-xs px-2 py-1`}>
                    {row.statut.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Infos client */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 w-20">Client:</span>
                    <span className="text-gray-900">{row.client?.nom} {row.client?.prenom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 w-20">Contact:</span>
                    <span className="text-gray-600">{row.client?.telephone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 w-20">Gouv.:</span>
                    <span className="text-gray-600">{row.client?.gouvernorat || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 w-20">Produits:</span>
                    <div className="flex-1">
                      {row.produits.length > 0 ? (
                        <>
                          <span className="text-gray-900">{row.produits[0].nom}</span>
                          {row.produits.length > 1 && (
                            <span className="text-xs text-gray-500 block mt-0.5">
                              +{row.produits.length - 1} autre(s)
                            </span>
                          )}
                        </>
                      ) : '—'}
                    </div>
                  </div>
                  {row.colis_date && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-20">Colis daté:</span>
                      <span className="text-xs text-gray-600">
                        {new Date(row.colis_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                  <Link
                    to={`/CommandeDetailsFournisseur/${row.sousCommandeId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-400 text-white rounded-lg text-sm hover:bg-teal-700 transition"
                  >
                    <i className="fas fa-eye"></i>
                    <span>Détails</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Version desktop (inchangée) */}
          <div className="lg:hidden md:block pagination-container">
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
                </select>
              </div>
          
              <div className="lg:hidden pagination-info">
                <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>-{" "}
                <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> sur{" "}
                <strong>{totalItems}</strong>
              </div>
          
              <div className="lg:hidden pagination-buttons">
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
                      currentPage === page ? "pagination-active" : "pagination-disabled"
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
          
              <div className="lg:hidden page-jump">
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

          {/* Pagination - Version mobile simplifiée */}
          <div className="md:hidden px-4 py-4 flex items-center justify-between bg-white border-t border-gray-200 mt-4">
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <span className="text-sm text-gray-600">
                / {totalItems}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ListeCommandeFournisseur;