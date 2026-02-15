import { Card, CardContent } from "../ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis
} from "recharts";
import { CardCounts, DailyDataItem } from "../types/dashboard";

interface Props {
  cards: CardCounts;
  dailyData: DailyDataItem[];
}

interface ChartStat {
  title: string;
  subtitle?: string;
  value: string | number;
  color: string;
  data: { value: number }[];
}

export default function StatsCharts({ cards, dailyData }: Props) {
  const chartStats: ChartStat[] = [
    {
      title: "Total de commandes",
      subtitle: "Sans inclure les annulés",
      value: cards.totalCommandes ?? 0,
      color: "#14b8a6",
      data: dailyData.map(d => ({ value: (d as any).commandes_total ?? Math.random() * 10 }))
    },
    {
      title: "C.A Potentiel",
      value: (cards.CAPotentiel ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
      color: "#8b5cf6",
      data: dailyData.map(d => ({ value: (d as any).ca_potentiel ?? Math.random() * 10 }))
    },
    {
      title: "C.A Réel",
      value: (cards.CAffaire ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
      color: "#3b82f6",
      data: dailyData.map(d => ({ value: (d as any).ca_reel ?? Math.random() * 10 }))
    },
    {
      title: "C.A En Cours",
      value: (cards.CAEnCours ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
      color: "oklch(.592 .249 .584)",
      data: dailyData.map(d => ({ value: (d as any).ca_en_cours_profit ?? Math.random() * 10 }))
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {chartStats.map((stat, idx) => (
        <Card key={idx} className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="h-40 flex flex-col justify-between [&:last-child]:pb-0 p-0">
            <div className="flex items-center justify-between px-6 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                {stat.subtitle && <p className="text-xs text-gray-400">{stat.subtitle}</p>}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stat.data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={stat.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={stat.color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={stat.color}
                    strokeWidth={2.5}
                    fill={`url(#color${idx})`}
                    dot={false}
                  />
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}