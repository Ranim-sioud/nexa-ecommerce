import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/commande.css";
import api from "../../components/api";


const STATUTS = [
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
  "À retourner",
  "Colis retourné",
  "Non disponible",
];

function getStatusClass(statut: string) {
  // convertir en minuscules
  let cls = statut.toLowerCase();

  // remplacer les espaces et apostrophes par des underscores
  cls = cls.replace(/\s+/g, "_").replace(/'/g, "");

  // remplacer les caractères accentués (ex: problème → probleme)
  cls = cls.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return `badge-${cls}`;
}

const CommandeDetailsFournisseur: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sousCommande, setSousCommande] = useState<any>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/commande/fournisseur/${id}`);
      setSousCommande(res.data);
    } catch (err) {
      console.error("Erreur fetch détails commande:", err);
      alert("Impossible de charger les détails de la commande.");
      navigate("/commandes");
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!STATUTS.includes(newStatus)) {
      alert("Statut invalide.");
      return;
    }
    setStatusUpdating(true);
    try {
      await api.put(
        `/commande/sous-commande/${sousCommande.id}/tracking`,
        { statut: newStatus }
      );
      
      await fetchDetails();
    } catch (err) {
      console.error("Erreur updateStatus:", err);
      alert("Erreur lors de la mise à jour du statut.");
    } finally {
      setStatusUpdating(false);
      setShowConfirmPopup(false); // ferme la popup
      setPendingStatus(null); 
    }
  };

  const calculerTotauxSousCommande = () => {
    const lignes = sousCommande?.lignes || [];
  
    const totalProduits = lignes.reduce(
      (total: number, ligne: any) =>
        total + Number(ligne.prix_vente || 0) * Number(ligne.quantite || 0),
      0
    );
  
    const totalGros = lignes.reduce(
      (total: number, ligne: any) =>
        total + Number(ligne.prix_gros || 0) * Number(ligne.quantite || 0),
      0
    );
  
    // Si la commande principale contient plusieurs sous-commandes, on peut ajuster le coût
    const nbSousCommandes = sousCommande?.commande?.sous_commandes?.length ?? 1;
    const fraisLivraison = nbSousCommandes > 1 ? 7.5 : 8.0;
  
    return {
      totalProduits,
      totalGros,
      fraisLivraison,
      totalGeneral: totalProduits + fraisLivraison,
    };
  };

// ✅ Calcul des totaux financiers globaux (aligné avec CommandeDetails)
const calculerTotauxFinanciersGlobaux = () => {
  const lignes = sousCommande?.lignes || [];
  let totalGrosGlobal = 0;
  let totalVenteGlobal = 0;

  lignes.forEach((ligne: any) => {
    totalGrosGlobal += Number(ligne.prix_gros || 0) * Number(ligne.quantite || 0);
    totalVenteGlobal += Number(ligne.prix_vente || 0) * Number(ligne.quantite || 0);
  });

  const nbSousCommandes = sousCommande?.commande?.sous_commandes?.length ?? 1;
  const fraisLivraisonGlobal = nbSousCommandes > 1 ? 7.5 : 8.0;
  const fraisPlateformeGlobal = totalGrosGlobal * 0.1; // 10%

  const profitVendeurGlobal =
    totalGrosGlobal -
    fraisPlateformeGlobal

  return {
    totalGrosGlobal,
    totalVenteGlobal,
    fraisPlateformeGlobal,
    fraisLivraisonGlobal,
    profitVendeurGlobal,
    totalGeneralGlobal: totalVenteGlobal + fraisLivraisonGlobal,
  };
};


  if (!sousCommande) return <p className="loading-message">Chargement des détails...</p>;

  const commande = sousCommande.commande;
  const client = commande?.client;
  const totauxSousCommande = calculerTotauxSousCommande();
  const totauxGlobaux = calculerTotauxFinanciersGlobaux(); // Appel de la nouvelle fonction


  return (
    <div className="details-layout">
      {/* ======================================= */}
      {/* ========= COLONNE PRINCIPALE (GAUCHE) ========= */}
      {/* ======================================= */}
      <div className="layout-main-column">
        {/* --- Carte: Informations de la commande --- */}
        <div className="card order-info-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon-wrapper"><i className="fas fa-clipboard-list"></i></span>
              Informations de la commande
            </h3>
            <span className="badge badge-confirm">
              Commande {commande?.etat_confirmation || 'N/A'}
            </span>
          </div>
          <div className="card-body">
            <div className="info-grid-large">
              <div className="info-field">
                <label>Code commande</label>
                <p>{commande?.code ?? "—"}</p>
              </div>
              <div className="info-field">
                <label>Colis ouvrable</label>
                <p>{commande?.colis_ouvrable ? "Oui" : "Non"}</p>
              </div>
              <div className="info-field">
                <label>Colis fragile</label>
                <p>{commande?.colis_fragile ? "Oui" : "Non"}</p>
              </div>
              <div className="info-field">
                <label>État de confirmation</label>
                <p>{commande?.etat_confirmation ?? "—"}</p>
              </div>
              <div className="info-field">
                <label>Commentaire</label>
                <p>{commande?.commentaire || "—"}</p>
              </div>
              <div className="info-field">
                <label>Source</label>
                <p>{commande?.source || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Carte: Sous-commande --- */}
        <div className="card sub-order-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon-wrapper"><i className="fas fa-box-open"></i></span>
              Sous-commande {sousCommande.code.split('-').pop()}
            </h3>
          </div>
          <div className="card-body">
            <p className="sub-order-code">
              Code complet : <strong>{sousCommande.code}</strong>
            </p>
            {sousCommande.lignes?.map((ligne: any) => {
             const medias = ligne.produit?.medias || []; // Premier média du produit
             const imageMedia = medias.find((m: any) => m.type?.startsWith("image"));
              // Chercher une vidéo si aucune image
              const videoMedia = !imageMedia ? medias.find((m: any) => m.type?.startsWith("video")) : null;
             return (
              <div key={ligne.id} className="produit-item">
                {imageMedia ? (
                  <img
                    src={imageMedia.url}
                    alt={ligne.produit?.nom}
                    className="object-container produit-media"
                  />
                ) : videoMedia ? (
                  <video
                    src={videoMedia.url}
                    className="object-container produit-media"
                    controls
                    width={150}
                    height={150}
                  />
                ) : (
                  <img
                    src="/placeholder.png"
                    alt="Aucun média"
                    className="produit-media"
                  />
                )}
                <div className="produit-details">
                  <p className="produit-nom">{ligne.produit?.nom ?? "Produit inconnu"}</p>
                  <div className="produit-meta-grid">
                    <span>Quantité : <strong className="value">{ligne.quantite}</strong></span>
                    <span>Prix de gros : <strong className="value">{Number(ligne.prix_gros)?.toFixed(2)} TND</strong></span>
                    <span>Prix de vente : <strong className="value">{Number(ligne.prix_vente)?.toFixed(2)} TND</strong></span>
                  </div>
                </div>
              </div>
            )})}

          </div>
        </div>

        {/* --- Nouvelle Carte: Récapitulatif financier global --- */}
        <div className="card financial-summary-card">
            <div className="card-header">
                <h3 className="card-title">
                    <span className="icon-wrapper"><i className="fas fa-wallet"></i></span>
                    Récapitulatif financier
                </h3>
            </div>
            <div className="card-body">
                <div className="summary-group">
                    <div className="summary-row">
                        <span>Total des produits (prix de vente)</span>
                        <span className="summary-value">{totauxGlobaux.totalVenteGlobal.toFixed(2)} TND</span>
                    </div>
                    <div className="summary-row">
                        <span>Frais de livraison</span>
                        <span className="summary-value">{totauxGlobaux.fraisLivraisonGlobal.toFixed(2)} TND</span>
                    </div>
                </div>
                
                <div className="summary-group">
                    <div className="summary-row is-subtle">
                        <span>Frais de Plateforme (10%)</span>
                        <span className="summary-value"> {totauxGlobaux.fraisPlateformeGlobal.toFixed(2)} TND</span>
                    </div>
                </div>
                
                <div className="summary-row summary-profit">
                    <span>Profit du Fournisseur</span>
                    <span className="summary-value">{totauxGlobaux.profitVendeurGlobal.toFixed(2)} TND</span>
                </div>

                <div className="summary-row summary-grand-total">
                    <span>Total Général à payer par client</span>
                    <span className="summary-value">{totauxGlobaux.totalGeneralGlobal.toFixed(2)} TND</span>
                </div>
            </div>
        </div>


      </div>

      {/* ======================================= */}
      {/* ========= COLONNE LATÉRALE (DROITE) ========= */}
      {/* ======================================= */}
      <div className="layout-side-column">
        {/* --- Carte: Tracking --- */}
       <div className="card tracking-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="icon-wrapper"><i className="fas fa-map-marker-alt"></i></span>
            Tracking de la commande
          </h3>
          {/* Badge du statut actuel, si disponible */}
          {sousCommande.statut && (
            <span className={`badge ${getStatusClass(sousCommande.statut)}`}>
              {sousCommande.statut.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="tracking-timeline ">
            {sousCommande.historique_tracking?.length > 0 ? (
              // Inverser l'ordre pour afficher le plus récent en premier
              [...sousCommande.historique_tracking].reverse().map((t: any) => (
                <div key={t.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="timeline-status">{t.statut.replace(/_/g, ' ')}</p>
                    <small className="timeline-date">{new Date(t.cree_le).toLocaleString('fr-FR')}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-tracking-message">Aucun historique de tracking disponible.</p>
            )}
          </div>
          <div className="status-update-section">
              <label htmlFor="status-select">Modifier le statut :</label>
              <select
                  id="status-select"
                  defaultValue={sousCommande.statut}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && value !== sousCommande.statut) {
                      setPendingStatus(value);
                      setShowConfirmPopup(true);
                    }
                  }}
                  disabled={statusUpdating}
                  className="status-select-dropdown"
              >
                  <option value="" disabled>-- Choisir un statut --</option>
                  {STATUTS.map((st) => (
                      <option key={st} value={st}>
                          {st.replace(/_/g, ' ')}
                      </option>
                  ))}
              </select>
              {statusUpdating && <span className="loading-spinner"></span>}
          </div>
        </div>
      </div>

        {/* --- Carte: Informations du client --- */}
        <div className="card client-info-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon-wrapper"><i className="fas fa-user-circle"></i></span>
              Informations du client
            </h3>
          </div>
          <div className="card-body">
            <div className="info-grid-small">
              <div className="info-field">
                <label>Prénom *</label>
                <p>{client?.prenom ?? "—"}</p>
              </div>
              <div className="info-field">
                <label>Nom *</label>
                <p>{client?.nom ?? "—"}</p>
              </div>
              <div className="info-field">
                <label>Téléphone *</label>
                <p>{client?.telephone ?? "—"}</p>
              </div>
              <div className="info-field">
                <label>E-mail</label>
                <p>{client?.email || "—"}</p>
              </div>
              <div className="info-field">
                <label>Adresse</label>
                <p>{client?.adresse || "—"}</p>
              </div>
              <div className="info-field">
                <label>Gouvernorat *</label>
                <p>{client?.gouvernorat ?? "—"}</p>
              </div>
              <div className="info-field">
                <label>Ville *</label>
                <p>{client?.ville ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <h3>Confirmer la modification</h3>
            <p>
              Voulez-vous vraiment changer le statut en{" "}
              <strong>{pendingStatus?.replace(/_/g, " ")}</strong> ?
            </p>
            <div className="popup-buttons">
              <button
                className="btn-confirm"
                onClick={() => pendingStatus && updateStatus(pendingStatus)}
                disabled={statusUpdating}
              >
                Confirmer
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowConfirmPopup(false);
                  setPendingStatus(null);
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandeDetailsFournisseur;