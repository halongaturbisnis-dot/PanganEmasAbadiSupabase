import React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { id } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const defaultClassNames = getDefaultClassNames();

  return (
    <div className={cn(
      "p-SpacingBase bg-ColorBg rounded-RadiusLarge shadow-ElevationHigh border border-ColorSidebarBorder/opacity-OpacitySubtle animate-in fade-in duration-DurationMid",
      "text-TextColorBase w-auto min-w-[320px]",
      className
    )}>
      <DayPicker
        locale={id}
        showOutsideDays={showOutsideDays}
        className={cn("w-full", className)}
        classNames={{
          months: cn("flex", isMobile ? "flex-col space-y-SpacingBase" : "flex-row space-x-SpacingBase space-y-0"),
          month: "space-y-SpacingSmall",
          month_caption: "flex justify-center pt-SpacingTiny relative items-center mb-SpacingBase",
          caption_label: "text-FontSizeBase font-bold text-TextColorBase",
          nav: "space-x-SpacingTiny flex items-center",
          button_previous: "absolute left-1 flex items-center justify-center p-SpacingTiny rounded-RadiusMedium hover:bg-ColorSidebarAccent text-TextColorMuted hover:text-TextColorBase transition-all active:scale-TransformShrink",
          button_next: "absolute right-1 flex items-center justify-center p-SpacingTiny rounded-RadiusMedium hover:bg-ColorSidebarAccent text-TextColorMuted hover:text-TextColorBase transition-all active:scale-TransformShrink",
          table: "w-full border-collapse",
          head_row: "flex w-full mb-SpacingTiny",
          head_cell: "text-TextColorMuted w-9 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center",
          row: "flex w-full mt-1",
          cell: "h-9 w-9 text-center text-FontSizeSm p-0 flex items-center justify-center relative",
          button_next_year: "hidden",
          button_previous_year: "hidden",
          day_button: cn(
             "h-9 w-9 p-0 font-medium hover:bg-ColorSidebarAccent rounded-RadiusMedium flex items-center justify-center",
             "transition-all duration-DurationFast outline-none focus-visible:ring-2 focus-visible:ring-ColorPrimary focus-visible:ring-offset-1 focus-visible:ring-offset-ColorBg active:scale-TransformShrink"
          ),
          today: "text-ColorPrimary font-extrabold",
          selected: "bg-ColorPrimary text-White rounded-none font-bold",
          range_start: "rounded-l-RadiusMedium bg-ColorPrimary text-White",
          range_end: "rounded-r-RadiusMedium bg-ColorPrimary text-White",
          range_middle: "bg-ColorPrimary/20 text-black rounded-none font-medium",
          disabled: "text-TextColorMuted opacity-OpacitySubtle cursor-not-allowed",
          hidden: "invisible",
          outside: "text-TextColorMuted opacity-OpacitySubtle aria-selected:bg-ColorPrimary/10",
          ...classNames,
        }}
        components={{
          Chevron: (props) => {
            if (props.orientation === 'left') {
              return <ChevronLeft className="h-spacing-SpacingSmall w-spacing-SpacingSmall" />;
            }
            return <ChevronRight className="h-spacing-SpacingSmall w-spacing-SpacingSmall" />;
          },
        }}
        {...props}
      />
    </div>
  );
}
