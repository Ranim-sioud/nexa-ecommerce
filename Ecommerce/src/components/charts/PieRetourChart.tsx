import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label,
  Tooltip
} from "recharts";

interface PieData {
  name: string;
  value: number;
}

interface Props {
  data: PieData[];
  tauxRetourNum: number;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
  showLabel?: boolean;
  labelFontSize?: number;
}

export default function PieRetourChart({ 
  data, 
  tauxRetourNum, 
  innerRadius = 60,
  outerRadius = 100,
  colors = ["#ccc", "oklch(.592 .249 .584)"],
  showLabel = true,
  labelFontSize = 24
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill={colors[0]}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
          ))}
          {showLabel && (
            <Label
              value={`${tauxRetourNum}%`}
              position="center"
              fill="oklch(.592 .249 .584)"
              fontSize={labelFontSize}
              fontWeight="bold"
            />
          )}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [value.toLocaleString('fr-FR'), '']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}