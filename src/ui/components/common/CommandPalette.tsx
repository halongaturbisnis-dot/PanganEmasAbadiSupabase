import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, CornerDownLeft, Layout, Menu, Activity, Smartphone, Layers, TableProperties, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';

interface SearchItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  category: string;
}

/**
 * CommandPalette Component
 * Optimized with tokens.ts, global.css, and responsive standards.
 * All editorial content is hardcoded as per standards.
 */
export const CommandPalette: React.FC = () => {
  const { state, toggleCommandPalette } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const finalId = `command-palette-${generatedId.replace(/:/g, '')}`;

  const items: SearchItem[] = [
    { id: 'dashboard', label: 'Dashboard Utama', path: '/', icon: Layout, category: 'Menu Utama' },
    { id: 'menu', label: 'Menu Sampel', path: '/sample', icon: Menu, category: 'Menu Utama' },
    { id: 'advanced-ui', label: 'Skeleton & Empty State', path: '/sample/advanced-ui', icon: LayoutList, category: 'Sampel UI' },
    { id: 'data-table', label: 'Tabel Data Plus', path: '/sample/data-table-plus', icon: TableProperties, category: 'Sampel UI' },
    { id: 'form-wizard', label: 'Form Wizard Lanjutan', path: '/sample/form-wizard', icon: Layers, category: 'Sampel UI' },
    { id: 'versatile', label: 'Komponen Serbaguna', path: '/sample/versatile', icon: Smartphone, category: 'Sampel UI' },
    { id: 'monitoring', label: 'Monitoring Kunjungan', path: '/monitoring/visits', icon: Activity, category: 'Utilitas' },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (state.isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [state.isCommandPaletteOpen]);

  const handleSelect = (path: string) => {
    navigate(path);
    toggleCommandPalette(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      handleSelect(filteredItems[selectedIndex].path);
    } else if (e.key === 'Escape') {
      toggleCommandPalette(false);
    }
  };

  if (!state.isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div id={`${finalId}-overlay`} className="fixed inset-0 z-topmost flex items-start justify-center pt-SpacingHuge">
        {/* Backdrop */}
        <motion.div
          id={`${finalId}-backdrop`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => toggleCommandPalette(false)}
          className="fixed inset-0 bg-Black opacity-OpacitySubtle backdrop-blur-md"
        />

        {/* Palette */}
        <motion.div
          id={finalId}
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className={cn("relative w-full max-w-ContainerMd bg-ColorBg rounded-RadiusLarge shadow-ElevationHigh border border-ColorSidebarBorder/OpacityMuted overflow-hidden", isMobile ? "mx-SpacingBase" : "mx-0")}
          role="combobox"
          aria-expanded="true"
          aria-haspopup="listbox"
          aria-owns={`${finalId}-list`}
        >
          {/* Search Input */}
          <div id={`${finalId}-header`} className={cn("flex items-center gap-SpacingTiny border-b border-ColorSidebarBorder/OpacityMuted", isMobile ? "px-SpacingBase py-SpacingBase" : "px-SpacingLarge py-SpacingMedium")}>
            <Search className="text-TextColorMuted" size="1.25rem" />
            <input
              id={`${finalId}-input`}
              ref={inputRef}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-FontSizeBase text-TextColorBase placeholder:text-TextColorMuted"
              placeholder="Cari menu atau ketik perintah..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div id={`${finalId}-esc-badge`} className={cn("items-center gap-SpacingNano px-SpacingTiny py-SpacingNano rounded-RadiusSmall bg-ColorSidebarBorder/OpacitySubtle text-TextColorMuted", isMobile ? "hidden" : "flex")}>
              <span className="text-FontSizeNano font-bold text-TextColorMuted">ESC</span>
            </div>
          </div>

          {/* Results List */}
          <div id={`${finalId}-listbox`} className="max-h-ContainerSm overflow-y-auto p-SpacingTiny custom-scrollbar" role="listbox">
            {filteredItems.length === 0 ? (
              <div id={`${finalId}-no-results`} className="py-SpacingHuge text-center text-TextColorMuted">
                <Command size="2.5rem" className="mx-auto mb-SpacingSmall opacity-OpacityMuted" />
                <p className="text-FontSizeSm">Hasil tidak ditemukan.</p>
              </div>
            ) : (
              <div id={`${finalId}-list`} className="space-y-SpacingNano">
                {filteredItems.map((item, index) => (
                  <button
                    id={`${finalId}-item-${item.id}`}
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleSelect(item.path)}
                    role="option"
                    aria-selected={selectedIndex === index}
                    className={cn(
                      "w-full flex items-center justify-between p-SpacingSmall rounded-RadiusBase transition-all text-left",
                      selectedIndex === index 
                        ? "bg-ColorSidebarAccent text-ColorPrimary" 
                        : "text-TextColorBase hover:bg-ColorSidebarAccent"
                    )}
                  >
                    <div className={cn("flex items-center", isMobile ? "gap-SpacingBase" : "gap-SpacingMedium")}>
                      <div className={cn(
                        "w-SpacingLarge h-SpacingLarge rounded-RadiusMedium flex items-center justify-center transition-colors",
                        selectedIndex === index ? "bg-ColorPrimary text-ColorBg" : "bg-ColorSidebarBorder/OpacitySubtle text-TextColorMuted"
                      )}>
                        <item.icon size="1.25rem" />
                      </div>
                      <div>
                        <p className="text-FontSizeSm font-semibold">{item.label}</p>
                        <p className="text-FontSizeNano text-TextColorMuted">di {item.category}</p>
                      </div>
                    </div>
                    {selectedIndex === index && (
                      <div className="flex items-center gap-SpacingTiny text-FontSizeNano text-TextColorMuted">
                        <span>Buka</span>
                        <CornerDownLeft size="0.75rem" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div id={`${finalId}-footer`} className={cn("px-SpacingLarge py-SpacingSmall bg-ColorSidebarAccent/OpacityMuted border-t border-ColorSidebarBorder/OpacityMuted items-center justify-between text-TextColorMuted", isMobile ? "hidden" : "flex")}>
            <div className="flex items-center gap-SpacingMedium">
              <div className="flex items-center gap-SpacingNano">
                <div className="w-5 h-5 flex items-center justify-center rounded border border-TextColorMuted opacity-OpacitySubtle">
                  <span className="text-FontSizeNano">↓</span>
                </div>
                <div className="w-5 h-5 flex items-center justify-center rounded border border-TextColorMuted opacity-OpacitySubtle">
                  <span className="text-FontSizeNano">↑</span>
                </div>
                <span className="text-FontSizeNano ml-1">Navigasi</span>
              </div>
            </div>
            <div className="flex items-center gap-SpacingNano text-FontSizeNano">
              <span className="opacity-OpacitySubtle">Tekan</span>
              <div className="flex items-center gap-0.5 px-SpacingTiny py-SpacingNano rounded border border-TextColorMuted opacity-OpacitySubtle">
                <Command size="0.625rem" />
                <span>K</span>
              </div>
              <span className="opacity-OpacitySubtle">untuk membuka</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
