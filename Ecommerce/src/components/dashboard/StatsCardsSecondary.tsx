import { Card, CardContent } from "../ui/card";
import { AlertCircle, X, DollarSign } from "lucide-react";
import { CardCounts } from "../types/dashboard";

interface Props {
  cards: CardCounts;
}

export function StatsCardsSecondary({ cards }: Props) {
  const stats = [
    { 
      title: "Non confirmée(s)", 
      value: cards?.nonConfirmees ?? 0, 
      icon: AlertCircle, 
      color: "teal" 
    },
    { 
      title: "Annulés", 
      value: cards?.annulees ?? 0, 
      icon: X, 
      color: "red" 
    },
    { 
      title: "Livrés payés", 
      value: cards?.livreesPayees ?? 0, 
      icon: DollarSign, 
      color: "green" 
    },
    { 
      title: "Livrés non payés", 
      value: cards?.livreesNonPayees ?? 0, 
      icon: AlertCircle, 
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
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'teal' ? 'bg-teal-100' : 
                  stat.color === 'red' ? 'bg-red-100' : 
                  stat.color === 'green' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'teal' ? 'text-teal-600' : 
                    stat.color === 'red' ? 'text-red-600' : 
                    stat.color === 'green' ? 'text-green-600' : 'text-gray-600'
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