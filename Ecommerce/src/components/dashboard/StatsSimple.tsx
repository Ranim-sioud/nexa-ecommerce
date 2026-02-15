import { Card, CardContent } from "../ui/card";
import {
  CheckCircle, DollarSign, AlertCircle, Clock, X,
  TrendingUp, Package, LucideIcon
} from "lucide-react";
import { CardCounts, TopProduitItem } from "../types/dashboard";

interface Props {
  cards: CardCounts;
  topProduits: TopProduitItem[];
}

interface SimpleStat {
  title: string;
  value: number;
  icon: LucideIcon;
}

export default function StatsSimple({ cards, topProduits }: Props) {
  const simpleStats: SimpleStat[] = [
    { title: "Livrés", value: cards.livrees ?? 0, icon: CheckCircle },
    { title: "Livrés payés", value: cards.livreesPayees ?? 0, icon: DollarSign },
    { title: "Livrés non payés", value: cards.livreesNonPayees ?? 0, icon: AlertCircle },
    { title: "En cours", value: cards.enCours ?? 0, icon: Clock },
    { title: "Annulés", value: cards.annulees ?? 0, icon: X },
    { title: "Retournés", value: cards.retournees ?? 0, icon: TrendingUp },
    { title: "Pickups", value: cards.pickups ?? 0, icon: Package },
    { title: "Produits", value: cards.totalProduits || topProduits.length || 0, icon: Package },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
      {simpleStats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="rounded-xl border-gray-200 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                  <p className="text-xl font-bold mt-1 text-gray-900">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}