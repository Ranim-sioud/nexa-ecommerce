import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface ChartData {
  name: string;
  [key: string]: number | string;
}

interface Props {
  data: ChartData[];
  line1Key: string;
  line1Name: string;
  line1Color: string;
  line2Key: string;
  line2Name: string;
  line2Color: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  tooltipLabelFormatter?: (label: string) => string;
  margin?: { top: number; right: number; left: number; bottom: number };
}

export default function LineDoubleChart({ 
  data, 
  line1Key, 
  line1Name, 
  line1Color,
  line2Key,
  line2Name,
  line2Color,
  showLegend = true,
  showGrid = true,
  showDots = true,
  xAxisLabel,
  yAxisLabel,
  tooltipFormatter = (value: number) => [value.toLocaleString('fr-FR'), ''],
  tooltipLabelFormatter = (label: string) => label,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey="name" 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip 
          formatter={tooltipFormatter}
          labelFormatter={tooltipLabelFormatter}
        />
        <Line
          type="monotone"
          dataKey={line1Key}
          stroke={line1Color}
          strokeWidth={2}
          dot={showDots ? { r: 4 } : false}
          activeDot={{ r: 6 }}
          name={line1Name}
        />
        <Line
          type="monotone"
          dataKey={line2Key}
          stroke={line2Color}
          strokeWidth={2}
          dot={showDots ? { r: 4 } : false}
          activeDot={{ r: 6 }}
          name={line2Name}
        />
        {showLegend && <Legend />}
      </LineChart>
    </ResponsiveContainer>
  );
}