import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ChartTooltip 
} from 'recharts';
import { tokens } from '../../styles/tokens';
import { cn } from '../../../logic/utils/cn';

export interface DonutChartData {
  label: string;
  count: number;
  percentage: number;
  nominal?: number;
}

interface DonutChartProps {
  data: DonutChartData[];
  title?: string;
  centerLabel?: string;
  height?: string;
  isMobile?: boolean;
  colors?: string[];
}

// Urutan: Primary, Secondary, lalu daftar warna cadangan
const DEFAULT_COLORS = [
  tokens.semantic.colors.light.ColorPrimary, // Index 0 - Wajib
  tokens.semantic.colors.light.ColorSecondary, // Index 1 - Wajib
  '#30D158', 
  '#0A84FF', 
  '#FF9500',
  '#FF2D55',
  '#BF5AF2',
  '#FFD60A'
];

// Helper untuk generate warna acak
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  centerLabel = "Total",
  height = "11.25rem",
  isMobile = false,
  colors = DEFAULT_COLORS
}) => {
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className={cn("w-full relative flex items-center justify-center z-0", height === "100%" ? "h-full flex-1" : "")} style={{ height: height !== '100%' ? height : undefined }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
          >
            {data.map((entry, index) => {
              let fillColor: string;

              if (index === 0) {
                fillColor = colors[0];
              } else if (index === 1) {
                fillColor = colors[1];
              } else {
                const remainingDefaultColors = colors.slice(2);
                const relativeIndex = index - 2;

                if (relativeIndex < remainingDefaultColors.length) {
                  fillColor = remainingDefaultColors[relativeIndex];
                } else {
                  fillColor = getRandomColor();
                }
              }

              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
          </Pie>
          <ChartTooltip 
            wrapperStyle={{ zIndex: 50 }}
            contentStyle={{ 
              borderRadius: tokens.semantic.radii.RadiusSmall,
              border: 'none',
              boxShadow: tokens.semantic.elevations.ElevationMd,
              fontSize: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#ffffff', 
              opacity: 1, 
            }}
            formatter={(value: number, name: string, entry: any) => [
              <div className="flex flex-col gap-1">
                <span className="font-bold text-TextColorBase">{entry.payload.label}</span>
                <span className="text-TextColorMuted">Jml: {value}</span>
                <span className="text-TextColorBase">{entry.payload.percentage.toFixed(1)}%</span>
              </div>
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-2">
        <span className="text-FontSizeNano font-bold text-TextColorMuted uppercase tracking-tighter">{centerLabel}</span>
        <span className="text-FontSizeBase font-extrabold text-TextColorBase">
          {totalCount}
        </span>
      </div>
    </div>
  );
};