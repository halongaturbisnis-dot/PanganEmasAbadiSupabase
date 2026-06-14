import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Globe, ChevronDown, Check } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { Button } from './Button';
import { LanguageList } from '../../styles/LanguageList';
import { cn } from '../../../logic/utils/cn';

export const ThemeLanguageSwitcher: React.FC<{ hideLanguage?: boolean; hideTheme?: boolean; id?: string }> = ({ 
  hideLanguage = false, 
  hideTheme = true,
  id = "theme-lang-switcher"
}) => {
  const { state, setState } = useGlobalState();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const toggleTheme = () => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    setState(prev => ({ ...prev, themeMode: nextTheme }));
  };

  const changeLanguage = (code: string) => {
    setState(prev => ({ ...prev, language: code }));
    setIsLangOpen(false);
  };

  const currentLang = LanguageList.find(l => l.code === state.language) || LanguageList[0];

  return (
    <div id={id} className="flex items-center gap-2">
      {/* Theme Toggle */}
      {!hideTheme && (
        <Button
          id={`${id}-theme-btn`}
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-RadiusMedium border-ColorSidebarBorder/opacity-OpacitySubtle hover:bg-ColorSidebarAccent text-TextColorBase transition-all"
        >
          {state.theme === 'light' ? <Sun id={`${id}-sun-icon`} size="1.25rem" /> : <Moon id={`${id}-moon-icon`} size="1.25rem" />}
        </Button>
      )}

      {/* Language Switcher */}
      {!hideLanguage && (
        <div id={`${id}-lang-wrapper`} className="relative">
          <Button
            id={`${id}-lang-btn`}
            variant="default"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="h-10 px-4 rounded-RadiusMedium flex items-center gap-2 bg-ColorPrimary text-White hover:opacity-OpacityHover shadow-ElevationLow transition-all"
          >
            <span id={`${id}-flag`} className="text-FontSizeSm">{currentLang.flag}</span>
            {!state.viewport.isMobile && (
              <span id={`${id}-code`} className="text-FontSizeXs font-black uppercase">
                {currentLang.code}
              </span>
            )}
            <ChevronDown id={`${id}-chevron`} size="0.875rem" className={cn("transition-transform", isLangOpen && "rotate-180")} />
          </Button>

          <AnimatePresence>
            {isLangOpen && (
              <>
                <div 
                  id={`${id}-backdrop`}
                  className="fixed inset-0 z-ZDropdown" 
                  onClick={() => setIsLangOpen(false)} 
                />
                
                <motion.div
                  id={`${id}-dropdown`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-ColorBg border border-ColorSidebarBorder/opacity-OpacityMuted rounded-RadiusMedium shadow-ElevationHigh p-2 z-ZDropdown"
                >
                  <div id={`${id}-dropdown-header`} className="px-3 py-2 border-b border-ColorSidebarBorder/opacity-OpacitySubtle mb-1">
                     <p id={`${id}-dropdown-title`} className="text-FontSizeNano font-black text-TextColorMuted uppercase tracking-wider">
                       Pilih Bahasa
                     </p>
                  </div>
                  {LanguageList.map((lang) => (
                    <button
                      id={`${id}-lang-item-${lang.code}`}
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-RadiusSmall transition-all text-left font-bold",
                        state.language === lang.code 
                          ? "bg-ColorPrimary/opacity-OpacitySubtle text-ColorPrimary" 
                          : "text-TextColorBase hover:bg-ColorSidebarAccent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-FontSizeSm">{lang.label}</span>
                      </div>
                      {state.language === lang.code && <Check size="1rem" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
