export interface CardCounts {
  totalCommandes: number;
  livrees: number;
  enCours: number;
  retournees: number;
  nonConfirmees?: number;
  annulees: number;
  livreesPayees: number;
  livreesNonPayees: number;
  tauxRetour: number;
  profit: number;
  CAffaire: number;
  CAEnCours: number;
  CAPotentiel: number;
  penalitesRetour?: number;
  pickups?: number;
  totalProduits?: number;
  totalClients?: number;
  commandesLivrees?: number;
  commandesAnnulees?: number;
  profitEnCours?: number;
}

export interface DailyDataItem {
  date: string;
  commandes_total: number;
  ca_potentiel: number;
  ca_reel: number;
  ca_en_cours_profit: number;
  profit?: number;
  perte?: number;
  name?: string;
  profits?: number;
  commandes?: number;
}

export interface MonthlyDataItem {
  date: string;
  profit: number;
  perte: number;
  name?: string;
  profits?: number;
  commandes?: number;
}

export interface TopProduitItem {
  id?: string;
  nom: string;
  quantite: number;
  ventes?: number;
  medias?: Array<{ url: string }>;
}
export interface CommandeSource {
  source: string;
  count: number;
}

export interface DashboardData {
  cards: CardCounts;
  monthlyData: MonthlyDataItem[];
  dailyData: DailyDataItem[];
  topProduits: TopProduitItem[];
  recentOrders?: any[];
  commandesParSource?: any[];
}