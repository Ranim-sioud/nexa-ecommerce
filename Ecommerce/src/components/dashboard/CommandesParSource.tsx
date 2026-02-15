import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalendarRangeIcon } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from "recharts";
import { CommandeSource } from "../types/dashboard";

interface Props {
  commandesParSource: CommandeSource[];
  dateRange: {
    start: string;
    end: string;
  };
  formatTitleDate: (dateString: string) => string;
  getSourceColor: (source: string) => string;
}

export function CommandesParSource({ 
  commandesParSource, 
  dateRange, 
  formatTitleDate,
  getSourceColor 
}: Props) {
  const pieData = commandesParSource.map((s) => ({
    name: s.source,
    value: s.count,
  }));

  const totalCommandes = pieData.reduce(
    (sum, entry) => sum + entry.value,
    0
  );

  if (totalCommandes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-md font-semibold">
            <CalendarRangeIcon className="w-5 h-5 text-pink-600" />
            <span className="text-pink-600">
              {dateRange.start === dateRange.end 
                ? formatTitleDate(dateRange.start) 
                : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`
              }
            </span>
          </CardTitle>
          <h3 className="text-2xl font-bold">Commandes par source</h3>
          <p className="text-sm text-muted-foreground">
            Ce graphique circulaire montre le pourcentage de commandes par source
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
            {dateRange.start === dateRange.end 
              ? formatTitleDate(dateRange.start) 
              : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`
            }
          </span>
        </CardTitle>
        <h3 className="text-2xl font-bold">Commandes par source</h3>
        <p className="text-sm text-muted-foreground">
          Ce graphique circulaire montre le pourcentage de commandes par source
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="w-full md:w-1/2" style={{ height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={91}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSourceColor(entry.name)} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} commandes`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-3">
            {pieData.map((entry, index) => {
              const percentage = ((entry.value / totalCommandes) * 100).toFixed(1);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm border-b pb-1"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getSourceColor(entry.name),
                      }}
                    />
                    <span className="text-gray-700 font-medium">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {entry.value} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}