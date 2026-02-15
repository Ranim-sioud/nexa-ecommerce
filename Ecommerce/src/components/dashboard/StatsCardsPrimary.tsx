import { Card, CardContent } from "../ui/card";
import { ShoppingCart, CheckCircle, TrendingUp, Truck } from "lucide-react";
import { CardCounts } from "../types/dashboard";

interface Props {
  cards: CardCounts;
}

export function StatsCardsPrimary({ cards }: Props) {
  const stats = [
    { 
      title: "Total de commandes", 
      subtitle: "sans inclure les annulés", 
      value: cards?.totalCommandes ?? 0, 
      icon: ShoppingCart, 
      color: "teal" 
    },
    { 
      title: "Livrés", 
      value: cards?.livrees ?? 0, 
      icon: CheckCircle, 
      color: "gray" 
    },
    { 
      title: "En cours", 
      value: cards?.enCours ?? 0, 
      icon: Truck, 
      color: "blue" 
    },
    { 
      title: "Retournés", 
      value: cards?.retournees ?? 0, 
      icon: TrendingUp, 
      color: "gray" 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'teal' ? 'bg-teal-100' : 
                  stat.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'teal' ? 'text-teal-600' : 
                    stat.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}