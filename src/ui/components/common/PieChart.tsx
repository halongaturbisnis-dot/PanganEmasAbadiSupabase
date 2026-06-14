import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { tokens } from '../../styles/tokens';
import { formatCurrency } from '../../../logic/utils/data';

export interface PieChartProps {
  data: { label: string; value: number; [key: string]: any }[];
  height?: string | number;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  isMobile?: boolean;
}

// Kita urutkan: Primary, Secondary, baru sisanya
const DEFAULT_COLORS = [
  tokens.semantic.colors.light.ColorPrimary, // Index 0
  tokens.semantic.colors.light.ColorSecondary, // Index 1
  '#FF9500', 
  '#5856D6', 
  '#FF2D55', 
  '#AF52DE', 
  '#30D158', 
  '#FFCC00', 
  '#5AC8FA'
];

// Fungsi helper untuk generate warna hex acak
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = "15.625rem",
  colors = DEFAULT_COLORS,
  valueFormatter = (val) => formatCurrency(val),
  isMobile = false
}) => {
  const isEmpty = !data || data.length === 0 || data.every(d => d.value === 0);

  if (isEmpty) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
        Belum ada data
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const rawValue = payload[0].value;
      return (
        <div 
          className="rounded-RadiusMedium shadow-ShadowMedium p-SpacingSmall"
          style={{
            backgroundColor: '#FFFFFF', // Putih solid
            zIndex: 9999,               // Z-index tertinggi
            position: 'relative',
            border: '1px solid #E5E7EB'
          }}
        >
          <p className="text-FontSizeSm font-bold text-TextColorBase mb-1">{payload[0].name}</p>
          <p className="text-FontSizeSm text-TextColorMuted">
            <span className="font-medium">{valueFormatter(rawValue)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={isMobile ? 80 : 100}
            fill="#8884d8"
            dataKey="value"
            nameKey="label"
          >
            {data.map((entry, index) => {
              let fillColor: string;

              if (index === 0) {
                // Prioritas 1: Warna Pertama (Primary)
                fillColor = colors[0];
              } else if (index === 1) {
                // Prioritas 2: Warna Kedua (Secondary)
                fillColor = colors[1];
              } else {
                // Prioritas 3: Sisa Warna Default
                // Kita kurangi 2 karena index 0 & 1 sudah dipakai Primary/Secondary
                const remainingDefaultColors = colors.slice(2);
                const relativeIndex = index - 2;

                if (relativeIndex < remainingDefaultColors.length) {
                  fillColor = remainingDefaultColors[relativeIndex];
                } else {
                  // Jika warna default habis, gunakan warna Random
                  fillColor = getRandomColor();
                }
              }

              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};