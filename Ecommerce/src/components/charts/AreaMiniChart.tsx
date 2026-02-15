import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis
} from "recharts";

interface Props {
  data: { value: number }[];
  color: string;
  id: string;
  height?: number;
  showGradient?: boolean;
  strokeWidth?: number;
}

export default function AreaMiniChart({
  data,
  color,
  id,
  height = 100,
  showGradient = true,
  strokeWidth = 2.5
}: Props) {
  return (
    <div style={{ height: `${height}%` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          {showGradient && (
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={showGradient ? `url(#${id})` : color}
            fillOpacity={0.3}
            dot={false}
          />
          <YAxis hide domain={['dataMin', 'dataMax']} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}