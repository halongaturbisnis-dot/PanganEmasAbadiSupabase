import { tokens } from '../../ui/styles/tokens';

/**
 * UTILS/COLOR.TS
 * Shared logic for color manipulation, conversions, and contrast calculation.
 */

// Convert HEX string to RGB object
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Convert RGB values to HEX string
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
};

// Determine if a color is light or dark (YIQ equation)
export const getContrastColor = (hexcolor: string): string => {
  // If a leading # is provided, remove it
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6) return tokens.textColors.light.TextColorBase;
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return (yiq >= 128) ? tokens.textColors.light.TextColorBase : tokens.colors.light.ColorBg;
};
