import React, { useState, useMemo, useRef, useEffect, useId } from 'react';
import { Settings2, Download, Search, Check, X, ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox } from './Table';
import { SearchInput } from '../elements/Inputs';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  exportable?: boolean;
}

interface DataTablePlusProps<T> {
  data: T[];
  columns: Column<T>[];
  onExport?: (data: T[]) => void;
  className?: string;
  onSelectionChange?: (selectedRows: T[]) => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  id?: string;
  hideToolbar?: boolean;
  hideSearch?: boolean;
  hideBorder?: boolean;
  hideSelection?: boolean;
}

/**
 * DataTablePlus Component
 * Fully integrated with tokens.ts and global.css standards.
 * Supports column toggling, search, and export with unique ID generation.
 */
export function DataTablePlus<T extends Record<string, any>>({
  data,
  columns,
  onExport,
  className,
  onSelectionChange,
  onSearchChange,
  searchValue,
  id,
  hideToolbar = false,
  hideSearch = false,
  hideBorder = false,
  hideSelection = false
}: DataTablePlusProps<T>) {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [visibleKeys, setVisibleKeys] = useState<string[]>(columns.map(c => c.key as string));
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  
  const searchTerm = searchValue !== undefined ? searchValue : internalSearchTerm;

  const setSearchTerm = (val: string) => {
    if (searchValue === undefined) {
      setInternalSearchTerm(val);
    }
    onSearchChange?.(val);
  };
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const finalId = id || `data-table-${generatedId.replace(/:/g, '')}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (searchTerm) {
      result = result.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const visibleColumns = useMemo(() => {
    return columns.filter(c => visibleKeys.includes(c.key as string));
  }, [columns, visibleKeys]);

  const toggleColumn = (key: string) => {
    setVisibleKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const realIds = new Set(filteredData.map(row => row.id || row.key || Math.random())); 
      setSelectedIds(realIds);
      onSelectionChange?.(filteredData);
    }
  };

  const toggleSelectRow = (row: T, rowId: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedIds(newSelected);
    const selectedRows = filteredData.filter(r => newSelected.has(r.id || r.key || filteredData.indexOf(r)));
    onSelectionChange?.(selectedRows);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
  };

  return (
    <div id={finalId} className={cn("space-y-SpacingMedium", className)}>
      {/* Toolbar */}
      {!hideToolbar && (
        <div id={`${finalId}-toolbar`} className={cn("flex items-center justify-between gap-SpacingMedium", isMobile ? "flex-col px-SpacingBase" : "flex-row px-SpacingTiny")}>
          {!hideSearch && (
            <div id={`${finalId}-search-wrapper`} className={cn("flex-1", isMobile ? "w-full" : "max-w-sm")}>
              <SearchInput 
                id={`${finalId}-search-input`}
                value={searchTerm}
                onSearch={setSearchTerm}
                placeholder="Cari data..."
                className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
              />
            </div>
          )}

          <div id={`${finalId}-controls`} className={cn("flex items-center gap-SpacingSmall relative z-ZTopmost", isMobile ? "w-full" : "w-auto ml-auto")}>
            {/* Column Visibility Toggler */}
            <div ref={menuRef} className={cn("relative", isMobile ? "flex-1" : "flex-none")}>
              <button 
                id={`${finalId}-col-toggle`}
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className={cn(
                  "flex h-spacing-SpacingHuge items-center justify-between gap-SpacingSmall px-SpacingBase py-SpacingSmall bg-ColorPrimary border border-ColorPrimary rounded-RadiusMedium text-FontSizeSm transition-all duration-DurationFast shadow-ElevationLow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ColorPrimary/OpacitySubtle",
                  isMobile ? "w-full" : "w-32",
                  showColumnMenu && "ring-2 ring-ColorPrimary/OpacitySubtle shadow-ElevationMid"
                )}
              >
                <div className="flex items-center gap-SpacingSmall truncate">
                  <Settings2 size="1.125rem" className="text-ColorBg transition-colors" />
                  <span className="font-bold text-ColorBg">Kolom</span>
                </div>
                <ChevronDown size="1rem" className={cn("text-ColorBg transition-transform duration-DurationMid", showColumnMenu && "rotate-180")} />
              </button>

              {showColumnMenu && (
                <div 
                  id={`${finalId}-col-menu`} 
                  className="absolute right-0 top-full mt-SpacingSmall w-64 z-[9999] bg-ColorBg border border-ColorSidebarBorder/OpacitySubtle rounded-RadiusLarge shadow-ElevationHigh overflow-hidden animate-in fade-in slide-in-from-top-spacing-SpacingTiny duration-DurationMid"
                >
                  <div id={`${id}-col-menu-header`} className="px-SpacingMedium py-SpacingSmall text-FontSizeNano font-bold text-TextColorMuted border-b border-ColorSidebarBorder/OpacitySubtle bg-ColorBg flex justify-between items-center">
                    <span>Tampilkan Kolom</span>
                    <button onClick={() => setShowColumnMenu(false)} className="hover:text-ColorPrimary transition-colors">
                      <X size="0.875rem" />
                    </button>
                  </div>
                  <div id={`${finalId}-col-list`} className="h-[18rem] overflow-y-auto custom-scrollbar p-SpacingNano bg-ColorBg">
                    {columns.map((col, idx) => {
                      const isVisible = visibleKeys.includes(col.key as string);
                      return (
                        <div
                          key={col.key as string}
                          id={`${finalId}-col-opt-${String(col.key)}`}
                          onClick={() => toggleColumn(col.key as string)}
                          className={cn(
                            "flex items-start justify-between px-SpacingSmall py-SpacingSmall rounded-RadiusMedium cursor-pointer transition-all duration-DurationFast font-normal gap-SpacingTiny",
                            isVisible ? "bg-ColorPrimary/10 text-ColorPrimary" : "hover:bg-ColorPrimary/10 text-TextColorBase"
                          )}
                        >
                          <span className="flex-1 whitespace-normal break-words text-FontSizeSm">
                            {col.label}
                          </span>
                          {isVisible && (
                            <Check size="1rem" className="text-ColorPrimary shrink-0 mt-SpacingNano" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            {onExport && (
              <button 
                id={`${finalId}-export-btn`}
                onClick={() => onExport(filteredData)}
                className={cn("flex items-center justify-center gap-SpacingSmall px-SpacingMedium py-SpacingSmall bg-ColorPrimary text-ColorBg rounded-RadiusMedium text-FontSizeXs hover:opacity-OpacityMuted transition-opacity", isMobile ? "flex-1" : "flex-none")}
              >
                <Download size="1rem" />
                <span>Ekspor</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div id={`${finalId}-table-container`} className={cn("overflow-x-auto bg-ColorBg", !hideBorder && "rounded-RadiusMedium border border-ColorSidebarBorder/OpacitySubtle")}>
        <Table id={`${finalId}-main-table`} noBorder={hideBorder}>
          <TableHeader id={`${finalId}-table-header`}>
            <TableRow id={`${finalId}-header-row`} isHeader noBorder={hideBorder}>
              {!hideSelection && (
                <TableHead id={`${finalId}-th-select`}>
                  <TableCheckbox 
                    id={`${finalId}-check-all`}
                    checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredData.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {visibleColumns.map(col => (
                <TableHead 
                  key={col.key as string} 
                  id={`${finalId}-th-${String(col.key)}`}
                  isSortable={col.sortable !== false}
                  sortDirection={sortConfig.key === col.key ? sortConfig.direction : null}
                  onSort={(dir) => handleSort(col.key as string, dir)}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody id={`${finalId}-table-body`}>
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => {
                const rowId = row.id || row.key || idx;
                return (
                  <TableRow 
                    id={`${finalId}-row-${idx}`}
                    key={idx} 
                    data-state={selectedIds.has(rowId) ? "selected" : undefined}
                    noBorder={hideBorder}
                  >
                    {!hideSelection && (
                      <TableCell id={`${finalId}-td-select-${idx}`} noBorder={hideBorder}>
                        <TableCheckbox 
                          id={`${finalId}-check-row-${idx}`}
                          checked={selectedIds.has(rowId)}
                          onChange={() => toggleSelectRow(row, rowId)}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map(col => (
                      <TableCell key={col.key as string} id={`${finalId}-td-${idx}-${String(col.key)}`} noBorder={hideBorder}>
                        {col.render ? col.render(row) : row[col.key as string]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow id={`${finalId}-no-data-row`} noBorder={hideBorder}>
                <TableCell colSpan={visibleColumns.length + (hideSelection ? 0 : 1)} id={`${finalId}-td-empty`} className="h-48 text-center text-TextColorMuted italic" noBorder={hideBorder}>
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

