import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/commande.css";
import {
  Truck,
  AlertCircle,
  Warehouse,
  CalendarCheck,
  Tag,
  Package,
  TruckIcon,
  RotateCcw
} from "lucide-react";
import api from "../../components/api";

const CommandeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [commande, setCommande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingConfirmationState, setPendingConfirmationState] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<number>(0); // Pour gérer l'onglet actif
  const [expandedTracking, setExpandedTracking] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    commentaire: "",
    source: "",
    colis_ouvrable: false,
    colis_fragile: false,
    frais_livraison: 0,
    etat_confirmation: "en_attente", // ✅ ajouté ici
    client: {
      prenom: "",
      nom: "",
      telephone: "",
      email: "",
      adresse: "",
      ville: "",
      gouvernorat: "",
    },
  });
  

  useEffect(() => {
    const chargerCommande = async () => {
      try {
        const res = await api.get(`/commande/${id}`);
        const data = res.data;
        setCommande(data);
        setFormData({
          commentaire: data.commentaire || "",
          source: data.source || "",
          colis_ouvrable: data.colis_ouvrable || false,
          colis_fragile: data.colis_fragile || false,
          frais_livraison: data.frais_livraison || 0,
          etat_confirmation: data.etat_confirmation || "en_attente",
          client: {
            prenom: data.client?.prenom || "",
            nom: data.client?.nom || "",
            telephone: data.client?.telephone || "",
            email: data.client?.email || "",
            adresse: data.client?.adresse || "",
            ville: data.client?.ville || "",
            gouvernorat: data.client?.gouvernorat || "",
          },
        });
      } catch (err) {
        console.error("Erreur chargement détails:", err);
      } finally {
        setLoading(false);
      }
    };
    chargerCommande();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value } = target;
  
    let finalValue: any = value;
  
    // Si c'est un input checkbox → utiliser checked
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      finalValue = target.checked;
    }
  
    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      client: { ...formData.client, [name]: value },
    });
  };

  const rechargerCommande = async () => {
    try {
      const res = await api.get(`/commande/${id}`);
      const data = await res.data;
      setCommande(data);
    } catch (err) {
      console.error("Erreur rechargement:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await api.put(`/commande/${id}`,formData);
      const data = await res.data;

      if (res.data.commande) {
        alert("✅ Commande mise à jour avec succès !");
        setCommande(data.commande);
        await rechargerCommande();
        setIsEditing(false);
      } else {
        alert(data.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur modification:", err);
    }
  };

  // Calculs
  const calculerTotauxSousCommande = (sousCommande: any) => {
    const lignes = sousCommande.lignes || [];
    const totalProduits = lignes.reduce(
      (total: number, ligne: any) =>
        total + ligne.prix_vente * ligne.quantite,
      0
    );
    const totalGros = lignes.reduce(
      (total: number, ligne: any) => total + ligne.prix_gros * ligne.quantite,
      0
    );
    const sousCommandes = commande?.sous_commandes || [];
    const fraisLivraison = sousCommandes.length > 1 ? 7.5 : 8;
    return {
      totalProduits,
      totalGros,
      fraisLivraison,
      totalGeneral: totalProduits + fraisLivraison,
    };
  };

  const calculerTotauxGlobaux = () => {
    const sousCommandes = commande?.sous_commandes || [];
    let totalGrosGlobal = 0;
    let totalVenteGlobal = 0;
    sousCommandes.forEach((sc: any) => {
      const lignes = sc.lignes || [];
      totalGrosGlobal += lignes.reduce(
        (total: number, ligne: any) =>
          total + Number(ligne.prix_gros) * ligne.quantite,
        0
      );
      totalVenteGlobal += lignes.reduce(
        (total: number, ligne: any) =>
          total + Number(ligne.prix_vente) * ligne.quantite,
        0
      );
    });
    const fraisLivraisonGlobal = parseFloat(commande?.frais_livraison) || 0;
    const fraisPlateformeGlobal = totalGrosGlobal * 0.1;
    const profitVendeurGlobal =
      totalVenteGlobal -
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

  if (loading) return <div>Chargement...</div>;
  if (!commande) return <div>Commande introuvable.</div>;

  const client = commande.client || {};
  const editable = commande.etat_confirmation === "en_attente";
  const sousCommandes = commande.sous_commandes || [];
  const totauxGlobaux = calculerTotauxGlobaux();

  const activeSousCommande = sousCommandes[activeTab]; // La sous-commande active

  const getTrackingIcon = (status) => {
    const iconSize = 50;
  
  // Utilisation de .trim() pour nettoyer les espaces blancs éventuels
    switch (status.trim())   {

      // --- Statuts de livraison ---
      case 'en_cours_livraison':
        return <CalendarCheck size={15}/>;
        
      case 'Réception_dépôt':
        return <Warehouse size={15}/>;
        
      case "en_attente_enlevement":
        return <Tag size={15}/>;
        
      case 'emballage_en_cours':
        return <Package size={15}/>;

      // --- Statuts de problème ou retour ---
      case 'Retournée payée':
        return <RotateCcw size={15}/>;
        
      case 'Colis Retourné':
        return <Truck size={15}/>;
        
      case 'Problème de livraison':
        return <AlertCircle size={15}/>;
      case 'en_attente':
        return <CalendarCheck size={15}/>;
        
      // --- Icône par défaut ---
      default:
        // Une icône générique si le statut n'est pas reconnu
        return <TruckIcon size={15}/>;
    }
  };

  return (
    <div className="commande-details-page">
      {/* ------------------ Info principale ------------------ */}
      <div className="alert-annuler">
        <span className="icon">ⓘ</span>
        <span>
          Une commande ne peut être annulée seulement si elle n'est pas encore
          emballée
        </span>
      </div>

      <div className="commande-details">
        <div className="produits-client-section">
          <div className="info-card">
          <div className="info-card-header">
            <h2 className="info-card-title">
              <i className="icon-doc"></i> {/* Optionnel: ajoutez une icône ici */}
              Informations de la commande
            </h2>
            <div className="info-card-actions">
              {commande.etat_confirmation === "en_attente" ? (
                !isEditing ? (
                  <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
                    Modifier
                  </button>
                ) : (
                  <div className="btn-group">
                    <button className="btn btn-save" onClick={handleUpdate}>
                      Enregistrer
                    </button>
                    <button className="btn btn-cancel" onClick={() => setIsEditing(false)}>
                      Annuler
                    </button>
                  </div>
                )
              ) : (
                <p className="etat-verrouille">
                  🔒 Commande <strong>{commande.etat_confirmation}</strong>
                </p>
              )}
            </div>
          </div>
        
          <div className="info-card-body">
            <div className="info-grid">
              {/* Code Commande */}
              <div className="info-field">
                <label>Code commande</label>
                <p>{commande.code}</p>
              </div>
        
              {/* Colis Ouvrable */}
              <div className="info-field">
                <label>Colis ouvrable</label>
                {isEditing ? (
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="colis_ouvrable_edit"
                      name="colis_ouvrable"
                      checked={formData.colis_ouvrable}
                      onChange={handleChange}
                    />
                    <label htmlFor="colis_ouvrable_edit">{formData.colis_ouvrable ? "Oui" : "Non"}</label>
                  </div>
                ) : (
                  <p>
                    {/* CHANGEMENT: Utilisation d'un badge */}
                    <span className={commande.colis_ouvrable ? 'badge badge-success' : 'badge badge-neutral'}>
                      {commande.colis_ouvrable ? "Oui" : "Non"}
                    </span>
                  </p>
                )}
              </div>
        
              {/* Colis Fragile */}
              <div className="info-field">
                <label>Colis fragile</label>
                {isEditing ? (
                  <div className="checkbox-wrapper">
                     <input
                      type="checkbox"
                      id="colis_fragile_edit"
                      name="colis_fragile"
                      checked={formData.colis_fragile}
                      onChange={handleChange}
                    />
                    <label htmlFor="colis_fragile_edit">{formData.colis_fragile ? "Oui" : "Non"}</label>
                  </div>
                ) : (
                  <p>
                    {/* CHANGEMENT: Utilisation d'un badge */}
                    <span className={commande.colis_fragile ? 'badge badge-warning' : 'badge badge-neutral'}>
                      {commande.colis_fragile ? "Oui" : "Non"}
                    </span>
                  </p>
                )}
              </div>
        
              {/* État de Confirmation */}
              <div className="info-field">
                <label>État de confirmation</label>
                {isEditing ? (
                  <select
                    name="etat_confirmation"
                    value={formData.etat_confirmation || "en_attente"}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value !== formData.etat_confirmation) {
                        setPendingConfirmationState(value);
                        setShowConfirmPopup(true);
                      }
                    }}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                ) : (
                  <p>{commande.etat_confirmation}</p>
                )}
              </div>
        
              {/* Commentaire */}
              <div className="info-field info-field-full">
                <label>Commentaire</label>
                {isEditing ? (
                  <textarea
                    name="commentaire"
                    value={formData.commentaire}
                    onChange={handleChange}
                    placeholder="Aucun commentaire"
                  />
                ) : (
                  // CHANGEMENT: Utilisation d'un tiret pour les valeurs vides
                  <p>{commande.commentaire || "—"}</p>
                )}
              </div>
              
              {/* Source */}
              <div className="info-field info-field-full">
                <label>Source</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                     placeholder="Source non spécifiée"
                  />
                ) : (
                  <p>{commande.source || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* ------------------ Sous-commandes ------------------ */}
          {sousCommandes.map((sc: any, idx: number) => {
            const totauxSousCommande = calculerTotauxSousCommande(sc);
            return (
              <div key={idx} className="sous-commande">
                <h3>Sous-commande {idx + 1}</h3>
                <p className="sous-commande-code">
                  <strong>Code :</strong> {sc.code}
                </p>

                <div className="produits-list">
                  {sc.lignes?.map((ligne: any) => {
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

                      <div className="produit-info">
                        <h4>{ligne.produit?.nom}</h4>
                        <p>Quantité : {ligne.quantite}</p>
                        <p>Prix de gros : {ligne.prix_gros} TND</p>
                        <p>Prix de vente : {ligne.prix_vente} TND</p>
                        <p className="profit-unitaire">
                          Profit du Vendeur par Unité :{" "}
                          {(ligne.prix_vente - ligne.prix_gros).toFixed(2)} TND
                        </p>
                      </div>
                    </div>
                  )})}
                </div>

                <div className="totals-section sous-commande-totals">
                  <div className="totals-group">
                    <div className="totals-row">
                      <span>Total de la sous-commande</span>
                      <span className="value">
                        {totauxSousCommande.totalProduits.toFixed(2)} TND
                      </span>
                    </div>
                    <div className="totals-row">
                      <span>Frais de Livraison</span>
                      <span className="value">
                        {totauxSousCommande.fraisLivraison.toFixed(2)} TND
                      </span>
                    </div>
                    <div className="totals-row main-total">
                      <span>TOTAL</span>
                      <span className="value">
                        {totauxSousCommande.totalGeneral.toFixed(2)} TND
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Totaux globaux */}
          <div className="summary-card">
              <h3 className="summary-title">Récapitulatif financier</h3>
          
              <div className="summary-group">
                  {/* Ligne pour le total des produits */}
                  <div className="summary-row">
                      <span>Total des produits</span>
                      <span className="summary-value">
                          {totauxGlobaux.totalVenteGlobal.toFixed(2)} TND
                      </span>
                  </div>
                  {/* Ligne pour les frais de livraison */}
                  <div className="summary-row">
                      <span>Frais de livraison</span>
                      <span className="summary-value">
                          {totauxGlobaux.fraisLivraisonGlobal.toFixed(2)} TND
                      </span>
                  </div>
              </div>
              
              <div className="summary-group">
                  {/* Ligne pour les frais de plateforme */}
                  <div className="summary-row is-subtle">
                      <span>Frais de Plateforme (10%)</span>
                      <span className="summary-value">
                           {totauxGlobaux.fraisPlateformeGlobal.toFixed(2)} TND
                      </span>
                  </div>
              </div>
              
              {/* Ligne pour le Profit (mise en avant) */}
              <div className="summary-row summary-profit">
                  <span>Profit du Vendeur</span>
                  <span className="summary-value">
                      {totauxGlobaux.profitVendeurGlobal.toFixed(2)} TND
                  </span>
              </div>
          
              {/* Ligne pour le Total Général (mise en avant) */}
              <div className="summary-row summary-grand-total">
                  <span>Total Général à payer</span>
                  <span className="summary-value">
                      {totauxGlobaux.totalGeneralGlobal.toFixed(2)} TND
                  </span>
              </div>
          </div>
        </div>

        {/* Tracking + Client */}
        <div className="tracking-client-section">
          <div className="tracking-card-container">
    <h2>Tracking des sous-commandes</h2>
    
    {/* Affiche tous les trackings de toutes les sous-commandes */}
    <div className="tracking-scroll-container">
      {sousCommandes.length === 0 ? (
        <div className="tracking-empty">
          <Truck size={48} />
          <p>Aucune sous-commande disponible</p>
        </div>
      ) : (
        sousCommandes.map((sc: any, scIndex: number) => (
          <div key={sc.id || scIndex} className="tracking-sub-group">
            {/* En-tête de la sous-commande */}
            <div className="tracking-group-header">
              <h3>
                Sous-commande {scIndex + 1}
                <span className="tracking-group-code">({sc.code})</span>
                <span className={`status-badge ${sc.statut}`}>
                  {sc.statut}
                </span>
              </h3>
              <div className="tracking-group-meta">
                <span>Fournisseur: {sc.fournisseur?.nom || "N/A"}</span>
              </div>
            </div>
            
            {/* Historique de tracking de cette sous-commande */}
            {sc.historique_tracking?.length > 0 ? (
              <div className="tracking">
                {sc.historique_tracking.map((t: any, tIndex: number) => (
                  <div 
                    key={t.id || tIndex} 
                    className={`tracking-item ${
                      t.statut?.toLowerCase().includes('problème') ? 'probleme' : 
                      t.statut?.toLowerCase().includes('retour') ? 'retour' : 
                      t.statut?.toLowerCase().includes('annulée') || t.statut?.toLowerCase().includes('annulee') ? 'annulee' : 
                      t.statut?.toLowerCase().includes('livrée') || t.statut?.toLowerCase().includes('livree') ? 'livree' : ''
                    }`}
                  >
                    {/* Cercle icône */}
                    <div className="tracking-icon-circle">
                      {getTrackingIcon(t.statut)}
                    </div>
                    
                    {/* Contenu avec carte */}
                    <div className="tracking-content">
                      {/* Ligne avec statut + date */}
                      <div className="tracking-item-header">
                        <span>{t.statut}</span>
                        <small>
                          {new Date(t.cree_le).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                      
                      {/* Description */}
                      <p>{t.description || "Aucune description"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tracking-empty-group">
                <p>Aucun historique de tracking pour cette sous-commande</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  </div>

          <div className="client-info">
            <h3>Informations du client</h3>
            <div className="client-info-grid">
              {/* Prénom */}
              <div className="client-field">
                <label>Prénom *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="prenom"
                    value={formData.client.prenom}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.prenom || "—"}</p>
                )}
              </div>
          
              {/* Nom */}
              <div className="client-field">
                <label>Nom *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nom"
                    value={formData.client.nom}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.nom || "—"}</p>
                )}
              </div>
          
              {/* Téléphone */}
              <div className="client-field">
                <label>Téléphone *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="telephone"
                    value={formData.client.telephone}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.telephone || "—"}</p>
                )}
              </div>
          
              {/* E-mail */}
              <div className="client-field">
                <label>E-mail</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.client.email}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.email || "—"}</p>
                )}
              </div>
          
              {/* Adresse */}
              <div className="client-field">
                <label>Adresse</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="adresse"
                    value={formData.client.adresse}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.adresse || "—"}</p>
                )}
              </div>
          
              {/* Gouvernorat */}
              <div className="client-field">
                <label>Gouvernorat *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="gouvernorat"
                    value={formData.client.gouvernorat}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.gouvernorat || "—"}</p>
                )}
              </div>
          
              {/* Ville */}
              <div className="client-field">
                <label>Ville *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="ville"
                    value={formData.client.ville}
                    onChange={handleClientChange}
                  />
                ) : (
                  <p>{client.ville || "—"}</p>
                )}
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
              Êtes-vous sûr de vouloir changer l’état de confirmation en{" "}
              <strong>{pendingConfirmationState}</strong> ?
            </p>
            <div className="popup-buttons">
              <button
                className="btn-confirm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    etat_confirmation: pendingConfirmationState || formData.etat_confirmation,
                  });
                  setShowConfirmPopup(false);
                  setPendingConfirmationState(null);
                }}
              >
                Confirmer
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowConfirmPopup(false);
                  setPendingConfirmationState(null);
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

export default CommandeDetails;