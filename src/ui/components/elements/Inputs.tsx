import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Search, Eye, EyeOff, X, Maximize, Minimize } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { useDebounce } from '../../../logic/hooks/useDebounce';
import { Tooltip } from '../common/Tooltip';
import { formatCurrency } from '../../../logic/utils/data';
import { extractYoutubeId } from '../../../logic/utils/media';
import { validators } from '../../../logic/utils/validators';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { currencyList } from '../../styles/currencyList';

export const baseInputClass =
  'flex h-spacing-SpacingHuge w-full rounded-RadiusMedium border border-Black/15 bg-white px-3 py-2 text-FontSizeSm placeholder:text-TextColorMuted hover:bg-slate-100 focus-visible:outline-none focus:border-ColorPrimary focus-visible:border-ColorPrimary disabled:cursor-not-allowed disabled:opacity-OpacityMuted transition-all duration-DurationFast outline-none';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  id?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id = "text-input", ...props }, ref) => {
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    
    return (
      <input
        ref={ref}
        id={id}
        type="text"
        placeholder={props.placeholder || "Masukkan teks..."}
        className={cn(
          baseInputClass,
          isMobile ? "text-FontSizeXs" : "text-FontSizeSm",
          error &&
            'border-FeedbackColorError focus-visible:ring-FeedbackColorError/opacity-OpacitySubtle focus-visible:border-FeedbackColorError',
          className,
        )}
        {...props}
      />
    );
  },
);
TextInput.displayName = 'TextInput';

export const EmailInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, value, id = "email-input", ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      setIsDirty(true);
      if (onChange) onChange(e);
    };

    const isInvalid =
      isDirty && internalValue !== '' && !validators.isValidEmail(internalValue as string);

    return (
      <div id={`${id}-container`} className="flex flex-col gap-SpacingNano w-full">
        <TextInput
          ref={ref}
          id={id}
          type="email"
          className={className}
          placeholder="contoh@email.com"
          value={internalValue}
          onChange={handleChange}
          error={isInvalid}
          {...props}
        />
        {isInvalid && (
          <span id={`${id}-error`} className="text-FontSizeXs text-FeedbackColorError font-bold animate-in fade-in duration-DurationFast">
            Format email tidak valid
          </span>
        )}
      </div>
    );
  },
);
EmailInput.displayName = 'EmailInput';

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, value, id = "phone-input", ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d+]/g, '');
      if (raw.indexOf('+') > 0) raw = raw.replace(/\+/g, '');

      const prefix = raw.startsWith('+') ? '+' : '';
      const digitsOnly = raw.replace(/\+/g, '');
      const chunked = digitsOnly.match(/.{1,3}/g)?.join(' ') || '';
      const formatted = prefix + chunked;

      setInternalValue(formatted);
      setIsDirty(true);

      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>;
      if (onChange) onChange(syntheticEvent);
    };

    const isInvalid =
      isDirty &&
      internalValue !== '' &&
      !validators.isValidPhone((internalValue as string).replace(/\s/g, ''));

    return (
      <div id={`${id}-container`} className="flex flex-col gap-SpacingNano w-full">
        <TextInput
          ref={ref}
          id={id}
          type="tel"
          className={className}
          placeholder="+62 812 ..."
          value={internalValue}
          onChange={handleChange}
          error={isInvalid}
          {...props}
        />
        {isInvalid && (
          <span id={`${id}-error`} className="text-FontSizeXs text-FeedbackColorError font-bold animate-in fade-in duration-DurationFast">
            Nomor telepon tidak valid
          </span>
        )}
      </div>
    );
  },
);
PhoneInput.displayName = 'PhoneInput';

export interface LongTextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  id?: string;
}

export const LongTextInput = React.forwardRef<HTMLTextAreaElement, LongTextInputProps>(
  ({ className, error, id = "long-text-input", ...props }, ref) => {
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    
    return (
      <textarea
        ref={ref}
        id={id}
        placeholder={props.placeholder || "Masukkan pesan atau catatan..."}
        className={cn(
          'flex min-h-ContainerTiny w-full rounded-RadiusSmall border border-ColorSidebarBorder/opacity-OpacitySubtle bg-ColorBg px-SpacingSmall py-SpacingTiny placeholder:text-TextColorMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ColorPrimary/opacity-OpacitySubtle focus-visible:border-ColorPrimary disabled:cursor-not-allowed disabled:opacity-OpacityMuted transition-all duration-DurationFast scrollbar-hide',
          isMobile ? "text-FontSizeXs" : "text-FontSizeSm",
          error &&
            'border-FeedbackColorError focus-visible:ring-FeedbackColorError/opacity-OpacitySubtle focus-visible:border-FeedbackColorError',
          className,
        )}
        {...props}
      />
    );
  },
);
LongTextInput.displayName = 'LongTextInput';

