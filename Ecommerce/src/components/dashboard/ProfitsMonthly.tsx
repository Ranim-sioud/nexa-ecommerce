import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalendarRangeIcon } from "lucide-react";
import LineDoubleChart from "../charts/LineDoubleChart";
import { MonthlyDataItem } from "../types/dashboard";

interface Props {
  data: MonthlyDataItem[];
}

export default function ProfitsMonthly({ data }: Props) {
  // Transformer les données pour LineDoubleChart
  const chartData = data.map(item => ({
    name: item.name || item.date || '',
    profits: item.profits || item.profit || 0,
    commandes: item.commandes || item.perte || 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex text-pink-600 text-md gap-1">
          <CalendarRangeIcon className="w-5 h-5"/> 6 DERNIERS MOIS
        </CardTitle>
        <h3 className="text-lg font-bold">Profits mensuels et commandes</h3>
        <p className="text-sm text-muted-foreground">
          Profits et commandes sur les 6 derniers mois
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <LineDoubleChart 
            data={chartData}
            line1Key="profits"
            line1Name="Profits"
            line1Color="oklch(.777 .152 181.912)"
            line2Key="commandes"
            line2Name="Commandes"
            line2Color="oklch(.592 .249 .584)"
            tooltipLabelFormatter={(label) => `Mois: ${label}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}