import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { DateInput } from './DateTimeInput';
import { Label } from './Label';
import { Calendar } from 'lucide-react';
import { tokens } from '../../styles/tokens';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  className?: string;
  label?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
  label = "Rentang Tanggal"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label className="flex items-center gap-2"><Calendar size={tokens.primitives.fontSizes.FontSizeSm} className="text-ColorPrimary" /> {label}</Label>}
      <div className={cn(
        "flex items-center gap-2",
        isMobile ? "flex-col items-stretch" : "flex-row"
      )}>
        <DateInput 
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="flex-1"
          placeholder="Mulai"
        />
        <div className={cn(
          "text-TextColorMuted font-bold",
          isMobile ? "text-center py-1" : "px-1"
        )}>-</div>
        <DateInput 
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="flex-1"
          placeholder="Akhir"
        />
      </div>
    </div>
  );
};
