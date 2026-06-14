import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
  wrapperClassName?: string;
  noBorder?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, wrapperClassName, noBorder = false, id = "table", ...props }, ref) => {
    return (
      <div 
        id={`${id}-wrapper`} 
        className={cn(
          "w-full overflow-x-auto bg-ColorBg scrollbar-hide border-none shadow-none rounded-RadiusLarge", 
          wrapperClassName
        )}
      >
        <table
          ref={ref}
          id={id}
          className={cn("w-full table-auto caption-bottom text-FontSizeSm text-TextColorBase border-none", className)}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, id, ...props }, ref) => (
  <thead 
    ref={ref} 
    id={id} 
    className={cn(
      "bg-ColorPrimary", 
      "[&_tr]:!bg-transparent [&_tr]:hover:!bg-transparent [&_tr]:!border-b-0",
      "[&_tr:nth-child(even)]:!bg-transparent [&_tr:nth-child(odd)]:!bg-transparent",
      className
    )} 
    {...props} 
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, id, ...props }, ref) => (
  <tbody
    ref={ref}
    id={id}
    className={cn("rounded-b-RadiusLarge", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { noBorder?: boolean }
>(({ className, id, noBorder, ...props }, ref) => (
  <tfoot
    ref={ref}
    id={id}
    className={cn(
      "bg-ColorPrimary/opacity-OpacityMuted font-light", 
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  noBorder?: boolean;
  isHeader?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, id, noBorder, isHeader = false, ...props }, ref) => (
    <tr
      ref={ref}
      id={id}
      className={cn(
        "text-center transition-colors duration-DurationFast font-light relative z-10",
        isHeader && [
          "h-12", 
          "bg-transparent border-b-0 !hover:bg-transparent"
        ],
        !isHeader && [
          !noBorder && "border-b border-black/10", 
          "odd:bg-ColorBg even:bg-ColorPrimary/opacity-OpacityMuted", 
          "hover:bg-ColorPrimary/10", 
          "last:border-b-0",
        ],
        "data-[state=selected]:bg-ColorPrimary/opacity-OpacityMuted",
        className?.includes("no-hover") && "hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  isSortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: (direction: SortDirection) => void;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, id, isSortable, sortDirection = null, onSort, children, ...props }, ref) => {
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;

    const handleSort = () => {
      if (!isSortable || !onSort) return;
      
      let nextDirection: SortDirection = null;
      if (sortDirection === null) nextDirection = 'asc';
      else if (sortDirection === 'asc') nextDirection = 'desc';
      else nextDirection = null;
      
      onSort(nextDirection);
    };

    const isActive = sortDirection !== null;

    // DETEKSI OTOMATIS: Apakah isinya adalah checkbox?
    const isCheckbox = React.isValidElement(children) && (children.type === TableCheckbox || (children.props as any)?.type === 'checkbox');

    return (
      <th
        ref={ref}
        id={id}
        onClick={handleSort}
        className={cn(
          "h-12 px-0 align-middle tracking-tight font-semibold pointer-events-auto border-none relative",
          // PERUBAHAN: Memastikan teks berwarna ColorBg
          "text-ColorBg", 
          isMobile ? "text-FontSizeSm" : "text-FontSizeXs",
          // PERBAIKAN: Jika checkbox, lebarnya dikunci jadi 6.5rem (SpacingExtraHuge) murni dan dilindungi ! agar tidak di-override. Jika kolom biasa, gunakan 10rem.
          isCheckbox ? "!w-spacing-SpacingExtraHuge !min-w-spacing-SpacingExtraHuge text-center" : "min-w-spacing-SpacingMega text-left",
          isSortable && "cursor-pointer select-none hover:bg-black/5 transition-colors",
          className
        )}
        {...props}
      >
        {/* PERBAIKAN: Jika checkbox, bungkus dengan flex-center murni agar sejajar lurus ke bawah */}
        {isCheckbox ? (
          <div className="flex items-center justify-center w-full h-full">
            {children}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full relative h-full">
            <span className="w-full text-center truncate pl-4 pr-6 text-ColorBg">
              {children}
            </span>
            {isSortable && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 pr-2">
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <span className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
                    (isActive && sortDirection === 'asc') ? "opacity-100" : "opacity-0"
                  )}>
                    <ChevronUp id={`${id}-sort-asc`} className="w-3 h-3 text-ColorBg" />
                  </span>
                  <span className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
                    (isActive && sortDirection === 'desc') ? "opacity-100" : "opacity-0"
                  )}>
                    <ChevronDown id={`${id}-sort-desc`} className="w-3 h-3 text-ColorBg" />
                  </span>
                  <span className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
                    !isActive ? "opacity-100 text-ColorBg" : "opacity-0" 
                  )}>
                    <ChevronsUpDown id={`${id}-sort-none`} className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </th>
    );
  }
);
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { noBorder?: boolean }
>(({ className, id, noBorder, children, ...props }, ref) => {
  
  // DETEKSI OTOMATIS: Apakah isinya adalah checkbox?
  const isCheckbox = React.isValidElement(children) && (children.type === TableCheckbox || (children.props as any)?.type === 'checkbox');

  return (
    <td
      ref={ref}
      id={id}
      className={cn(
        "py-SpacingSmall align-middle font-normal text-FontSizeSm truncate break-words", 
        !noBorder && "border-b border-black/10",
        // PERBAIKAN: Jika checkbox, kecilkan padding samping dan samakan lebarnya jadi 6.5rem (SpacingExtraHuge) murni dan dilindungi ! agar tidak di-override.
        isCheckbox ? "px-0 !w-spacing-SpacingExtraHuge !min-w-spacing-SpacingExtraHuge text-center" : "px-SpacingMedium min-w-spacing-SpacingMega text-center",
        className
      )}
      {...props}
    >
      {/* PERBAIKAN: Memastikan isi checkbox berada di posisi center secara konsisten */}
      {isCheckbox ? (
        <div className="flex items-center justify-center w-full h-full">
          {children}
        </div>
      ) : (
        children
      )}
    </td>
  );
});
TableCell.displayName = "TableCell";

export const TableCheckbox = ({ checked, onChange, indeterminate, id }: { checked?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; indeterminate?: boolean; id?: string }) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      id={id}
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={onChange}
      className="w-SpacingBase h-SpacingBase rounded-RadiusTiny border-ColorSidebarBorder text-ColorPrimary focus:ring-ColorPrimary transition-all cursor-pointer accent-ColorPrimary"
    />
  );
};

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, id, ...props }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  return (
  <caption
    ref={ref}
    id={id}
    className={cn("mt-SpacingMedium text-TextColorMuted text-center font-medium", isMobile ? "text-FontSizeNano" : "text-FontSizeSm", className)}
    {...props}
  />
);
});
TableCaption.displayName = "TableCaption";