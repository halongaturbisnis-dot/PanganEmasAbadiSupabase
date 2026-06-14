import React from 'react';
import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceLine,
  AreaProps
} from 'recharts';
import { tokens } from '../../styles/tokens';
import { formatCurrency } from '../../../logic/utils/data';

export interface AreaChartSeries {
  dataKey: string;
  name: string;
  strokeColor: string;
  fillColor?: string; // If provided, used for gradient
  stackId?: string;
  isCurrency?: boolean;
}

interface AreaChartProps {
  data: any[];
  series: AreaChartSeries[];
  xAxisDataKey: string;
  height?: string;
  isMobile?: boolean;
  valueFormatter?: (value: number) => string;
  xAxisInterval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  series,
  xAxisDataKey,
  height = "15.625rem", // 250px
  isMobile = false,
  valueFormatter = (val) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    return abs >= 1000000 ? sign + (abs / 1000000).toFixed(1) + 'jt' : abs >= 1000 ? sign + (abs / 1000).toFixed(0) + 'rb' : val.toString();
  },
  xAxisInterval
}) => {
  const dynamicInterval = xAxisInterval !== undefined 
    ? xAxisInterval 
    : Math.ceil((data?.length || 0) / (isMobile ? 4 : 8));

  return (
    <div style={{ width: '100%', height: height === '100%' ? '100%' : height, minHeight: height !== '100%' ? height : undefined }} className="flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart 
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
        >
          <defs>
            {series.map((s, idx) => s.fillColor && (
              <linearGradient key={`gradient-${idx}`} id={`fill-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.fillColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={s.fillColor} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={tokens.primitives.colors.Slate300}
            verticalFill={[tokens.primitives.colors.Slate50, '#ffffff']}
            fillOpacity={0.2}
          />
          <ReferenceLine y={0} stroke={tokens.primitives.colors.Slate400} strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisDataKey} 
            axisLine={false} 
            tickLine={false}
            className="text-[9px] font-bold fill-TextColorMuted"
            dy={12}
            interval={dynamicInterval}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            className="text-[9px] font-bold fill-TextColorMuted"
            tickFormatter={valueFormatter}
          />
          <ChartTooltip 
            cursor={false}
            contentStyle={{ 
              borderRadius: tokens.semantic.radii.RadiusSmall,
              border: 'none',
              boxShadow: tokens.semantic.elevations.ElevationMd,
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
            itemStyle={{ padding: '2px 0' }}
            labelStyle={{ marginBottom: '8px', color: tokens.primitives.colors.Slate900, fontWeight: 800 }}
            formatter={(value: number, name: string) => {
              const matchedSeries = series.find(s => s.dataKey === name || s.name === name);
              return [matchedSeries?.isCurrency ? formatCurrency(value) : value, matchedSeries?.name || name];
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={40}
            iconType="circle"
            wrapperStyle={{ 
              fontSize: '9px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em'
            }} 
          />
          
          {series.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.strokeColor}
              fill={s.fillColor ? `url(#fill-${s.dataKey})` : s.strokeColor}
              stackId={s.stackId}
              strokeWidth={2}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
