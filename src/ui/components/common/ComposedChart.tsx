import React from 'react';
import { 
  ComposedChart as RechartsComposedChart, 
  Line, 
  Bar as RechartsBar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceLine,
  Area
} from 'recharts';
import { tokens } from '../../styles/tokens';
import { formatCurrency } from '../../../logic/utils/data';

export interface ComposedChartSeries {
  type: 'line' | 'bar' | 'area';
  dataKey: string;
  name: string;
  color: string;
  yAxisId?: 0 | 'right'; // Menggunakan 0 sebagai default bawaan Recharts
  stackId?: string;
  isCurrency?: boolean;
}

interface ComposedChartProps {
  data: any[];
  series: ComposedChartSeries[];
  xAxisDataKey: string;
  height?: string;
  isMobile?: boolean;
  xAxisInterval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  stackOffset?: 'sign' | 'expand' | 'none' | 'wiggle' | 'silhouette';
}

export const ComposedChart: React.FC<ComposedChartProps> = ({
  data,
  series,
  xAxisDataKey,
  height = "15.625rem",
  isMobile = false,
  xAxisInterval,
  stackOffset
}) => {
  const dynamicInterval = xAxisInterval !== undefined 
    ? xAxisInterval 
    : Math.ceil((data?.length || 0) / (isMobile ? 4 : 8));

  const hasRightAxis = series.some(s => s.yAxisId === 'right');

  const defaultFormatter = (val: number) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    return abs >= 1000000 
      ? sign + (abs / 1000000).toFixed(1) + 'jt' 
      : abs >= 1000 
        ? sign + (abs / 1000).toFixed(0) + 'rb' 
        : val.toString();
  };

  return (
    <div style={{ width: '100%', height: height === '100%' ? '100%' : height, minHeight: height !== '100%' ? height : undefined }} className="flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsComposedChart 
          data={data}
          margin={{ top: 20, right: hasRightAxis ? 20 : 30, left: 10, bottom: 20 }}
          stackOffset={stackOffset}
        >
          {/* CartesianGrid sekarang otomatis bisa membaca ticks dari YAxis default (0) */}
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
            className="text-[9px] font-bold fill-TextColorMuted uppercase"
            dy={12}
            interval={dynamicInterval}
          />
          
          {/* PERBAIKAN UTAMA: Menghapus yAxisId="left" agar bernilai default (0) */}
          <YAxis 
            axisLine={false} 
            tickLine={false}
            className="text-[9px] font-bold fill-TextColorMuted"
            tickFormatter={defaultFormatter}
            tickCount={5} 
          />
          
          {hasRightAxis && (
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false} 
              tickLine={false}
              className="text-[9px] font-bold fill-TextColorMuted"
              tickFormatter={(val) => val.toString()}
            />
          )}
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
              const formattedValue = matchedSeries?.isCurrency ? formatCurrency(value) : value;
              return [formattedValue, matchedSeries?.name || name];
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
          
          {series.map((s) => {
            // Jika yAxisId bukan 'right', paksa gunakan ID default 0 agar sinkron
            const currentYAxisId = s.yAxisId === 'right' ? 'right' : 0;

            if (s.type === 'bar') {
              return (
                <RechartsBar 
                  key={s.dataKey}
                  yAxisId={currentYAxisId}
                  dataKey={s.dataKey} 
                  name={s.name} 
                  fill={s.color} 
                  barSize={isMobile ? 12 : 20}
                  stackId={s.stackId}
                />
              );
            }
            if (s.type === 'line') {
              return (
                <Line 
                  key={s.dataKey}
                  yAxisId={currentYAxisId}
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name} 
                  stroke={s.color} 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              );
            }
            if (s.type === 'area') {
              return (
                <Area
                  key={s.dataKey}
                  yAxisId={currentYAxisId}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  fill={s.color}
                  strokeWidth={2}
                  stackId={s.stackId}
                />
              );
            }
            return null;
          })}
        </RechartsComposedChart>
      </ResponsiveContainer>
    </div>
  );
};