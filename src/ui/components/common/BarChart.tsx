import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList,
  ReferenceLine,
  BarProps
} from 'recharts';
import { tokens } from '../../styles/tokens';
import { formatCurrency } from '../../../logic/utils/data';

interface BarChartProps {
  data: any[];
  dataKey: string;
  labelKey: string;
  layout?: 'horizontal' | 'vertical';
  height?: string;
  barColor?: string;
  showGrid?: boolean;
  yAxisWidth?: number;
  maxBarSize?: number;
  radius?: number | [number, number, number, number];
  valueFormatter?: (value: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  labelKey,
  layout = 'horizontal',
  height = "15.625rem", // 250px
  barColor = tokens.semantic.colors.light.ColorPrimary,
  showGrid = true,
  yAxisWidth = 100,
  maxBarSize = 60,
  radius = [4, 4, 0, 0],
  valueFormatter = (val: number) => formatCurrency(val)
}) => {
  const isVertical = layout === 'vertical';

  return (
    <div style={{ width: '100%', height: height === '100%' ? '100%' : height, minHeight: height !== '100%' ? height : undefined }} className="flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout as 'horizontal' | 'vertical'}
          margin={isVertical ? { top: 5, right: 100, left: 20, bottom: 5 } : { top: 40, right: 30, left: 10, bottom: 40 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={!isVertical} 
              horizontal={isVertical}
              stroke={tokens.primitives.colors.White}
              verticalFill={!isVertical ? [tokens.primitives.colors.Slate50, '#ffffff'] : undefined}
              fillOpacity={0.0}
            />
          )}

          <ReferenceLine x={isVertical ? 0 : undefined} y={isVertical ? undefined : 0} stroke={tokens.primitives.colors.Slate400} strokeDasharray="3 3" />
          
          <XAxis 
            type={isVertical ? "number" : "category"} 
            dataKey={isVertical ? undefined : labelKey}
            hide={isVertical}
            axisLine={false} 
            tickLine={false} 
            className="!text-FontSizeNano font-bold fill-TextColorMuted uppercase" 
            dy={16}
          />
          
          <YAxis 
            type={isVertical ? "category" : "number"}
            dataKey={isVertical ? labelKey : undefined}
            hide={!isVertical}
            axisLine={false}
            tickLine={false}
            width={isVertical ? yAxisWidth : undefined}
            className="!text-[2px] font-bold fill-TextColorMuted"
          />

          <ChartTooltip 
            cursor={false}
            contentStyle={{ 
              borderRadius: tokens.semantic.radii.RadiusSmall,
              border: 'none',
              boxShadow: tokens.semantic.elevations.ElevationMd,
              fontSize: '10px'
            }}
            formatter={(value: number) => [valueFormatter(value), 'Total']}
          />

          <Bar 
            dataKey={dataKey} 
            fill={barColor} 
            radius={(isVertical ? [0, 4, 4, 0] : radius) as any} 
            maxBarSize={maxBarSize}
          >
            <LabelList 
              dataKey={dataKey} 
              position={isVertical ? "right" : "top"} 
              offset={12}
              formatter={(val: number) => isVertical ? valueFormatter(val) : (val >= 1000000 ? (val / 1000000).toFixed(1) + 'jt' : (val / 1000).toFixed(0) + 'rb')}
              className="fill-TextColorBase !text-FontSizeNano font-black"
              dy={isVertical ? 0 : -10}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
