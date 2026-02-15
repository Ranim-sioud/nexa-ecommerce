import { useEffect, useState, useCallback } from "react";
import "./PickupPage.css";
import { Search, Truck, ChevronsRight, ChevronLeft, ChevronsLeft, ChevronRight } from "lucide-react";
import api from "../../components/api";

// --- NOUVEAU COMPOSANT DE PAGINATION ---
function PaginationControls({ total, limit, setLimit, page, setPage, loading }) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Logique pour déterminer la plage de pages visibles (inchangée)
    const getPaginationRange = () => {
        const pages = [];
        const maxVisiblePages = 5; // Similaire à la logique de la 2ème pagination
        let start = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let end = Math.min(totalPages, start + maxVisiblePages - 1);

        if (end - start + 1 < maxVisiblePages) {
             start = Math.max(1, end - maxVisiblePages + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return { pages, start, end };
    };

    const { pages: pageNumbers, start, end } = getPaginationRange();

    

    return (
        // Conteneur adapté au style du 2ème composant
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
            
            {/* 1. Bloc d'information (gauche) : Utilisation des stats plus complètes de la première version */}
            <div className="items-per-page">
                      <label htmlFor="limit" className="items-per-page-label">
                        Lignes:
                      </label>
                      <select
                        id="limit"
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1);
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
                    {/* Informations */}
                    <div className="pagination-info">
                      <strong>{(page - 1) * limit + 1}</strong>-{" "}
                      <strong>{Math.min(page * limit, total)}</strong> sur{" "}
                      <strong>{totalPages}</strong>
                    </div>
            
            {/* 2. Contrôles de pagination (droite) */}
            <div className="flex items-center space-x-2">
                
                {/* Icône Début (<<) */}
                <button
                    onClick={() => setPage(1)} // Aller à la première page
                    disabled={!hasPrev || loading}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-150"
                >
                    <ChevronsLeft size={16} />
                </button>

                {/* Icône Précédent (<) */}
                <button
                    onClick={() => setPage(page - 1)}
                    disabled={!hasPrev || loading}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-150"
                >
                    <ChevronLeft size={16} />
                </button>
                
                {/* Numéros de page */}
                <nav className="flex space-x-1" aria-label="Pagination">
                    
                    {/* Afficher ... si des pages sont masquées au début */}
                    {start > 1 && (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-400">
                            ...
                        </span>
                    )}

                    {pageNumbers.map(num => (
                        <button
                            key={num}
                            onClick={() => setPage(num)}
                            disabled={loading}
                            // Style du 2ème composant : bordures, bleu pour l'actif
                            className={`px-3 py-1 rounded border text-sm transition duration-150 ${
                                num === page
                                    ? " text-gray-700 border-gray-400 "
                                    : "border-gray-300 hover:bg-gray-50 text-gray-300"
                            }`} 
                        >
                            {num}
                        </button>
                    ))}

                    {/* Afficher ... si des pages sont masquées à la fin */}
                    {end < totalPages && ( 
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-400">
                            ...
                        </span>
                    )}
                </nav>
                
                {/* Icône Suivant (>) */}
                <button
                    onClick={() => setPage(page + 1)}
                    disabled={!hasNext || loading}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-150"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Icône Fin (>>) */}
                <button
                    onClick={() => setPage(totalPages)} // Aller à la dernière page
                    disabled={!hasNext || loading}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-150"
                >
                    <ChevronsRight size={16} />
                </button>

            </div>
        </div>
    );
}

// --- COMPOSANT PRINCIPAL (PICKUPSPAGE) ---

