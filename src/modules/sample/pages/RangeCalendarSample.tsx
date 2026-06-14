import React, { useState } from 'react';
import { Calendar } from '../../../ui/components/elements/Calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { cn } from '../../../logic/utils/cn';
import { Calendar as CalendarIcon } from 'lucide-react';

export function RangeCalendarSample({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 8),
  });

  return (
    <div className={cn("p-6 max-w-lg mx-auto bg-bg rounded-xl shadow-md border border-tertiary/20 flex flex-col items-center gap-6", className)}>
      <div className="flex flex-col text-center space-y-1 w-full pb-4 border-b border-tertiary/20">
        <h3 className="text-h3 font-semibold text-text-base mb-1 inline-flex items-center justify-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          Range Calendar
        </h3>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          Built with pure react-day-picker + date-fns, styled natively mapped to <code>tokens.ts</code>
        </p>
      </div>

      {dateRange?.from ? (
        <div className="text-sm font-medium bg-secondary/10 px-4 py-2 rounded-lg text-primary flex items-center justify-center mb-2 animate-in fade-in duration-300">
          <span>{format(dateRange.from, 'PPP')}</span>
          <span className="mx-2 text-text-muted">to</span>
          <span>{dateRange.to ? format(dateRange.to, 'PPP') : '...'}</span>
        </div>
      ) : (
        <div className="text-sm bg-tertiary/10 px-4 py-2 rounded-lg text-text-muted mb-2 animate-in fade-in duration-300">
          Please select a date range.
        </div>
      )}

      {/* The Actual Core Calendar Component rendered in Range mode */}
      <Calendar
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        className="w-full flex justify-center py-2 relative overflow-hidden"
      />
    </div>
  );
}
