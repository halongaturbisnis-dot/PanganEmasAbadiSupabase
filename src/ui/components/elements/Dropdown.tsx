import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../logic/utils/cn';
import { baseInputClass } from './Inputs';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export interface FixedDropdownProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  placement?: 'top' | 'bottom';
}

// PERUBAHAN: Menyamakan ukuran teks list dengan placeholder standar input Anda
const globalDropdownTextSize = "text-FontSizeSm"; 

export const FixedDropdown = React.forwardRef<HTMLDivElement, FixedDropdownProps>(({ className, options, value, onChange, placeholder, error, disabled, id = "fixed-dropdown", placement = 'bottom' }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => prev < options.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          if (onChange) onChange(options[activeIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const selectedOption = options.find(o => o.value === value);

  return (
    /* PERBAIKAN: Jika isOpen true, z-index parent dipaksa naik ke z-[9999] agar tidak terkunci stacking context rendah */
    <div id={id} ref={wrapperRef} className={cn("relative w-full outline-none", isOpen ? "z-[9999]" : "z-[50]", disabled && "pointer-events-none opacity-80", className)} tabIndex={disabled ? -1 : 0} onKeyDown={handleKeyDown}>
      <div 
        id={`${id}-trigger`}
        className={cn(
          baseInputClass, 
          "flex items-center justify-between cursor-pointer", 
          isOpen && "ring-2 ring-ColorPrimary/opacity-OpacitySubtle border-ColorPrimary shadow-ElevationMid", 
          error && "border-FeedbackColorError focus-visible:ring-FeedbackColorError/opacity-OpacitySubtle",
          disabled && "bg-Black/5 cursor-not-allowed border-ColorSidebarBorder/10"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span id={`${id}-value`} className={cn(
          "truncate font-normal",
          selectedOption ? "text-TextColorBase" : "text-TextColorMuted",
          globalDropdownTextSize
        )}>
          {selectedOption ? selectedOption.label : (placeholder || "Pilih Opsi")}
        </span>
        <ChevronDown id={`${id}-chevron`} className={cn("w-spacing-SpacingBase h-spacing-SpacingBase text-TextColorMuted transition-transform duration-DurationMid", isOpen && "rotate-180 text-ColorPrimary")} />
      </div>

      {isOpen && (
        <div id={`${id}-list-container`} className={cn(
          "absolute left-0 w-full z-[9999] bg-ColorBg border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusLarge shadow-ElevationHigh overflow-hidden animate-in fade-in duration-DurationMid",
          placement === 'top' ? "bottom-full mb-SpacingSmall slide-in-from-bottom-2" : "top-full mt-SpacingSmall slide-in-from-top-2"
        )}>
          <div id={`${id}-list`} className="max-h-ContainerSmall overflow-y-auto scrollbar-hide p-SpacingNano">
            {options.map((opt, idx) => (
              <div 
                key={opt.value} 
                id={`${id}-item-${opt.value}`}
                className={cn(
                  "flex items-start justify-between px-SpacingSmall py-SpacingSmall rounded-RadiusMedium cursor-pointer transition-all duration-DurationFast font-normal gap-SpacingTiny", 
                  value === opt.value 
                    ? "bg-ColorPrimary/10 text-ColorPrimary" 
                    : "hover:bg-ColorPrimary/10 text-TextColorBase",
                  activeIndex === idx && value !== opt.value && "bg-ColorPrimary/10"
                )}
                onClick={() => {
                  if (onChange) onChange(opt.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span id={`${id}-item-label-${opt.value}`} className={cn("flex-1 whitespace-normal break-words", globalDropdownTextSize)}>{opt.label}</span>
                {value === opt.value && <Check id={`${id}-item-check-${opt.value}`} className="w-spacing-SpacingBase h-spacing-SpacingBase text-ColorPrimary shrink-0 mt-SpacingNano" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
FixedDropdown.displayName = "FixedDropdown";

export interface CustomDropdownProps {
  options: { label: string; value: string }[];
  dynamicOptions?: { label: string; value: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
}

export const CustomDropdown = React.forwardRef<HTMLDivElement, CustomDropdownProps>(({ className, options, value, onChange, placeholder, error, disabled, id = "custom-dropdown" }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          if (onChange) onChange(filteredOptions[activeIndex].value);
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div id={id} ref={wrapperRef} className={cn("relative w-full outline-none", isOpen ? "z-[9999]" : "z-[50]", disabled && "pointer-events-none opacity-80", className)} tabIndex={disabled ? -1 : 0} onKeyDown={handleKeyDown}>
      <div 
        id={`${id}-trigger`}
        className={cn(
          baseInputClass, 
          "flex items-center justify-between cursor-pointer", 
          isOpen && "ring-2 ring-ColorPrimary/opacity-OpacitySubtle border-ColorPrimary shadow-ElevationMid", 
          error && "border-FeedbackColorError focus-visible:ring-FeedbackColorError/opacity-OpacitySubtle",
          disabled && "bg-Black/5 cursor-not-allowed border-ColorSidebarBorder/10"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span id={`${id}-value`} className={cn(
          "truncate font-normal",
          selectedOption ? "text-TextColorBase" : "text-TextColorMuted",
          globalDropdownTextSize
        )}>
          {selectedOption ? selectedOption.label : (placeholder || "Pilih Opsi")}
        </span>
        <ChevronDown id={`${id}-chevron`} className={cn("w-spacing-SpacingBase h-spacing-SpacingBase text-TextColorMuted transition-transform duration-DurationMid", isOpen && "rotate-180 text-ColorPrimary")} />
      </div>

      {isOpen && (
        <div id={`${id}-list-container`} className="absolute top-full left-0 mt-SpacingSmall w-full z-[9999] bg-ColorBg border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusLarge shadow-ElevationHigh overflow-hidden animate-in fade-in slide-in-from-top-spacing-SpacingTiny duration-DurationMid">
          <div id={`${id}-search-container`} className="p-SpacingTiny border-b border-ColorSidebarBorder/opacity-OpacitySubtle flex items-center gap-SpacingTiny bg-ColorBg">
            <Search id={`${id}-search-icon`} className="w-spacing-SpacingBase h-spacing-SpacingBase text-TextColorMuted" />
            <input 
              id={`${id}-search-input`}
              type="text" 
              className={cn('flex-1 bg-transparent focus:outline-none text-TextColorBase font-medium', globalDropdownTextSize)} 
              placeholder="Cari Opsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div id={`${id}-list`} className="max-h-ContainerSmall overflow-y-auto scrollbar-hide bg-ColorBg">
            {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
              <div 
                key={opt.value} 
                id={`${id}-item-${opt.value}`}
                className={cn(
                  "flex items-start justify-between px-SpacingSmall py-SpacingSmall rounded-RadiusMedium cursor-pointer transition-all duration-DurationFast font-normal gap-SpacingTiny", 
                  value === opt.value 
                    ? "bg-ColorPrimary/10 text-ColorPrimary" 
                    : "hover:bg-ColorPrimary/10 text-TextColorBase",
                  activeIndex === idx && value !== opt.value && "bg-ColorPrimary/10"
                )}
                onClick={() => {
                  if (onChange) onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span id={`${id}-item-label-${opt.value}`} className={cn("flex-1 whitespace-normal break-words", globalDropdownTextSize)}>{opt.label}</span>
                {value === opt.value && <Check id={`${id}-item-check-${opt.value}`} className="w-spacing-SpacingBase h-spacing-SpacingBase text-ColorPrimary shrink-0 mt-SpacingNano" />}
              </div>
            )) : (
              <div id={`${id}-empty`} className={cn('px-SpacingSmall py-SpacingLarge text-center text-TextColorMuted font-normal', globalDropdownTextSize)}>
                Opsi tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
CustomDropdown.displayName = "CustomDropdown";

export const CustomValueDropdown = React.forwardRef<HTMLDivElement, CustomDropdownProps>(({ className, options, dynamicOptions = [], value, onChange, placeholder, error, disabled, id = "custom-value-dropdown" }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge static options and dynamic options, ensure uniqueness by value
  const allOptions = [...options];
  dynamicOptions.forEach(dyn => {
    if (!allOptions.some(opt => opt.value === dyn.value)) {
      allOptions.push(dyn);
    }
  });

  const selectedOption = allOptions.find(o => o.value === value);
  const filteredOptions = allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div id={id} ref={wrapperRef} className={cn("relative w-full outline-none", isOpen ? "z-[9999]" : "z-[50]", disabled && "pointer-events-none opacity-80", className)}>
      <div 
        id={`${id}-trigger`}
        className={cn(
          baseInputClass, 
          "flex items-center justify-between cursor-pointer", 
          isOpen && "border-ColorPrimary ring-2 ring-ColorPrimary/opacity-OpacitySubtle shadow-ElevationMid",
          error && "border-FeedbackColorError",
          disabled && "bg-Black/5 cursor-not-allowed border-ColorSidebarBorder/10"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("line-clamp-1 flex-1 font-normal", !value && "text-TextColorMuted", globalDropdownTextSize)}>
          {selectedOption ? selectedOption.label : (value || placeholder || "Pilih atau Ketik...")}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full z-[9999] bg-ColorBg border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusMedium shadow-ElevationHigh overflow-hidden">
          <div className="p-2 border-b border-ColorSidebarBorder/opacity-OpacitySubtle flex items-center gap-2 bg-ColorBg">
            <Search size="14" className="text-TextColorMuted" />
            <input 
              type="text" 
              className={cn("flex-1 bg-transparent outline-none font-normal", globalDropdownTextSize)} 
              placeholder="Cari atau ketik baru..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search) {
                  handleSelect(search);
                }
              }}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto scrollbar-hide bg-ColorBg">
            {filteredOptions.map((opt) => (
              <div 
                key={opt.value} 
                className={cn(
                  "px-SpacingSmall py-SpacingSmall cursor-pointer hover:bg-ColorPrimary/10 transition-colors flex justify-between items-start gap-SpacingTiny font-normal",
                  value === opt.value ? "bg-ColorPrimary/10 text-ColorPrimary" : "text-TextColorBase"
                )}
                onClick={() => handleSelect(opt.value)}
              >
                <span className={cn("flex-1 whitespace-normal break-words", globalDropdownTextSize)}>{opt.label}</span>
                {value === opt.value && <Check size="16" className="mt-SpacingNano shrink-0" />}
              </div>
            ))}
            {search && !allOptions.some(o => o.label.toLowerCase() === search.toLowerCase()) && (
              <div 
                className={cn("px-SpacingSmall py-SpacingSmall cursor-pointer hover:bg-ColorPrimary/10 text-ColorPrimary font-medium whitespace-normal break-words", globalDropdownTextSize)}
                onClick={() => handleSelect(search)}
              >
                Gunakan "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
CustomValueDropdown.displayName = "CustomValueDropdown";

export interface MultiDropdownProps {
  options: { label: string; value: string }[];
  dynamicOptions?: { label: string; value: string }[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
}

export const FixedMultiDropdown = React.forwardRef<HTMLDivElement, MultiDropdownProps>(({ className, options, value = [], onChange, placeholder, error, id = "fixed-multi-dropdown" }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => prev < options.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          toggleOption(options[activeIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const toggleOption = (optValue: string) => {
    const newValues = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    if (onChange) onChange(newValues);
  };

  const selectedOptions = options.filter(o => value.includes(o.value));

  return (
    <div id={id} ref={wrapperRef} className={cn("relative w-full outline-none", isOpen ? "z-[9999]" : "z-[50]", className)} tabIndex={0} onKeyDown={handleKeyDown}>
      <div 
        id={`${id}-trigger`}
        className={cn(
          'flex min-h-[2.5rem] w-full flex-wrap items-center gap-2 rounded-RadiusMedium border border-Black/15 bg-white px-3 py-2 cursor-pointer transition-all duration-DurationFast text-TextColorBase hover:bg-slate-100', 
          isOpen && "ring-2 ring-ColorPrimary/opacity-OpacitySubtle border-ColorPrimary shadow-ElevationMid", 
          error && "border-FeedbackColorError focus-visible:ring-FeedbackColorError/opacity-OpacitySubtle"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          <div id={`${id}-tags`} className="flex flex-wrap gap-SpacingTiny flex-1">
            {selectedOptions.map(opt => (
              <span 
                key={opt.value} 
                id={`${id}-tag-${opt.value}`}
                className="flex flex-row items-center gap-SpacingNano rounded-RadiusSmall bg-ColorPrimary px-SpacingTiny py-spacing-SpacingNano text-FontSizeNano font-normal text-white animate-in zoom-in duration-DurationFast" 
                onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
              >
                {opt.label}
                <X id={`${id}-tag-close-${opt.value}`} size="0.75rem" className="hover:text-FeedbackColorError transition-colors" />
              </span>
            ))}
          </div>
        ) : (
          <span id={`${id}-placeholder`} className={cn("text-TextColorMuted flex-1 px-SpacingNano font-medium", globalDropdownTextSize)}>
            {placeholder || "Pilih Opsi"}
          </span>
        )}
        <ChevronDown id={`${id}-chevron`} className={cn("w-spacing-SpacingBase h-spacing-SpacingBase text-TextColorMuted transition-transform duration-DurationMid", isOpen && "rotate-180 text-ColorPrimary")} />
      </div>

      {isOpen && (
        <div id={`${id}-list-container`} className="absolute top-full left-0 mt-SpacingSmall w-full z-[9999] bg-ColorBg border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusLarge shadow-ElevationHigh overflow-hidden animate-in fade-in slide-in-from-top-spacing-SpacingTiny duration-DurationMid">
          <div id={`${id}-list`} className="max-h-ContainerSmall overflow-y-auto scrollbar-hide p-SpacingNano bg-ColorBg">
            {options.map((opt, idx) => (
              <div 
                key={opt.value} 
                id={`${id}-item-${opt.value}`}
                className={cn(
                  "flex items-start justify-between px-SpacingSmall py-SpacingSmall rounded-RadiusMedium cursor-pointer transition-all duration-DurationFast font-normal gap-SpacingTiny", 
                  value.includes(opt.value) 
                    ? "bg-ColorPrimary/10 text-ColorPrimary" 
                    : "hover:bg-ColorPrimary/10 text-TextColorBase",
                  activeIndex === idx && "bg-ColorPrimary/10"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(opt.value);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span id={`${id}-item-label-${opt.value}`} className={cn("flex-1 whitespace-normal break-words", globalDropdownTextSize)}>{opt.label}</span>
                {value.includes(opt.value) && <Check id={`${id}-item-check-${opt.value}`} className="w-spacing-SpacingBase h-spacing-SpacingBase text-ColorPrimary shrink-0 mt-SpacingNano" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
FixedMultiDropdown.displayName = "FixedMultiDropdown";

export const CustomMultiDropdown = React.forwardRef<HTMLDivElement, MultiDropdownProps>(({ className, options, dynamicOptions = [], value = [], onChange, placeholder, error, id = "custom-multi-dropdown" }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge static options and dynamic options, ensure uniqueness by value
  const allOptions = [...options];
  dynamicOptions.forEach(dyn => {
    if (!allOptions.some(opt => opt.value === dyn.value)) {
      allOptions.push(dyn);
    }
  });

  const selectedOptions = allOptions.filter(o => value.includes(o.value));
  const filteredOptions = allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          toggleOption(filteredOptions[activeIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const toggleOption = (optValue: string) => {
    const newValues = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    if (onChange) onChange(newValues);
  };

  return (
    <div id={id} ref={wrapperRef} className={cn("relative w-full outline-none", isOpen ? "z-[9999]" : "z-[50]", className)} tabIndex={0} onKeyDown={handleKeyDown}>
      <div 
        id={`${id}-trigger`}
        className={cn(
          'flex min-h-[2.5rem] w-full flex-wrap items-center gap-2 rounded-RadiusMedium border border-Black/15 bg-white px-3 py-2 cursor-pointer transition-all duration-DurationFast text-TextColorBase hover:bg-slate-100', 
          isOpen && "ring-2 ring-ColorPrimary/opacity-OpacitySubtle border-ColorPrimary shadow-ElevationMid", 
          error && "border-FeedbackColorError focus-visible:ring-FeedbackColorError/opacity-OpacitySubtle"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          <div id={`${id}-tags`} className="flex flex-wrap gap-SpacingTiny flex-1">
            {selectedOptions.map(opt => (
              <span 
                key={opt.value} 
                id={`${id}-tag-${opt.value}`}
                className="flex items-center gap-SpacingNano rounded-RadiusSmall bg-ColorPrimary px-SpacingTiny py-spacing-SpacingNano text-FontSizeNano font-bold text-white animate-in zoom-in duration-DurationFast" 
                onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
              >
                {opt.label}
                <X id={`${id}-tag-close-${opt.value}`} size="0.75rem" className="hover:text-FeedbackColorError transition-colors" />
              </span>
            ))}
          </div>
        ) : (
          <span id={`${id}-placeholder`} className={cn("text-TextColorMuted flex-1 px-SpacingNano font-medium", globalDropdownTextSize)}>
            {placeholder || "Pilih Opsi"}
          </span>
        )}
        <ChevronDown id={`${id}-chevron`} className={cn("w-spacing-SpacingBase h-spacing-SpacingBase text-TextColorMuted transition-transform duration-DurationMid", isOpen && "rotate-180 text-ColorPrimary")} />
      </div>

      {isOpen && (
        <div id={`${id}-list-container`} className="absolute top-full left-0 mt-SpacingSmall w-full z-[9999] bg-ColorBg border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusLarge shadow-ElevationHigh overflow-hidden animate-in fade-in slide-in-from-top-spacing-SpacingTiny duration-DurationMid">
          <div id={`${id}-search-container`} className="p-SpacingTiny border-b border-ColorSidebarBorder/opacity-OpacitySubtle flex items-center gap-SpacingTiny bg-ColorBg">
            <Search id={`${id}-search-icon`} className="w-spacing-SpacingBase h-spacing-SpacingBase text-TextColorMuted" />
            <input 
              id={`${id}-search-input`}
              type="text" 
              className={cn('flex-1 bg-transparent focus:outline-none text-TextColorBase font-medium', globalDropdownTextSize)} 
              placeholder="Cari Opsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div id={`${id}-list`} className="max-h-ContainerSmall overflow-y-auto scrollbar-hide bg-ColorBg">
            {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
              <div 
                key={opt.value} 
                id={`${id}-item-${opt.value}`}
                className={cn(
                  "flex items-start justify-between px-SpacingSmall py-SpacingSmall rounded-RadiusMedium cursor-pointer transition-all duration-DurationFast font-normal gap-SpacingTiny", 
                  value.includes(opt.value) 
                    ? "bg-ColorPrimary/10 text-ColorPrimary" 
                    : "hover:bg-ColorPrimary/10 text-TextColorBase",
                  activeIndex === idx && "bg-ColorPrimary/10"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(opt.value);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span id={`${id}-item-label-${opt.value}`} className={cn("flex-1 whitespace-normal break-words", globalDropdownTextSize)}>{opt.label}</span>
                {value.includes(opt.value) && <Check id={`${id}-item-check-${opt.value}`} className="w-spacing-SpacingBase h-spacing-SpacingBase text-ColorPrimary shrink-0 mt-SpacingNano" />}
              </div>
            )) : (
              <div id={`${id}-empty`} className={cn('px-SpacingSmall py-SpacingLarge text-center text-TextColorMuted italic font-medium', globalDropdownTextSize)}>
                Opsi tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
CustomMultiDropdown.displayName = "CustomMultiDropdown";