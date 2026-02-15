import { Card, CardContent } from "../ui/card";
import AreaMiniChart from "../charts/AreaMiniChart";
import { CardCounts } from "../types/dashboard";

interface Props {
  cards: CardCounts;
}

export function ChartStats({ cards }: Props) {
  const chartStats = [
    {
      title: "Profit",
      value: cards?.profit ?? 0,
      color: "#14b8a6",
      data: Array.from({ length: 7 }, (_, i) => ({ value: Math.random() * 100 }))
    },
    {
      title: "C.A Réel",
      value: cards?.CAffaire ?? 0,
      color: "#f43f5e",
      data: Array.from({ length: 7 }, (_, i) => ({ value: Math.random() * 100 }))
    },
    {
      title: "Profit en cours",
      value: cards?.profitEnCours ?? 0,
      color: "#3b82f6",
      data: Array.from({ length: 7 }, (_, i) => ({ value: Math.random() * 100 }))
    },
    {
      title: "Pénalités de retour",
      value: cards?.penalitesRetour ?? 0,
      color: "#8b5cf6",
      data: Array.from({ length: 7 }, (_, i) => ({ value: Math.random() * 100 }))
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {chartStats.map((c, idx) => (
        <Card key={idx} className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="h-40 flex flex-col justify-between p-0">
            <div className="flex items-center justify-between px-6 pt-4">
              <p className="text-sm font-medium text-gray-500">{c.title}</p>
              <p className="text-2xl font-semibold text-gray-800">{c.value}</p>
            </div>
            <div className="flex-1">
              <AreaMiniChart
                data={c.data}
                color={c.color}
                id={`chart-${idx}`}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}