export const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, value, id = "number-input", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(
      value !== undefined && value !== null ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
    );

    useEffect(() => {
      if (value !== undefined && value !== null) {
        const numOnly = String(value).replace(/[^\d-]/g, '');
        setDisplayValue(numOnly ? numOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const updateValue = (newVal: string | number) => {
      const numOnly = String(newVal).replace(/[^\d-]/g, '');
      const formatted = numOnly ? numOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
      setDisplayValue(formatted);
      
      if (onChange) {
        const syntheticEvent = {
          target: { value: numOnly, id: id },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handleUp = () => {
      const current = Number(String(displayValue).replace(/\./g, '') || 0);
      updateValue(current + 1);
    };
    
    const handleDown = () => {
      const current = Number(String(displayValue).replace(/\./g, '') || 0);
      updateValue(current - 1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDown();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;
      let numOnly = raw.replace(/[^\d-]/g, '');
      
      // Handle multiple dashes and position
      if (numOnly.lastIndexOf('-') > 0) {
        numOnly = numOnly.substring(0, numOnly.lastIndexOf('-')) + 
                  numOnly.substring(numOnly.lastIndexOf('-')).replace(/-/g, '');
      }

      updateValue(numOnly);
    };

    return (
      <div id={`${id}-wrapper`} className="relative flex items-center w-full">
        <TextInput
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          className={cn('pr-spacing-SpacingExtraHuge', className)}
          placeholder="0"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={displayValue}
          {...props}
        />
        <div id={`${id}-controls`} className="absolute right-SpacingNano flex flex-col justify-center h-full py-SpacingNano">
          <button
            id={`${id}-plus`}
            type="button"
            onClick={handleUp}
            className="text-TextColorMuted hover:text-ColorPrimary p-SpacingNano flex-1 flex flex-col justify-end pb-0 transition-colors"
            tabIndex={-1}
          >
            <ChevronUp id={`${id}-up-icon`} size={18} className="stroke-BorderThick" />
          </button>
          <button
            id={`${id}-minus`}
            type="button"
            onClick={handleDown}
            className="text-TextColorMuted hover:text-FeedbackColorError p-SpacingNano flex-1 flex flex-col justify-start pt-0 transition-colors"
            tabIndex={-1}
          >
            <ChevronDown id={`${id}-down-icon`} size={18} className="stroke-BorderThick" />
          </button>
        </div>
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';

export const DecimalInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onBlur, value, id = "decimal-input", ...props }, ref) => {
    const [internalValue, setInternalValue] = useState<string | number>(value || '');

    useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const updateValue = (newVal: string | number) => {
      setInternalValue(newVal);
      if (onChange) {
        const syntheticEvent = {
          target: { value: String(newVal) },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const formatToDecimal = (val: string) => {
      if (!val || val === '-' || val === '.' || val === '-.') return val;
      const normalized = val.replace(/,/g, '.');
      const num = parseFloat(normalized);
      if (isNaN(num)) return val;
      return num.toFixed(2);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const formatted = formatToDecimal(e.target.value);
      if (formatted !== e.target.value) {
        updateValue(formatted);
      }
      if (onBlur) onBlur(e);
    };

    const handleUp = () => {
      const current = parseFloat(String(internalValue).replace(/,/g, '.') || '0');
      updateValue((current + 0.01).toFixed(2));
    };

    const handleDown = () => {
      const current = parseFloat(String(internalValue).replace(/,/g, '.') || '0');
      updateValue((current - 0.01).toFixed(2));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDown();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/[^\d.,-]/g, '');
      if (val.lastIndexOf('-') > 0)
        val =
          val.substring(0, val.lastIndexOf('-')) +
          val.substring(val.lastIndexOf('-')).replace(/-/g, '');

      const normalizedVal = val.replace(/,/g, '.');
      const parts = normalizedVal.split('.');

      if (parts.length > 2) {
        val = val.substring(0, val.lastIndexOf(val.match(/[.,]/g)![1]));
      }

      const finalParts = val.replace(/,/g, '.').split('.');
      if (finalParts.length === 2 && finalParts[1].length > 2) {
        val = val.substring(0, val.length - 1);
      }

      updateValue(val);
    };

    return (
      <div id={`${id}-wrapper`} className="relative flex items-center w-full">
        <TextInput
          ref={ref}
          id={id}
          type="text"
          inputMode="decimal"
          className={cn('pr-spacing-SpacingExtraHuge', className)}
          placeholder="0.00"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={internalValue}
          onBlur={handleBlur}
          {...props}
        />
        <div id={`${id}-controls`} className="absolute right-SpacingNano flex flex-col justify-center h-full py-SpacingNano">
          <button
            id={`${id}-plus`}
            type="button"
            onClick={handleUp}
            className="text-TextColorMuted hover:text-ColorPrimary p-SpacingNano flex-1 flex flex-col justify-end pb-0 transition-colors"
            tabIndex={-1}
          >
            <ChevronUp id={`${id}-up-icon`} size={18} className="stroke-BorderThick" />
          </button>
          <button
            id={`${id}-minus`}
            type="button"
            onClick={handleDown}
            className="text-TextColorMuted hover:text-FeedbackColorError p-SpacingNano flex-1 flex flex-col justify-start pt-0 transition-colors"
            tabIndex={-1}
          >
            <ChevronDown id={`${id}-down-icon`} size={18} className="stroke-BorderThick" />
          </button>
        </div>
      </div>
    );
  },
);
DecimalInput.displayName = 'DecimalInput';

export const PercentageInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onBlur, value, id = "percentage-input", ...props }, ref) => {
    const [internalValue, setInternalValue] = useState<string | number>(value || '');

    useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const updateValue = (newVal: string | number) => {
      setInternalValue(newVal);
      if (onChange) {
        const syntheticEvent = {
          target: { value: String(newVal) },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const formatToDecimal = (val: string) => {
      if (!val || val === '-' || val === '.' || val === '-.') return val;
      const normalized = val.replace(/,/g, '.');
      const num = parseFloat(normalized);
      if (isNaN(num)) return val;
      return num.toFixed(2);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const formatted = formatToDecimal(e.target.value);
      if (formatted !== e.target.value) {
        updateValue(formatted);
      }
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/[^\d.,-]/g, '');
      if (val.lastIndexOf('-') > 0)
        val =
          val.substring(0, val.lastIndexOf('-')) +
          val.substring(val.lastIndexOf('-')).replace(/-/g, '');

      const normalizedVal = val.replace(/,/g, '.');
      const parts = normalizedVal.split('.');

      if (parts.length > 2) {
        val = val.substring(0, val.lastIndexOf(val.match(/[.,]/g)![1]));
      }

      const finalParts = val.replace(/,/g, '.').split('.');
      if (finalParts.length === 2 && finalParts[1].length > 2) {
        val = val.substring(0, val.length - 1);
      }

      updateValue(val);
    };

    return (
      <div id={`${id}-wrapper`} className="relative flex items-center w-full">
        <TextInput
          ref={ref}
          id={id}
          type="text"
          inputMode="decimal"
          className={cn('pr-spacing-SpacingExtraHuge', className)}
          placeholder="0.00"
          onChange={handleChange}
          onBlur={handleBlur}
          value={internalValue}
          {...props}
        />
        <span id={`${id}-symbol`} className="absolute right-SpacingMedium text-TextColorMuted font-bold">%</span>
      </div>
    );
  },
);
PercentageInput.displayName = 'PercentageInput';

export const PriceInput = React.forwardRef<
  HTMLInputElement,
  InputProps & { currencyCode?: string }
>(({ className, value, onChange, currencyCode = 'IDR', id = "price-input", ...props }, ref) => {
  const currency = currencyList.find((c) => c.code === currencyCode) || currencyList[0];
  const symbol = currency.symbol;

  const [displayValue, setDisplayValue] = useState(
    value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '',
  );

  useEffect(() => {
    if (value !== undefined) {
      let numOnly = String(value).replace(/\D/g, '');
      setDisplayValue(numOnly ? numOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    let numOnly = raw.replace(/\D/g, '');

    setDisplayValue(numOnly ? numOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: numOnly },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div id={`${id}-wrapper`} className="relative flex items-center w-full">
      <span id={`${id}-symbol`} className="absolute left-SpacingSmall text-FontSizeSm text-TextColorBase font-medium pointer-events-none select-none z-ZRaised">
        {symbol}
      </span>
      <TextInput
        ref={ref}
        id={id}
        className={cn('pl-[2.5rem]', className)}
        value={displayValue}
        onChange={handleChange}
        inputMode="numeric"
        placeholder="0"
        {...props}
      />
    </div>
  );
});
PriceInput.displayName = 'PriceInput';

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { id?: string }
>(({ className, id = "checkbox", ...props }, ref) => (
    <input
    type="checkbox"
    ref={ref}
    id={id}
    className={cn(
      'peer h-spacing-SpacingBase w-spacing-SpacingBase shrink-0 rounded-RadiusTiny border border-ColorSidebarBorder/opacity-OpacitySubtle ring-offset-ColorBg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ColorPrimary/opacity-OpacitySubtle disabled:cursor-not-allowed disabled:opacity-OpacityMuted accent-ColorPrimary transition-all duration-DurationFast cursor-pointer',
      className,
    )}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export interface XYCoordinate {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface XYInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: XYCoordinate[];
  onChange?: (coords: XYCoordinate[]) => void;
  imageUrl?: string;
  onImageChange?: (file: File | null, dataUrl: string) => void;
  maxPoints?: number;
  error?: boolean;
}

export const XYInput = React.forwardRef<HTMLDivElement, XYInputProps>(
  ({ className, value, onChange, imageUrl, onImageChange, maxPoints, error, id = "xy-input", ...props }, ref) => {
    const [internalImage, setInternalImage] = useState<string | null>(imageUrl || null);
    const [internalPoints, setInternalPoints] = useState<XYCoordinate[]>(value || []);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    
    const activeDragInfo = useRef<{ id: string; type: 'move' | 'resize' } | null>(null);

    useEffect(() => {
      if (isFullscreen) {
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isFullscreen]);

    const valueStr = JSON.stringify(value);
    useEffect(() => {
      if (value !== undefined) {
        setInternalPoints(value);
      }
    }, [valueStr]);

    useEffect(() => {
      if (imageUrl !== undefined && imageUrl !== internalImage) {
        setInternalImage(imageUrl);
      }
    }, [imageUrl]);

    const triggerChange = (newPoints: XYCoordinate[]) => {
      setInternalPoints(newPoints);
      if (onChange) onChange(newPoints);
    };

    useEffect(() => {
      const handlePointerMove = (e: PointerEvent) => {
        if (!activeDragInfo.current || !imageContainerRef.current) return;
        const { id, type } = activeDragInfo.current;
        const rect = imageContainerRef.current.getBoundingClientRect();
        
        setInternalPoints(prev => prev.map(p => {
          if (p.id !== id) return p;
          
          if (type === 'move') {
            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
            return { ...p, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
          } else if (type === 'resize') {
            const centerPxX = rect.left + (p.x / 100) * rect.width;
            const centerPxY = rect.top + (p.y / 100) * rect.height;
            const distPx = Math.sqrt(Math.pow(e.clientX - centerPxX, 2) + Math.pow(e.clientY - centerPxY, 2));
            const newRadius = (distPx / rect.width) * 100;
            return { ...p, radius: Number(Math.max(1, newRadius).toFixed(2)) };
          }
          return p;
        }));
      };

      const handlePointerUp = () => {
        if (activeDragInfo.current) {
          activeDragInfo.current = null;
          setInternalPoints(prev => {
            if (onChange) onChange(prev);
            return prev;
          });
        }
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerUp);
      };
    }, [onChange]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setInternalImage(dataUrl);
          triggerChange([]);
          if (onImageChange) onImageChange(file, dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current) return;
      if (maxPoints && internalPoints.length >= maxPoints) return;
      
      if (activeDragInfo.current) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const newPoint: XYCoordinate = {
        id: Math.random().toString(36).substr(2, 9),
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        radius: 5,
      };

      triggerChange([...internalPoints, newPoint]);
    };

    const removePoint = (id: string, e?: React.MouseEvent | React.PointerEvent) => {
      if (e) e.stopPropagation();
      const newPoints = internalPoints.filter((p) => p.id !== id);
      triggerChange(newPoints);
    };

    return (
      <div 
        ref={ref} 
        id={id}
        className={cn(
          'flex flex-col gap-SpacingSmall w-full', 
          isFullscreen ? "fixed inset-0 z-ZTopmost bg-ColorBg p-SpacingBase overflow-auto" : "",
          className
        )} 
        {...props}
      >
        {!internalImage ? (
          <div
            id={`${id}-upload-prompt`}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full h-spacing-ContainerSmall border-2 border-dashed border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall bg-ColorBgSecondary flex flex-col items-center justify-center cursor-pointer hover:bg-ColorSidebarAccent hover:border-ColorPrimary/opacity-OpacitySubtle transition-all duration-DurationMid',
              error && 'border-FeedbackColorError text-FeedbackColorError shadow-inner',
            )}
          >
            <span id={`${id}-prompt-text`} className="text-FontSizeSm font-black text-TextColorMuted">
              Klik untuk Unggah Gambar Peta
            </span>
            <span id={`${id}-prompt-format`} className="text-FontSizeXs text-TextColorMuted opacity-70 mt-SpacingNano font-bold">
              Format: PNG, JPG, GIF
            </span>
          </div>
        ) : (
          <div id={`${id}-image-wrapper`} className="flex flex-col gap-SpacingTiny h-full">
            <div id={`${id}-header`} className="flex justify-between items-center">
              <div className="flex items-center gap-SpacingTiny">
                <span id={`${id}-instruction`} className="text-FontSizeXs text-TextColorMuted font-bold">
                  Klik pada gambar untuk menambah titik koordinat
                </span>
                <button 
                  id={`${id}-fullscreen-toggle`}
                  type="button" 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-SpacingNano hover:bg-ColorTertiary/opacity-OpacitySubtle rounded-RadiusSmall transition-colors"
                >
                  {isFullscreen ? <Minimize id={`${id}-minimize-icon`} size="0.875rem" /> : <Maximize id={`${id}-maximize-icon`} size="0.875rem" />}
                </button>
              </div>
              <button
                id={`${id}-remove-image`}
                type="button"
                onClick={() => {
                  setInternalImage(null);
                  setIsFullscreen(false);
                  triggerChange([]);
                  if (onImageChange) onImageChange(null, '');
                }}
                className="text-FontSizeXs font-black text-FeedbackColorError hover:underline transition-all"
              >
                Hapus Gambar
              </button>
            </div>

            <div
              id={`${id}-container`}
              ref={imageContainerRef}
              className={cn(
                "relative w-full rounded-RadiusSmall overflow-hidden border border-ColorTertiary/opacity-OpacityMuted group select-none shadow-ElevationLow bg-ColorBg cursor-crosshair touch-none",
                isFullscreen ? "flex-1 flex items-center justify-center bg-ColorBgSecondary" : ""
              )}
              onClick={handleImageClick}
            >
              <img
                id={`${id}-preview`}
                src={internalImage}
                alt="Peta"
                className={cn(
                  "w-full h-auto block pointer-events-none object-contain",
                  isFullscreen ? "max-h-full max-w-full" : ""
                )}
                draggable={false}
              />

              {internalPoints.map((point) => (
                <div
                  key={point.id}
                  id={`${id}-point-${point.id}`}
                  className="absolute aspect-square transform -translate-x-1/2 -translate-y-1/2 rounded-RadiusFull border border-ColorPrimary bg-ColorPrimary/opacity-OpacitySubtle pointer-events-auto cursor-move hover:bg-ColorPrimary/opacity-OpacityMuted transition-colors group/point shadow-ElevationMid outline-none"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: `${point.radius * 2}%`,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    activeDragInfo.current = { id: point.id, type: 'move' };
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div id={`${id}-point-center-${point.id}`} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-spacing-SpacingNano h-spacing-SpacingNano rounded-RadiusFull bg-ColorPrimary shadow-ElevationLow pointer-events-none"></div>

                  <div 
                    id={`${id}-point-resize-${point.id}`}
                    className="absolute right-0 top-1/2 w-spacing-SpacingBase h-spacing-SpacingBase transform translate-x-1/2 -translate-y-1/2 bg-ColorBg border-2 border-ColorPrimary rounded-RadiusFull cursor-ew-resize opacity-0 group/point:hover:opacity-100 transition-opacity z-ZAbove"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      activeDragInfo.current = { id: point.id, type: 'resize' };
                    }}
                    onClick={(e) => e.stopPropagation()}
                  ></div>

                  <button
                    id={`${id}-point-remove-${point.id}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => removePoint(point.id, e)}
                    type="button"
                    className="absolute -top-SpacingTiny -right-SpacingTiny bg-FeedbackColorError text-White rounded-RadiusFull p-SpacingNano opacity-0 group/point:hover:opacity-100 transition-opacity shadow-ElevationMid z-ZTopmost"
                    title="Hapus"
                  >
                    <X id={`${id}-remove-icon-${point.id}`} size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <input 
          id={`${id}-file-input`}
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
      </div>
    );
  },
);
XYInput.displayName = 'XYInput';

export const YoutubeInput = React.forwardRef<HTMLDivElement, { className?: string; id?: string }>(
  ({ className, id = "youtube-input" }, ref) => {
    const [url, setUrl] = useState('');
    const videoId = extractYoutubeId(url);

    return (
      <div ref={ref} id={`${id}-container`} className={cn('flex flex-col gap-SpacingTiny w-full', className)}>
        <TextInput
          id={id}
          placeholder="Tempel tautan video YouTube di sini..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {videoId && (
          <div
            id={`${id}-preview`}
            className="relative w-full aspect-video overflow-hidden rounded-RadiusSmall border border-ColorTertiary/opacity-OpacitySubtle shadow-ElevationLow animate-in zoom-in-95 duration-DurationMid"
          >
            <iframe
              id={`${id}-iframe`}
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
    );
  },
);
YoutubeInput.displayName = 'YoutubeInput';

export interface SearchInputProps extends Omit<InputProps, 'onChange'> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
  triggerOnIconClickOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      onSearch,
      debounceMs = 300,
      triggerOnIconClickOnly = true,
      value,
      onChange,
      id = "search-input",
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(value || '');

    useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (onChange) onChange(e);
    };

    const handleIconClick = () => {
      if (onSearch) {
        onSearch(internalValue as string);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onSearch) onSearch(internalValue as string);
      }
    };

    return (
      <div id={`${id}-wrapper`} className="relative flex items-center w-full">
        <TextInput
          ref={ref}
          id={id}
          type="text"
          className={cn('pr-10', className)}
          placeholder="Cari sesuatu..."
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <div className="absolute right-2">
            <Tooltip content="Cari Sekarang">
                <button
                id={`${id}-button`}
                type="button"
                onClick={handleIconClick}
                className="text-TextColorMuted hover:text-ColorPrimary p-SpacingNano cursor-pointer transition-colors"
                tabIndex={-1}
                >
                <Search id={`${id}-icon`} size={18} />
                </button>
            </Tooltip>
        </div>
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export interface SwitchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  id?: string;
}

export const SwitchInput = React.forwardRef<HTMLInputElement, SwitchInputProps>(
  ({ className, label, error, checked, defaultChecked, onChange, id = "switch-input", ...props }, ref) => {
    const [internalChecked, setInternalChecked] = useState(checked || defaultChecked || false);

    useEffect(() => {
      if (checked !== undefined) setInternalChecked(checked);
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setInternalChecked(e.target.checked);
      }
      if (onChange) onChange(e);
    };

    return (
      <label
        id={`${id}-label`}
        className={cn(
          'flex items-center gap-SpacingSmall cursor-pointer group',
          className,
          props.disabled && 'cursor-not-allowed opacity-OpacityMuted',
        )}
      >
        <div id={`${id}-wrapper`} className="relative flex items-center">
          <input
            id={id}
            type="checkbox"
            className="peer sr-only"
            checked={internalChecked}
            onChange={handleChange}
            ref={ref}
            {...props}
          />
          <div
            id={`${id}-track`}
            className={cn(
              'w-11 h-6 bg-ColorTertiary/opacity-OpacitySubtle rounded-RadiusFull peer-checked:bg-ColorPrimary transition-all duration-DurationFast border border-transparent',
              error && 'border-FeedbackColorError',
            )}
          ></div>
          <div
            id={`${id}-thumb`}
            className={cn(
              'absolute left-SpacingNano top-SpacingNano w-spacing-SpacingBase h-spacing-SpacingBase rounded-RadiusFull bg-ColorBg transition-transform duration-DurationFast shadow-ElevationLow',
              internalChecked && 'translate-x-5',
            )}
          ></div>
        </div>
        {label && (
          <span id={`${id}-text`} className="text-FontSizeSm font-bold select-none group-hover:text-ColorPrimary transition-colors">{label}</span>
        )}
      </label>
    );
  },
);
SwitchInput.displayName = 'SwitchInput';

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id = "password-input", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div id={`${id}-wrapper`} className="relative flex items-center w-full">
        <TextInput
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          placeholder="Masukkan kata sandi..."
          {...props}
        />
        <button
          id={`${id}-toggle`}
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 text-TextColorMuted hover:text-ColorPrimary p-SpacingNano z-ZAbove transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
        >
          {showPassword ? <EyeOff id={`${id}-hide-icon`} size={18} /> : <Eye id={`${id}-show-icon`} size={18} />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export interface TagInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: string[];
  onChange?: (tags: string[]) => void;
  maxTags?: number;
  id?: string;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ className, value, onChange, maxTags, placeholder, error, id = "tag-input", ...props }, ref) => {
    const [tags, setTags] = useState<string[]>(value || []);
    const [inputValue, setInputValue] = useState('');

    const valueStr = JSON.stringify(value);
    useEffect(() => {
      if (value !== undefined) {
        setTags(value);
      }
    }, [valueStr]);

    const handleAddTag = (newTag: string) => {
      const trimmed = newTag.trim();
      if (trimmed && !tags.includes(trimmed) && (!maxTags || tags.length < maxTags)) {
        const newTags = [...tags, trimmed];
        setTags(newTags);
        if (onChange) onChange(newTags);
        setInputValue('');
      }
    };

    const handleRemoveTag = (tagToRemove: string) => {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      setTags(newTags);
      if (onChange) onChange(newTags);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag(inputValue);
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
        handleRemoveTag(tags[tags.length - 1]);
      }
    };

    return (
      <div
        id={`${id}-container`}
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-SpacingNano rounded-RadiusSmall border border-ColorTertiary/opacity-OpacityMuted bg-ColorBg px-SpacingTiny py-SpacingNano text-FontSizeSm focus-within:ring-2 focus-within:ring-ColorPrimary/opacity-OpacitySubtle focus-within:border-ColorPrimary transition-all duration-DurationFast',
          error &&
            'border-FeedbackColorError focus-within:ring-FeedbackColorError/opacity-OpacitySubtle focus-within:border-FeedbackColorError',
          props.disabled && 'opacity-OpacityMuted cursor-not-allowed',
          className,
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            id={`${id}-tag-${tag}`}
            className="flex items-center gap-SpacingNano rounded-RadiusTiny bg-ColorPrimary/opacity-OpacitySubtle px-SpacingTiny py-0.5 text-FontSizeXs font-black text-ColorPrimary animate-in zoom-in-90 duration-DurationFast"
          >
            {tag}
            <button
              id={`${id}-tag-remove-${tag}`}
              type="button"
              onClick={() => handleRemoveTag(tag)}
              disabled={props.disabled}
              className="hover:text-FeedbackColorError transition-colors disabled:cursor-not-allowed"
            >
              <X id={`${id}-tag-icon-${tag}`} size={14} />
            </button>
          </span>
        ))}
        <input
          ref={ref}
          id={id}
          type="text"
          className="flex-1 bg-transparent px-SpacingNano py-0.5 min-w-32 outline-none text-TextColorBase placeholder:text-TextColorMuted disabled:cursor-not-allowed font-medium"
          placeholder={tags.length === 0 ? placeholder || "Ketik dan tekan Enter..." : ''}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => handleAddTag(inputValue)}
          disabled={props.disabled || (maxTags !== undefined && tags.length >= maxTags)}
          {...props}
        />
      </div>
    );
  },
);
TagInput.displayName = 'TagInput';
