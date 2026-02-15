export interface User {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role: string;
  gouvernorat: string;
  ville: string;
  adresse: string;
}

export interface Fournisseur {
  id_User: User;
  identifiant_public: string;
  solde_portefeuille: number ;
}

export interface Categorie {
  id: number;
  nom: string;
  parent_id?: number;
}

export interface Client {
  id?: number;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse: string;
  gouvernorat: string;
  ville: string;
}

export interface ProduitCommande {
  id_produit: number;
  id_variation?: number;
  quantite: number;
  prix_vente: number;
  prix_gros: number;
  produit?: Produit;
}

export interface Commande {
  id: number;
  code: string;
  client: Client;
  produits: ProduitCommande[];
  commentaire?: string;
  source?: string;
  collis_date?: string;
  demande_confirmation: boolean;
  etat_confirmation: string;
  total: number;
  frais_livraison: number;
  frais_plateforme: number;
  cree_le: string;
  modifie_le: string;
  sous_commandes?: SousCommande[];
  sous_commande: SousCommande;
}

export interface LigneCommande {
  id: number;
  quantite: number;
  prix_vente: number;
  prix_gros: number;
  profit_unitaire: number;
  produit: Produit;
  variation?: Variation;
}

export interface SousCommande {
  id: number;
  code: string;
  statut: string;
  fournisseur: User;
  lignes: LigneCommande[];
  historique_tracking: Tracking[];
  total: number;
  cree_le: string;
  modifie_le: string;
}

export interface Tracking {
  id: number;
  statut: string;
  description: string;
  tentatives_livraison: number;
  cree_le: string;
}

export interface Produit {
  id: number;
  code: string;
  nom: string;
  description?: string;
  prix_gros: number;
  stock: number;
  livraison?: string;
  variantes_actives: boolean;
  rupture_stock: boolean;
  variations: Variation[];
  variation?: Variation;
  medias: Media[];
  categorie: Categorie;
  fournisseur: Fournisseur;
  cree_le?: string;
  modifie_le?: string;
}

export interface Variation {
  id: number;
  couleur: string;
  taille: string;
  prix_gros: number;
  stock: number;
  id_externe?: string;
  cree_le?: string;
  modifie_le?: string;
  sku: string;
}


export interface Media {
  id: number;
  type: string;
  url: string;
  principale: boolean;
  cree_le?: string;
  modifie_le?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  commandes: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProduitsResponse {
  produits: Produit[];
  total: number;
  page: number;
  totalPages: number;
}