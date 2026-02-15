import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Client, Produit, ProduitCommande } from "../types/commande";
import '../../styles/commande.css';
import Swal from "sweetalert2";
import api from "../../components/api";

const CreerCommande: React.FC = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState<Partial<Client>>({});
  const [produits, setProduits] = useState<ProduitCommande[]>([]);
  const [produitsDisponibles, setProduitsDisponibles] = useState<Produit[]>([]);
  const [rechercheProduit, setRechercheProduit] = useState("");
  const [loading, setLoading] = useState(false);
  const [fraisLivraison, setFraisLivraison] = useState<number>(0);
  const [source, setSource] = useState<string>("");
  const [colisDate, setColisDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [commentaire, setCommentaire] = useState<string>("");
  const [colisOuvrable, setColisOuvrable] = useState(false);
  const [colisFragile, setColisFragile] = useState(false);
  const [demandeConfirmation, setDemandeConfirmation] = useState(false);
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const gouvernoratsTunis = [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", 
    "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba", 
    "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", 
    "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
  ];

  const sources = [
    "Facebook", "Instagram", "TikTok", "Téléphone", "Shopify", "WooCommerce", 
    "Converty", "Tik Tok Pro", "WhatsApp", "N/A", "site_web"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductListOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      chargerProduits();
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [rechercheProduit]);

  useEffect(() => {
    if (produits.length > 0) {
      chargerFrais();
    } else {
      setFraisLivraison(0);
    }
  }, [produits]);
  

  const chargerProduits = async () => {
    try {
      setLoadingProduits(true);      
      const searchParam = rechercheProduit.trim() ? `search=${encodeURIComponent(rechercheProduit)}` : '';
      
      const response = await api.get(`/commande/produits?${searchParam}&limit=50`);
      const data = response.data;
      
      if (data.success) {
        setProduitsDisponibles(data.produits || []);
      } else {
        setProduitsDisponibles([]);
        console.error("Erreur serveur:", data.message);
      }
      
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      setProduitsDisponibles([]);
      
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Impossible de charger les produits. Vérifiez votre connexion.',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setLoadingProduits(false);
    }
  };

  const chargerFrais = async () => {
    try {
      if (produits.length === 0) return;
      
      const produitsPourFrais = produits.map((p) => ({
        quantite: p.quantite,
        produit: {
          id_fournisseur: p.produit?.fournisseur?.id_User.id
        },
      }));

      const response = await api.post("/commande/frais", {
        produits: produitsPourFrais
      });
      
      if (!response.data) throw new Error("Erreur serveur lors du calcul des frais");
      
      const data = await response.data;
      setFraisLivraison(Number(data.frais_livraison) || 0);
    } catch (error) {
      console.error("Erreur chargement frais:", error);
    }
  };

  const ajouterProduit = (produit: Produit) => {
    const stockDisponible = produit.variations && produit.variations.length > 0
      ? produit.variations.reduce((sum, v) => sum + (v.stock || 0), 0)
      : produit.stock || 0;

    if (stockDisponible <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock épuisé',
        text: 'Ce produit n\'a plus de stock disponible.',
        confirmButtonColor: '#f39c12',
      });
      return;
    }

    let variationDefaut = null;
    let prixGrosDefaut = parseFloat(produit.prix_gros?.toString() || "0");
    
    if (produit.variations && produit.variations.length > 0) {
      const variationAvecStock = produit.variations.find(v => v.stock > 0);
      if (variationAvecStock) {
        variationDefaut = variationAvecStock;
        prixGrosDefaut = parseFloat(variationDefaut.prix_gros?.toString() || produit.prix_gros?.toString() || "0");
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Rupture de stock',
          text: 'Toutes les variations de ce produit sont en rupture de stock.',
          confirmButtonColor: '#f39c12',
        });
        return;
      }
    }

    const produitCommande: ProduitCommande = {
      id_produit: produit.id,
      quantite: 1,
      prix_vente: prixGrosDefaut,
      prix_gros: prixGrosDefaut,
      produit: {
        ...produit,
        variation: variationDefaut,
        stock: variationDefaut ? variationDefaut.stock : produit.stock,
      },
    };

    setProduits((prev) => [...prev, produitCommande]);
    setRechercheProduit('');
    setIsProductListOpen(false);
  };

  const mettreAJourProduit = (index: number, updates: Partial<ProduitCommande>) => {
    const nouveauxProduits = [...produits];
    Object.assign(nouveauxProduits[index], updates);
    setProduits(nouveauxProduits);
  };

  const supprimerProduit = (index: number) => {
    const nouveauxProduits = produits.filter((_, i) => i !== index);
    setProduits(nouveauxProduits);
  };

  const calculerTotal = () => produits.reduce((total, p) => total + Number(p.prix_vente) * p.quantite, 0);
  const calculerTotalGros = () => produits.reduce((total, p) => total + p.prix_gros * p.quantite, 0);
  const calculerFraisPlateforme = () => calculerTotalGros() * 0.1;
  const calculerTotalGeneral = () => calculerTotal() + fraisLivraison;
  const calculerProfitNetTotal = () => {
    const total = calculerTotal();
    if (total === 0) return 0;
    const fraisPlateformeTotal = calculerFraisPlateforme();
    return produits.reduce((acc, p) => {
      const partFraisPlateforme = (p.prix_vente * p.quantite / total) * fraisPlateformeTotal;
      const profitUnitaire = p.prix_vente - p.prix_gros - (partFraisPlateforme / p.quantite);
      return acc + profitUnitaire * p.quantite;
    }, 0);
  };

  const verifierClientExiste = async (email: string) => {
    try {
      const response = await fetch(
        `/commande/email/${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.client || null;
      }
      return null;
    } catch (error) {
      console.error("Erreur vérification client:", error);
      return null;
    }
  };

  const soumettreCommande = async () => {
    if (!client.prenom || !client.nom || !client.telephone || !client.adresse || !client.gouvernorat || !client.ville) {
      Swal.fire({
        icon: "warning",
        title: "Champs manquants",
        text: "Veuillez remplir tous les champs du client avant de continuer.",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    if (produits.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Aucun produit",
        text: "Veuillez ajouter au moins un produit à la commande.",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    if (!source) {
      Swal.fire({
        icon: "info",
        title: "Source manquante",
        text: "Veuillez sélectionner une source avant de soumettre la commande.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setLoading(true);
    try {
      let clientExistant = null;
      
      if (client.email) {
        clientExistant = await verifierClientExiste(client.email);
      }

      const clientPayload = clientExistant ? { id_client: clientExistant.id } : client;

      const response = await api.post("/commande", {
        method: "POST",
          client: clientPayload,
          produits: produits.map((p) => ({
            id_produit: p.id_produit,
            id_variation: p.produit?.variation?.id || null,
            quantite: p.quantite,
            prix_vente: Number(p.prix_vente),
            prix_gros: Number(p.prix_gros),
          })),
          commentaire,
          source,
          collis_date: colisDate,
          demande_confirmation: demandeConfirmation,
          colis_ouvrable: colisOuvrable,
          colis_fragile: colisFragile,
      });

      if (response.data) {
        const result = await response.data;
        Swal.fire({
          icon: "success",
          title: "Commande créée 🎉",
          text: `La commande a été enregistrée avec succès !\nCode : ${result.code}`,
          confirmButtonColor: "#27ae60",
        }).then(() => {
          navigate("/ListeCommandes");
        });
      } else {
        const error = await response.data;
        if (error.message && error.message.toLowerCase().includes("stock insuffisant")) {
          Swal.fire({
            icon: "error",
            title: "Stock insuffisant",
            text: error.message || "Un ou plusieurs produits n'ont pas assez de stock pour cette commande.",
            confirmButtonColor: "#e74c3c",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: error.message || "Une erreur est survenue lors de la création.",
            confirmButtonColor: "#e74c3c",
          });
        }
      }
    } catch (error) {
      console.error("Erreur création commande:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur serveur",
        text: "Une erreur est survenue lors de la création de la commande.",
        confirmButtonColor: "#e74c3c",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="creer-commande-container">
      <div className="info-banner">
        <i className="icon-info">i</i>
        <span>Avant de lancer des campagnes publicitaires, veuillez confirmer la disponibilité du stock du produit avec l'équipe</span>
      </div>

      <div className="form-section">
        <h2 className="section-title">Informations du client</h2>
        <p className="section-subtitle">Les champs marqués d'un * sont obligatoires</p>
        
        <div className="grid-form">
          <div className="form-field">
            <label>Prénom *</label>
            <input 
              type="text" 
              placeholder="Prénom" 
              value={client.prenom || ''} 
              onChange={(e) => setClient({ ...client, prenom: e.target.value })} 
            />
          </div>
          
          <div className="form-field">
            <label>Nom *</label>
            <input 
              type="text" 
              placeholder="Nom" 
              value={client.nom || ''} 
              onChange={(e) => setClient({ ...client, nom: e.target.value })} 
            />
          </div>
          
          <div className="form-field">
            <label>Téléphone *</label>
            <input 
              type="text" 
              placeholder="Téléphone" 
              value={client.telephone || ''} 
              onChange={(e) => setClient({ ...client, telephone: e.target.value })} 
            />
          </div>
          
          <div className="form-field">
            <label>Gouvernorat *</label>
            <select 
              value={client.gouvernorat || ''} 
              onChange={(e) => setClient({ ...client, gouvernorat: e.target.value })}
            >
              <option value="" disabled>Sélectionnez le gouvernorat</option>
              {gouvernoratsTunis.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          
          <div className="form-field">
            <label>Ville *</label>
            <input 
              type="text" 
              placeholder="Ville" 
              value={client.ville || ''} 
              onChange={(e) => setClient({ ...client, ville: e.target.value })} 
            />
          </div>
          
          <div className="form-field">
            <label>Adresse *</label>
            <input 
              type="text" 
              placeholder="Adresse" 
              value={client.adresse || ''} 
              onChange={(e) => setClient({ ...client, adresse: e.target.value })} 
            />
          </div>
          
          <div className="form-field">
            <label>E-mail</label>
            <input 
              type="email" 
              placeholder="E-mail" 
              value={client.email || ''} 
              onChange={(e) => setClient({ ...client, email: e.target.value })} 
            />
          </div>
          
          <div className="form-field">
            <label>Commentaire</label>
            <input 
              type="text" 
              placeholder="Commentaire" 
              value={commentaire} 
              onChange={(e) => setCommentaire(e.target.value)} 
            />
          </div>
          
          <div className="form-field">
            <label>Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="" disabled>Sélectionner la source de la commande</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          <div className="form-field">
            <label>Colis ouvrable</label>
            <select 
              value={colisOuvrable ? 'oui' : 'non'} 
              onChange={(e) => setColisOuvrable(e.target.value === 'oui')}
            >
              <option value='non'>Le client final peut fermer le colis</option>
              <option value='oui'>Le client final peut ouvrir le colis</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid-form options-grid">
        <div className="form-field">
          <label>Colis daté</label>
          <input 
            type="date" 
            value={colisDate} 
            onChange={(e) => setColisDate(e.target.value)} 
          />
        </div>
        
        <div className="form-field toggle-field">
          <label>Colis fragile</label>
          <div className="toggle-container">
            <span>Le colis est fragile et doit être manipulé avec soin</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={colisFragile} 
                onChange={(e) => setColisFragile(e.target.checked)} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        
        <div className="form-field toggle-field">
          <label>Gérer la confirmation</label>
          <div className="toggle-container">
            <span>Commande restera En attente de confirmation jusqu'à votre confirmation.</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={demandeConfirmation} 
                onChange={(e) => setDemandeConfirmation(e.target.checked)} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2 className="section-title">Information de la commande</h2>
        <p className="section-subtitle">
          Sélectionnez le(s) produit(s) de votre liste de produits que vous souhaitez ajouter à cette commande et spécifiez la quantité, la taille et la couleur
        </p>
        
        <div className="info-banner teal">
          <i className="icon-info">i</i>
          <span>
            Pour les commandes contenant différents produits de différents fournisseurs, 
            la commande sera divisée en plusieurs commandes et les frais de livraison augmenteront
          </span>
        </div>

        <div className="form-field product-search-container" ref={dropdownRef}>
          <label>Produit(s) de la commande *</label>
          
          <div 
            className="product-select-trigger" 
            onClick={() => {
              setIsProductListOpen(!isProductListOpen);
              if (!isProductListOpen) {
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 100);
              }
            }}
          >
            <span>
              {loadingProduits ? "Chargement..." : 
               produitsDisponibles.length === 0 && rechercheProduit ? "Aucun produit trouvé" : 
               "Sélectionnez un produit ou plus"}
            </span>
            <i className={`fas fa-chevron-down ${isProductListOpen ? 'open' : ''}`}></i>
          </div>

          {isProductListOpen && (
            <div className="product-dropdown-content">
              {/* AJOUTER CET EN-TÊTE */}
              <div className="product-dropdown-header">
                <h3>Sélectionner un produit</h3>
                <button 
                  className="close-dropdown-btn"
                  onClick={() => setIsProductListOpen(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="product-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder="Rechercher..."
                  value={rechercheProduit}
                  onChange={(e) => setRechercheProduit(e.target.value)}
                />
                {loadingProduits && (
                  <div className="search-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
                )}
              </div>

              <div className="product-list-container">
                {loadingProduits ? (
                  <div className="loading-message">
                    <i className="fas fa-spinner fa-spin"></i> Chargement...
                  </div>
                ) : produitsDisponibles.length === 0 ? (
                  <div className="no-results-message">
                    {rechercheProduit ? (
                      <>
                        <i className="fas fa-search"></i>
                        <p>Aucun produit trouvé pour "{rechercheProduit}"</p>
                        <button 
                          className="clear-search-btn"
                          onClick={() => {
                            setRechercheProduit('');
                            chargerProduits();
                          }}
                        >
                          Effacer la recherche
                        </button>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-box-open"></i>
                        <p>Aucun produit disponible</p>
                      </>
                    )}
                  </div>
                ) : (
                  produitsDisponibles.map((p) => {
                    const hasStock = p.variations && p.variations.length > 0
                      ? p.variations.some(v => v.stock > 0)
                      : (p.stock || 0) > 0;
                    
                    return (
                      <div 
                        key={p.id} 
                        className={`product-dropdown-item ${!hasStock ? 'disabled' : ''}`}
                        onClick={() => hasStock && ajouterProduit(p)}
                      >
                        <div className="product-img">
                          {p.medias?.[0] ? (
                            <img src={p.medias[0].url} alt={p.nom} />
                          ) : (
                            <div className="img-placeholder">
                              <i className="fas fa-box-open"></i>
                            </div>
                          )}
                        </div>
                        
                        <div className="product-main-info">
                          <p className="product-name">{p.nom}</p>
                          <p className="supplier-code">
                            Code : <strong>{p.fournisseur?.identifiant_public || "—"}</strong>
                          </p>
                          {p.variations && p.variations.length > 0 && (
                            <div className="variations-mini">
                              {p.variations.slice(0, 2).map((v) => (
                                <span key={v.id} className="variation-badge">
                                  {v.couleur || 'N/A'} / {v.taille || 'N/A'} (Stock: {v.stock})
                                </span>
                              ))}
                              {p.variations.length > 2 && (
                                <span className="more-variations">+{p.variations.length - 2} autres</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="product-stats-grid">
                          <div className="stat-item">
                            <label>Stock</label>
                            <span className={`stat-value ${!hasStock ? 'stock-out' : ''}`}>
                              {p.stock ?? "—"}
                            </span>
                          </div>
                          <div className="stat-item">
                            <label>Prix de gros</label>
                            <span className="stat-value">
                              {Number(p.prix_gros || 0).toFixed(2)} TND
                            </span>
                          </div>
                        </div>

                        <div className="product-action">
                          <button 
                            className="add-product-btn" 
                            title={hasStock ? "Ajouter le produit" : "Stock épuisé"}
                            disabled={!hasStock}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {produits.length > 0 && (
        <div className="selected-products-section">
          {produits.map((p, index) => {
            const currentStock = p.produit?.variation 
              ? p.produit.variation.stock 
              : p.produit?.stock || 0;
            
            return (
              <div key={index} className="product-card">
                <div className="product-card-main">
                  {p.produit?.medias?.[0] ? (
                    <img 
                      src={p.produit.medias[0].url} 
                      alt={p.produit.nom} 
                      className="product-card-image" 
                    />
                  ) : (
                    <div className="product-card-image">📦</div>
                  )}
                  
                  <div className="product-card-info">
                    <h3>{p.produit?.nom}</h3>
                    <p className={`stock-info ${
                      currentStock === 0 ? "rupture-stock" : 
                      currentStock <= 5 ? "stock-faible" : ""
                    }`}>
                      {currentStock} en stock
                      {currentStock === 0 && (
                        <span className="stock-warning-text"> — 🔴 Rupture de stock</span>
                      )}
                      {currentStock > 0 && currentStock <= 5 && (
                        <span className="stock-warning-text"> — 🟠 Stock faible</span>
                      )}
                    </p>
                    <p>Prix de gros : {Number(p.prix_gros || 0).toFixed(3)} TND</p>
                  </div>
                  
                  <div className="product-card-inputs">
                    {p.produit?.variations && p.produit.variations.length > 0 ? (
                      <>
                        <div className="form-field">
                          <label>Couleur / Taille</label>
                          <select 
                            value={p.produit?.variation?.id || ""}
                            onChange={(e) => {
                              const variation = p.produit?.variations?.find(
                                (v) => v.id === parseInt(e.target.value)
                              );
                              if (variation) {
                                mettreAJourProduit(index, {
                                  prix_gros: variation.prix_gros,
                                  produit: {
                                    ...p.produit!,
                                    variation,
                                    stock: variation.stock
                                  },
                                });
                              }
                            }}
                          >
                            {p.produit.variations.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.couleur || "-"} / {v.taille || "-"} — {v.stock} en stock
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-field">
                          <label>Couleur</label>
                          <input type="text" placeholder="Non disponible" disabled />
                        </div>
                        <div className="form-field">
                          <label>Taille</label>
                          <input type="text" placeholder="Non disponible" disabled />
                        </div>
                      </>
                    )}
                    
                    <div className="form-field">
                      <label>Quantité *</label>
                      <input 
                        type="number" 
                        value={p.quantite} 
                        min="1" 
                        max={currentStock}
                        onChange={(e) => {
                          const newQuantite = parseInt(e.target.value) || 1;
                          if (newQuantite <= currentStock) {
                            mettreAJourProduit(index, { quantite: newQuantite });
                          } else {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Stock insuffisant',
                              text: `Stock disponible: ${currentStock}`,
                              confirmButtonColor: '#f39c12'
                            });
                          }
                        }}
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Prix de vente *</label>
                      <div className="form-field"><input type="number" value={p.prix_vente} step="0.1" min={p.prix_gros} onChange={(e) => mettreAJourProduit(index, { prix_vente: parseFloat(e.target.value) || 0 })} /></div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => supprimerProduit(index)} 
                    className="delete-product-btn"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6L18 18" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                <div className="product-card-subtotal">
                  <div className="subtotal-line">
                    <span>{p.quantite} x {p.produit?.nom}</span>
                    <span>{(p.quantite * p.prix_vente).toFixed(3)} TND</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="recap-financier-final">
            <div className="summary-line">
              <span>Total produits:</span>
              <span>{calculerTotal().toFixed(3)} TND</span>
            </div>
            <div className="summary-line">
              <span>Frais de plateforme (10%):</span>
              <span>{calculerFraisPlateforme().toFixed(3)} TND</span>
            </div>
            <div className="summary-line">
              <span>Frais de livraison:</span>
              <span>{fraisLivraison.toFixed(3)} TND</span>
            </div>
            <div className="summary-line total-line">
              <strong>Total général:</strong>
              <strong>{calculerTotalGeneral().toFixed(3)} TND</strong>
            </div>
            <div className="summary-line profit-line">
              <span>Profit du Vendeur:</span>
              <span>{calculerProfitNetTotal().toFixed(3)} TND</span>
            </div>
          </div>
        </div>
      )}

      <div className="footer-actions">
        <button 
          onClick={soumettreCommande} 
          className="save-button" 
          disabled={loading || produits.length === 0 || !source}
        >
          {loading ? "Sauvegarde en cours..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
};

export default CreerCommande;