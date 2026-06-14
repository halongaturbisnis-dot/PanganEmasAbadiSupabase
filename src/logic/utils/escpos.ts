/**
 * UTILS/ESCPOS.TS
 * ESC/POS Binary Command Generator.
 * Provides raw bytes for controlling thermal printers.
 */

export const ESCPOS = {
  // Common Commands
  INIT: new Uint8Array([0x1b, 0x40]), // Initialize printer
  FEED: (lines: number = 1) => new Uint8Array([0x1b, 0x64, lines]),
  CUT: new Uint8Array([0x1d, 0x56, 0x41]), // Full cut
  
  // Alignments
  ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]),
  
  // Font Styles
  BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
  
  // Font Sizes (Standard)
  FONT_NORMAL: new Uint8Array([0x1d, 0x21, 0x00]),
  FONT_DOUBLE_HEIGHT: new Uint8Array([0x1d, 0x21, 0x01]),
  FONT_DOUBLE_WIDTH: new Uint8Array([0x1d, 0x21, 0x10]),
  FONT_LARGE: new Uint8Array([0x1d, 0x21, 0x11]), // Double width + height

  // Drawer
  OPEN_DRAWER: new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]),
};

/**
 * Text to Bytes Converter
 */
export const textToBytes = (text: string): Uint8Array => {
  return new TextEncoder().encode(text);
};

/**
 * Utility to combine multiple Uint8Arrays into one
 */
export const combineCommands = (commands: Uint8Array[]): Uint8Array => {
  const totalLength = commands.reduce((acc, curr) => acc + curr.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const command of commands) {
    combined.set(command, offset);
    offset += command.length;
  }
  return combined;
};
