import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalendarRangeIcon } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Label, Tooltip
} from "recharts";
import { CardCounts } from "../types/dashboard";

interface Props {
  cards: CardCounts;
  dateRange: {
    start: string;
    end: string;
  };
  formatTitleDate: (dateString: string) => string;
}

export default function TauxRetour({ cards, dateRange, formatTitleDate }: Props) {
  const livrees = cards?.livrees ?? 0;
  const retournees = cards?.retournees ?? 0;
  const total = livrees + retournees;
  const tauxRetourNum = cards?.tauxRetour ?? 0;

  const pieData = [
    { name: 'Livré', value: livrees }, 
    { name: 'Retourné', value: retournees }, 
  ];
  
  const COLORS = ['#ccc', 'oklch(.592 .249 .584)'];

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-md font-semibold">
            <CalendarRangeIcon className="w-5 h-5 text-pink-600" />
            <span className="text-pink-600">
              {dateRange.start === dateRange.end ? formatTitleDate(dateRange.start) : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`}
            </span>
          </CardTitle>
          <h3 className="text-2xl font-bold">Taux de retour</h3>
          <p className="text-sm text-muted-foreground">
            Ce graphique circulaire montre le pourcentage de commandes livrées par rapport aux commandes retournées
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            Aucune donnée n'est actuellement disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-md font-semibold">
          <CalendarRangeIcon className="w-5 h-5 text-pink-600" />
          <span className="text-pink-600">
            {dateRange.start === dateRange.end ? formatTitleDate(dateRange.start) : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`}
          </span>
        </CardTitle>
        <h3 className="text-2xl font-bold">Taux de retour</h3>
        <p className="text-sm text-muted-foreground">
          Ce graphique circulaire montre le pourcentage de commandes livrées par rapport aux commandes retournées
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full mt-8" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill={COLORS[0]}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label
                  value={`${tauxRetourNum}%`}
                  position="center"
                  fill="oklch(.592 .249 .584)"
                  fontSize="24px"
                  fontWeight="bold"
                />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center items-center gap-6 mt-12">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[0] }} />
            <span className="text-sm font-medium text-cyan-700">Livré</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[1] }} />
            <span className="text-sm font-medium text-pink-600">Retourné</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}