import React, { useState, useEffect, useRef } from 'react';
import { DayPicker, DateRange, getDefaultClassNames } from 'react-day-picker';
import { format, addDays, startOfMonth, endOfMonth, subDays, subMonths, isSameDay, differenceInDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { PrimaryButton, InCommonButton, TertiaryButton } from './Button';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { FixedDropdown } from './Dropdown';
import 'react-day-picker/style.css';

export interface DateRangePickerProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pilih rentang tanggal",
}: DateRangePickerProps) {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Internal state for selection before applying
  const [internalDate, setInternalDate] = useState<DateRange | undefined>(date);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    date?.to ? (isMobile ? date.to : subMonths(date.to, 1)) : new Date()
  );

  // Sync internal state if external date changes when closed
  useEffect(() => {
    if (!showCalendar) {
      setInternalDate(date);
    }
  }, [date, showCalendar]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    if (onDateChange) {
      if (internalDate?.from && !internalDate?.to) {
        onDateChange({ from: internalDate.from, to: internalDate.from });
      } else {
        onDateChange(internalDate);
      }
    }
    setShowCalendar(false);
  };

  const handleSelect = (range: DateRange | undefined, selectedDay: Date) => {
    if (internalDate?.from && internalDate?.to) {
      // If a range is already fully selected, clicking again resets to just that day
      setInternalDate({ from: selectedDay, to: undefined });
    } else if (internalDate?.from && !internalDate?.to && isSameDay(internalDate.from, selectedDay)) {
      // Clicking the same day twice confirms a single day range
      setInternalDate({ from: selectedDay, to: selectedDay });
    } else {
      // Normal range selection
      setInternalDate(range);
    }
  };

  // Quick Selects
  const today = new Date();
  const presets = [
    { label: "Hari Ini", range: { from: today, to: today } },
    { label: "Kemarin", range: { from: subDays(today, 1), to: subDays(today, 1) } },
    { label: "7 Hari Terakhir", range: { from: subDays(today, 6), to: today } },
    { label: "Bulan Ini", range: { from: startOfMonth(today), to: endOfMonth(today) } },
    { label: "30 Hari Terakhir", range: { from: subDays(today, 29), to: today } },
    { label: "3 Bulan Terakhir", range: { from: subMonths(startOfMonth(today), 2), to: today } },
  ];

  const isValidRange = !!internalDate?.from && (!internalDate.to || Math.abs(differenceInDays(internalDate.to, internalDate.from)) <= 92);

  return (
    <div className={cn("relative z-[60]", className)}>
     <PrimaryButton
  variant="outline"
  onClick={() => {
    if (!showCalendar) {
      const referenceDate = internalDate?.to || internalDate?.from || new Date();
      setCalendarMonth(isMobile ? referenceDate : subMonths(referenceDate, 1));
    }
    setShowCalendar(!showCalendar);
  }}
  className={cn(
    // REVISI DI SINI:
    "flex items-center gap-2 border border-Black/15 px-3 py-2 rounded-RadiusMedium bg-white hover:bg-slate-100 transition-colors text-TextColorBase",
    "shadow-none font-medium h-auto"
  )}
>
  {/* Tambahkan Ikon Kalender di sini */}
  <CalendarIcon size={16} className="text-TextColorMuted" />
  
  <span className="text-FontSizeSm">
    {date?.from ? (
      date.to ? (
        <>
          {format(date.from, "MMM dd, yyyy", { locale: localeId })} -{" "}
          {format(date.to, "MMM dd, yyyy", { locale: localeId })}
        </>
      ) : (
        format(date.from, "MMM dd, yyyy", { locale: localeId })
      )
    ) : (
      <span>{placeholder}</span>
    )}
  </span>
  
  <ChevronDown 
    size={16} 
    className={cn("transition-transform duration-DurationMid ml-1", showCalendar && "rotate-180")} 
  />
</PrimaryButton>

      {showCalendar && (
        <div
          ref={calendarRef}
          className={cn(
            "absolute top-full right-0 mt-2 animate-in fade-in zoom-in-95 duration-DurationMid shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-Black/15",
            "bg-ColorBg rounded-RadiusLarge flex flex-col"
          )}
        >
          <div className="flex flex-col">
              <DayPicker
                mode="range"
                locale={localeId}
                selected={internalDate}
                onSelect={handleSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                numberOfMonths={isMobile ? 1 : 2}
                disabled={{ after: new Date() }}
                max={93}
                className="w-auto min-w-[320px]"
                classNames={{
                  root: "relative p-SpacingSmall",
                  months: cn("flex", isMobile ? "flex-col space-y-SpacingSmall mt-8" : "flex-row space-x-SpacingSmall space-y-0"),
                  month: "space-y-SpacingSmall",
                  month_caption: "flex justify-center items-center h-6 mb-SpacingSmall",
                  caption_label: "text-FontSizeSm font-bold text-TextColorBase select-none",
                  nav: cn("absolute flex justify-between pointer-events-none", isMobile ? "top-SpacingSmall left-SpacingSmall right-SpacingSmall" : "top-SpacingSmall left-SpacingSmall right-SpacingSmall"),
                  button_previous: "pointer-events-auto flex items-center justify-center p-0.5 rounded-RadiusMedium hover:bg-ColorSidebarAccent text-TextColorMuted hover:text-TextColorBase transition-all active:scale-TransformShrink",
                  button_next: "pointer-events-auto flex items-center justify-center p-0.5 rounded-RadiusMedium hover:bg-ColorSidebarAccent text-TextColorMuted hover:text-TextColorBase transition-all active:scale-TransformShrink",
                  table: "w-full border-collapse",
                  head_row: "flex w-full mb-SpacingTiny",
                  head_cell: "text-TextColorMuted w-8 font-bold text-[9px] uppercase tracking-widest flex items-center justify-center",
                  row: "flex w-full mt-1",
                  cell: "h-8 w-8 text-center text-FontSizeXs p-0 flex items-center justify-center relative",
                  // Added text-FontSizeNano here
                  day_button: cn(
                     "h-8 w-8 p-0 font-medium hover:bg-ColorSecondary rounded-RadiusMedium flex items-center justify-center",
                     "transition-all duration-DurationFast outline-none focus-visible:ring-2 focus-visible:ring-ColorPrimary focus-visible:ring-offset-1 focus-visible:ring-offset-ColorBg active:scale-TransformShrink text-FontSizeXs"
                  ),
                  today: "text-ColorPrimary font-extrabold",
                  selected: "bg-ColorPrimary text-White rounded-none font-bold",
                  range_start: "rounded-l-RadiusMedium bg-ColorPrimary text-White",
                  range_end: "rounded-r-RadiusMedium bg-ColorPrimary text-White",
                  range_middle: "bg-ColorPrimary/20 text-black rounded-none font-medium",
                  disabled: "text-TextColorMuted opacity-OpacitySubtle cursor-not-allowed",
                  hidden: "invisible",
                  outside: "text-TextColorMuted opacity-OpacitySubtle aria-selected:bg-ColorPrimary/10"
                } as any}
                components={{
                  Chevron: (props) => {
                    if (props.orientation === 'left') {
                      return <ChevronLeft className="h-4 w-4" />;
                    }
                    return <ChevronRight className="h-4 w-4" />;
                  },
                }}
              />
            {/* Footer with Presets and Oke */}
            <div className="px-SpacingSmall pb-SpacingSmall flex justify-end items-center gap-SpacingSmall bg-transparent">
              <div className="w-[180px]">
                <FixedDropdown 
  options={presets.map(p => ({ label: p.label, value: p.label }))}
  value={undefined}
  placeholder="Pilihan Cepat..."
  placement="top"
  onChange={(val) => {
    const preset = presets.find(p => p.label === val);
    if (preset) {
      setInternalDate(preset.range);
      setCalendarMonth(isMobile ? preset.range.to : subMonths(preset.range.to, 1));
    }
  }}
  // REVISI DI SINI:
  className={cn(
    "transition-colors duration-200",
    "px-3 py-2 text-FontSizeSm font-medium cursor-pointer",
    // Tambahkan pl-4 atau sesuaikan dengan keinginan Anda
    "pl-4" 
  )}
/>
              </div>
              <PrimaryButton 
                onClick={handleApply}
                disabled={!isValidRange}
                className={cn(!isValidRange && "bg-Slate200 hover:bg-Slate200 text-Slate400 cursor-not-allowed border-transparent")}
              >
                Oke
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}