export default function PickupsPage() {
    const [pickups, setPickups] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [total, setTotal] = useState(0);

    // Utilisez useCallback pour mémoriser la fonction de récupération, car elle est une dépendance de useEffect
    const fetchPickups = useCallback(async () => {
        try {
            if (!limit) {
              console.warn("⚠️ limit non défini, utilisation du fallback à 5");
              return;
            }
            setLoading(true);
            const res = await api.get(
                `/pickup?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`
            );
            setPickups(res.data.pickups || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error("fetchPickups error:", err);
            alert("Erreur chargement pickups");
        } finally {
            setLoading(false);
        }
    }, [page, limit, q]); // Dépend de la page, du limit et de la requête de recherche 'q'

    useEffect(() => {
        fetchPickups();
    }, [fetchPickups]); // Déclenche le chargement lors du changement de fetchPickups (donc de page ou de 'q')

    // Ajout d'un handler pour la recherche pour réinitialiser la page à 1
    const handleSearch = () => {
        setPage(1); // Très important : réinitialiser la page lors d'une nouvelle recherche
        // fetchPickups sera appelé via l'useEffect car 'q' a changé
    };

    // ... (Le reste des fonctions toggle, clearAll, selectAll, selectedIds, fetchPickupDetail, handlePrintSelected, buildPrintHtml reste inchangé) ...
    
    // Le reste du code est conservé pour la clarté, mais nous nous concentrons sur la pagination.
    const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    const clearAll = () => setSelected({});
    const selectAll = () => {
        const all = {};
        pickups.forEach((p) => (all[p.id] = true));
        setSelected(all);
    };

    const selectedIds = Object.keys(selected)
        .filter((k) => selected[parseInt(k)])
        .map((k) => parseInt(k));

    // Fonction de récupération des détails (inchangée)
    async function fetchPickupDetail(pickupId) {
        const res = await api.get(`/pickup/${pickupId}`);
        return res.data;
    }

    // Fonction d'impression (inchangée)
    const handlePrintSelected = async () => {
        if (selectedIds.length === 0) return alert("Sélectionnez un ou plusieurs pickups à imprimer.");
        try {
            setLoading(true);
            const details = await Promise.all(selectedIds.map((id) => fetchPickupDetail(id)));
            const html = buildPrintHtml(details);
            const w = window.open("", "_blank", "width=1000,height=800");
            if (!w) return alert("Popup bloquée — autorisez les popups pour imprimer.");
            w.document.open();
            w.document.write(html);
            w.document.close();
        } catch (err) {
            console.error("handlePrintSelected:", err);
            alert("Erreur préparation impression");
        } finally {
            setLoading(false);
        }
    };
    
    // Fonction buildPrintHtml (inchangée, raccourcie ici pour ne pas encombrer)
    function buildPrintHtml(items) {
        // ... (votre fonction buildPrintHtml complète ici)
        // [Votre fonction buildPrintHtml complète et complexe est omise ici pour la concision]
        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
            
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            
            body { 
              font-family: 'Inter', sans-serif; 
              background: #ffffff; 
              color: #374151;
              font-size: 12px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
            }
            
            .page { 
              background: white; 
              width: 210mm; 
              min-height: 297mm;
              margin: 8mm auto;
              padding: 12mm;
              position: relative;
              border: 2px solid #000000;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 12px;
              margin-bottom: 20px;
              border-bottom: 2px solid #000000;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-logo {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
            }
            
            .company-name {
              font-weight: 600;
              font-size: 18px;
              color: #111827;
              letter-spacing: -0.25px;
            }
            
            .company-details {
              font-size: 11px;
              color: #6b7280;
              line-height: 1.3;
            }
            
            .document-info {
              text-align: right;
              padding: 8px 12px;
              border-radius: 4px;
              border: 2px solid #000000;
              background: #ffffff;
              min-width: 180px;
            }
            
            .document-title {
              font-weight: 600;
              font-size: 14px;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .document-meta {
              font-size: 10px;
              color: #6b7280;
            }
            
            .document-meta b {
              color: #374151;
            }
            
            .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .info-card {
              background: #ffffff;
              border: 2px solid #000000;
              border-radius: 4px;
              padding: 10px 12px;
            }
            
            .info-card h3 {
              font-weight: 600;
              font-size: 11px;
              color: #000000;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border-bottom: 1px solid #000000;
              padding-bottom: 2px;
            }
            
            .section-title {
              font-weight: 600;
              color: #000000;
              font-size: 13px;
              padding-left: 0;
              margin: 20px 0 12px 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border-bottom: 2px solid #000000;
              padding-bottom: 4px;
            }
            
            .sub-commande-card {
              border: 2px solid #000000;
              border-radius: 4px;
              margin-bottom: 15px;
              overflow: hidden;
              background: white;
            }
            
            .sub-commande-header {
              background: #000000;
              color: #ffffff;
              padding: 8px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000000;
            }
            
            .sub-commande-code {
              font-weight: 500;
              font-size: 12px;
            }
            
            .sub-commande-status {
              background: #ffffff;
              color: #000000;
              padding: 2px 6px;
              border-radius: 2px;
              font-size: 10px;
              font-weight: 500;
              border: 1px solid #000000;
            }
            
            .sub-commande-body {
              padding: 12px;
            }
            
            .client-info {
              background: #f8f8f8;
              border: 1px solid #000000;
              border-radius: 3px;
              padding: 8px 10px;
              margin-bottom: 12px;
              font-size: 11px;
            }
            
            .client-name {
              font-weight: 600;
              color: #000000;
              margin-bottom: 2px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 11px;
              border: 2px solid #000000;
            }
            
            th {
              background: #000000;
              color: #ffffff;
              font-weight: 500;
              padding: 8px 6px;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border: 1px solid #000000;
            }
            
            td {
              border: 1px solid #000000;
              padding: 8px 6px;
              vertical-align: top;
            }
            
            tr:nth-child(even) {
              background: #f8f8f8;
            }
            
            .total-row td {
              font-weight: 600;
              background: #e8e8e8;
              border: 1px solid #000000;
            }
            
            .grand-total {
              text-align: right;
              margin-top: 15px;
              padding: 12px;
              background: #000000;
              color: #ffffff;
              border-radius: 4px;
              font-weight: 600;
              font-size: 13px;
              border: 2px solid #000000;
            }
            
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              margin-top: 40px;
            }
            
            .signature-box {
              text-align: center;
              border: 2px solid #000000;
              border-radius: 4px;
              padding: 15px 10px 10px 10px;
            }
            
            .signature-line {
              border-top: 2px solid #000000;
              margin-top: 30px;
              width: 80%;
              margin-left: auto;
              margin-right: auto;
            }
            
            .signature-label {
              margin-top: 6px;
              font-size: 10px;
              color: #000000;
              font-weight: 500;
            }
            
            .footer {
              position: absolute;
              bottom: 12mm;
              left: 0;
              width: 100%;
              text-align: center;
              font-size: 9px;
              color: #000000;
              padding: 8px 12mm;
              border-top: 2px solid #000000;
              background: #f8f8f8;
            }
            
            .barcode {
              margin-top: 3px;
              font-family: 'Libre Barcode 128', cursive;
              font-size: 20px;
              letter-spacing: 1px;
              color: #000000;
            }
            
            .light-text {
              color: #6b7280;
            }
            
            .compact-row {
              margin-bottom: 6px;
              padding: 2px 0;
            }
            
            .divider {
              border-top: 1px solid #000000;
              margin: 8px 0;
            }
            
            @media print {
              body { 
                background: white; 
                margin: 0; 
              }
              .page { 
                margin: 0; 
                page-break-after: always;
                border: 2px solid #000000;
              }
            }
            
            @page {
              margin: 0;
              size: A4;
            }
        `;
        
        const htmlBody = items.map(({ pickup, sousCommandes }) => {
            const meta = pickup.meta || {};
            let totalPickup = 0;

            const sousCommandesHtml = sousCommandes.map(sc => {
              const lignesHtml = sc.lignes?.map(l => {
                const prix = parseFloat(l.prix_vente) || 0;
                const total = prix * (l.quantite || 0);
                return `
                  <tr>
                    <td>${l.produit?.reference || "-"}</td>
                    <td>${l.produit?.nom || "Produit"}</td>
                    <td style="text-align:center;">${l.quantite || 0}</td>
                    <td style="text-align:right;">${prix.toFixed(2)} TND</td>
                    <td style="text-align:right;">${total.toFixed(2)} TND</td>
                  </tr>
                `;
              }).join("") || "";

              const totalSousCommande = parseFloat(sc.totalAvecLivraison) || parseFloat(sc.total) || 0;
              totalPickup += totalSousCommande;

              return `
                <div class="sub-commande-card">
                  <div class="sub-commande-header">
                    <div class="sub-commande-code">SOUS-COMMANDE: ${sc.code}</div>
                  </div>
                  
                  <div class="sub-commande-body">
                    <div class="client-info">
                      <div class="client-name">${sc.commande?.client?.prenom || ""} ${sc.commande?.client?.nom || ""}</div>
                      <div>📞 ${sc.commande?.client?.telephone || "Non renseigné"}</div>
                      <div>📍 ${sc.commande?.client?.adresse || "Adresse non renseignée"}</div>
                    </div>
                    
                    ${lignesHtml ? `
                      <table>
                        <thead>
                          <tr>
                            <th>Référence</th>
                            <th>Désignation</th>
                            <th>Quantité</th>
                            <th>Prix Unitaire</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${lignesHtml}
                          <tr class="total-row">
                            <td colspan="4" style="text-align:right;font-size:10px;">Frais de livraison</td>
                            <td style="text-align:right;font-size:10px;">${(sc.fraisLivraison || 0).toFixed(2)} TND</td>
                          </tr>
                          <tr class="total-row">
                            <td colspan="4" style="text-align:right;font-weight:600;">Sous-total</td>
                            <td style="text-align:right;font-weight:600;">${totalSousCommande.toFixed(2)} TND</td>
                          </tr>
                        </tbody>
                      </table>
                    ` : `
                      <div style="text-align:center;padding:15px;color:#6b7280;font-size:11px;border:1px dashed #000000;border-radius:3px;">
                        Aucun produit dans cette sous-commande
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join("");

            return `
              <div class="page">
                <div class="header">
                  <div class="company-info">
                    <div class="company-logo">
                      <span class="company-name">LOGISTICS PRO</span>
                    </div>
                    <div class="company-details">
                      123 Avenue de la Logistique • 1001 Tunis • Tel: +216 70 000 000
                    </div>
                  </div>
                  
                  <div class="document-info">
                    <div class="document-title">BON DE RAMASSAGE</div>
                    <div class="document-meta">
                      <div><b>Référence:</b> ${pickup.code}</div>
                      <div><b>Date:</b> ${new Date(pickup.cree_le).toLocaleDateString("fr-FR")}</div>
                      <div><b>Statut:</b> ${pickup.status}</div>
                    </div>
                  </div>
                </div>

                <div class="grid-container">
                  <div class="info-card">
                    <h3>Informations Pickup</h3>
                    <div class="compact-row"><b>Code:</b> ${pickup.code}</div>
                    <div class="compact-row"><b>Date création:</b> ${new Date(pickup.cree_le).toLocaleDateString("fr-FR")}</div>
                    <div class="compact-row"><b>Heure:</b> ${new Date(pickup.cree_le).toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  
                  <div class="info-card">
                    <h3>Résumé du contenu</h3>
                    <div class="compact-row"><b>Nb. sous-commandes:</b> ${sousCommandes.length}</div>
                    ${meta.nb_colis ? `<div class="compact-row"><b>Nb. colis:</b> ${meta.nb_colis}</div>` : ""}
                    ${meta.poids ? `<div class="compact-row"><b>Poids total:</b> ${meta.poids} kg</div>` : ""}
                    <div class="divider"></div>
                    <div class="compact-row"><b>Valeur totale:</b> ${totalPickup.toFixed(2)} TND</div>
                  </div>
                </div>

                <div class="section-title">Détail des sous-commandes</div>
                ${sousCommandesHtml}

                <div class="grand-total">
                  TOTAL GÉNÉRAL DU PICKUP: ${totalPickup.toFixed(2)} TND
                </div>

                <div class="signature-section">
                  <div class="signature-box">
                    <div class="signature-label">Pour le fournisseur</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Nom, signature et cachet</div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-label">Pour le livreur</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Nom et signature</div>
                  </div>
                </div>

                <div class="footer">
                  <div>Document généré automatiquement le ${new Date().toLocaleString("fr-FR", {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</div>
                  <div class="barcode">*${pickup.code}*</div>
                  <div>LOGISTICS PRO - Système de gestion logistique</div>
                </div>
              </div>
            `;
          }).join("");

        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8" />
              <title>Bon de Ramassage - ${items[0]?.pickup?.code || 'Logistics Pro'}</title>
              <style>${css}</style>
              <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
            </head>
            <body>${htmlBody}</body>
            </html>
          `;

    }

    return (
        <div className="pickup-container">
            <div className="sm:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 ">
                    <Truck size={30} className="inline-block  mr-2 text-indigo-600" />
                    Pickups
                </h1>
            </div>

            <div className="controls-bar">
                <div className="search-section">
                    <div className="search-box">
                        <input
                            className="search-input"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Rechercher..."
                        />
                        <button className="search-btn" onClick={handleSearch}>
                            <Search size={16} />
                            Rechercher
                        </button>
                    </div>
                </div>

                <div className="actions-section">
                    <div className="print-actions">
                        <button
                            className="btn print-btn"
                            disabled={selectedIds.length === 0 || loading}
                            onClick={handlePrintSelected}
                        >
                            🖨️ Imprimer ({selectedIds.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {/* ... (Contenu du tableau inchangé) ... */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Chargement des pickups...</p>
                    </div>
                ) : pickups.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>Aucun pickup trouvé</h3>
                        <p>Essayez de modifier votre recherche.</p>
                    </div>
                ) : (
                    <>
                        <table className="pickup-table">
                            <thead>
                                <tr>
                                    <th className="checkbox-col">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === pickups.length && pickups.length > 0}
                                            onChange={() => (selectedIds.length === pickups.length ? clearAll() : selectAll())}
                                        />
                                    </th>
                                    <th className="date-col" data-label="Date">Date</th>
                                    <th className="code-col" data-label="Code">Code</th>
                                    <th className="produits-col" data-label="Sous-commandes">Sous-commandes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pickups.map((p) => {
                                    // ... (votre ligne de tableau) ...
                                    const scCount = Array.isArray(p.meta?.sousCommandeIds)
                                        ? p.meta.sousCommandeIds.length
                                        : 0;
                                    return (
                                        <tr key={p.id} className={selected[p.id] ? "selected" : ""}>
                                            <td className="checkbox-col">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected[p.id]}
                                                    onChange={() => toggle(p.id)}
                                                />
                                            </td>
                                            <td className="date-col">
                                                {new Date(p.cree_le).toLocaleString("fr-FR")}
                                            </td>
                                            <td className="code-col">
                                                <span className="code-badge">{p.code}</span>
                                            </td>
                                            <td className="produits-col p-4">
                                                {Array.isArray(p.sousCommandes) && p.sousCommandes.length > 0 ? (
                                                    <div className="subcommandes-list space-y-4">
                                                        {p.sousCommandes.map((sc, i) => (
                                                            <div 
                                                                key={i} 
                                                                // Ajout d'une petite ombre et d'un fond pour mettre en évidence chaque sous-commande
                                                                className="subcommande-item p-3 border border-gray-100 rounded-lg bg-white transition duration-150 ease-in-out hover:shadow-md"
                                                            >
                                                                {/* 1. Entête de la Sous-Commande : Code et Client */}
                                                                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                                                                    <div className="font-semibold text-sm text-indigo-700 flex items-center">
                                                                        <span className="mr-2">📦</span>
                                                                        {sc.code}
                                                                    </div>
                                                                    <div className="text-xs text-gray-700">
                                                                        Client : {sc.commande?.client?.prenom || ""} {sc.commande?.client?.nom || "Non spécifié"}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* 2. Liste des Produits */}
                                                                <ul className="ml-0 space-y-1 text-sm">
                                                                    {Array.isArray(sc.lignes) && sc.lignes.length > 0 ? (
                                                                        sc.lignes.map((l, j) => (
                                                                            <li key={j} className="flex justify-between items-center text-gray-700 text-xs">
                                                                                <span className="truncate">{l.produit?.nom || "Produit inconnu"}</span>
                                                                                <span className="font-medium text-right ml-2">× {l.quantite || 1}</span>
                                                                            </li>
                                                                        ))
                                                                    ) : (
                                                                        <li className="italic text-gray-400 text-xs">Aucun produit listé</li>
                                                                    )}
                                                                </ul>
                                                                
                                                                {/* 3. Total */}
                                                                <div className="text-right mt-3 pt-2">
                                                                    <span className="text-sm text-gray-700">Total : </span>
                                                                    <span className="font-bold text-base text-green-600">
                                                                        {Number(sc.totalAvecLivraison || sc.total || 0).toFixed(2)} TND
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 italic text-center block p-3">
                                                        Aucune sous-commande
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {/* --- AJOUT DE LA PAGINATION EN BAS DU TABLEAU --- */}
                        <PaginationControls 
                            total={total}
                            limit={limit}
                            setLimit={setLimit}
                            page={page}
                            setPage={setPage}
                            loading={loading}
                        />
                    </>
                )}
            </div>
            <style>{`
        .pagination-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
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