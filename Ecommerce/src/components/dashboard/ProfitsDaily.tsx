import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalendarRangeIcon } from "lucide-react";
import LineDoubleChart from "../charts/LineDoubleChart";
import { DailyDataItem } from "../types/dashboard";

interface Props {
  data: DailyDataItem[];
}

export default function ProfitsDaily({ data }: Props) {
  // Transformer les données pour LineDoubleChart
  const chartData = data.map(item => ({
    name: item.name || item.date || '',
    profits: item.profits || item.profit || 0,
    commandes: item.commandes || item.perte || 0
  }));

  // Trier les données par date (ordre chronologique)
  const sortedData = [...chartData].sort((a, b) => {
    if (a.name && b.name) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex text-pink-600 text-md gap-1">
          <CalendarRangeIcon className="w-5 h-5"/> 10 DERNIERS JOURS
        </CardTitle>
        <h3 className="text-lg font-semibold">Profits quotidiens et commandes</h3>
        <p className="text-sm text-muted-foreground">
          Profits et commandes sur les 10 derniers jours
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <LineDoubleChart 
            data={sortedData}
            line1Key="profits"
            line1Name="Profits"
            line1Color="oklch(.777 .152 181.912)"
            line2Key="commandes"
            line2Name="Commandes"
            line2Color="oklch(.592 .249 .584)"
            tooltipLabelFormatter={(label) => `Jour: ${label}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}