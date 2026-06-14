import { useCallback } from 'react';
import { triggerBrowserPrint, formatReceiptLine, getSeparator, centerText } from '../utils/print';
import { ESCPOS, textToBytes, combineCommands } from '../utils/escpos';
import { printerService } from '../services/printerService';

/**
 * HOOKS/USEPRINT.TS
 * Hook for managing print tasks and document formatting.
 * Supports Browser Print and direct Thermal Printer execution.
 */

export const usePrint = () => {
  // 1. Standard window printing (Browser)
  const printWindow = useCallback(() => {
    triggerBrowserPrint();
  }, []);

  // 2. Generate Receipt Data String (Standard 58mm/80mm)
  const generateReceiptText = useCallback((data: {
    title: string;
    items: { name: string; price: string }[];
    total: string;
    footer?: string;
  }, width: number = 32) => {
    let receipt = '';
    
    // Header
    receipt += centerText(data.title.toUpperCase(), width) + '\n';
    receipt += getSeparator('-', width) + '\n';
    
    // Items
    data.items.forEach(item => {
      receipt += formatReceiptLine(item.name, item.price, width) + '\n';
    });
    
    // Total
    receipt += getSeparator('=', width) + '\n';
    receipt += formatReceiptLine('TOTAL', data.total, width) + '\n';
    
    // Footer
    if (data.footer) {
      receipt += '\n' + centerText(data.footer, width) + '\n';
    }
    
    return receipt;
  }, []);

  // 3. Generate ESC/POS Binary Data
  const generateReceiptBinary = useCallback((data: {
    title: string;
    items: { name: string; price: string }[];
    total: string;
    footer?: string;
  }, width: number = 32) => {
    const commands: Uint8Array[] = [];

    // Initialize
    commands.push(ESCPOS.INIT);
    
    // Header
    commands.push(ESCPOS.ALIGN_CENTER);
    commands.push(ESCPOS.FONT_DOUBLE_HEIGHT);
    commands.push(textToBytes(data.title.toUpperCase() + '\n'));
    commands.push(ESCPOS.FONT_NORMAL);
    commands.push(textToBytes(getSeparator('-', width) + '\n'));
    
    // Items
    commands.push(ESCPOS.ALIGN_LEFT);
    data.items.forEach(item => {
      commands.push(textToBytes(formatReceiptLine(item.name, item.price, width) + '\n'));
    });
    
    // Total
    commands.push(textToBytes(getSeparator('=', width) + '\n'));
    commands.push(ESCPOS.BOLD_ON);
    commands.push(textToBytes(formatReceiptLine('TOTAL', data.total, width) + '\n'));
    commands.push(ESCPOS.BOLD_OFF);
    
    // Footer
    if (data.footer) {
      commands.push(textToBytes('\n'));
      commands.push(ESCPOS.ALIGN_CENTER);
      commands.push(textToBytes(data.footer + '\n'));
    }

    // Cut & Finish
    commands.push(ESCPOS.FEED(3));
    commands.push(ESCPOS.CUT);

    return combineCommands(commands);
  }, []);

  // 4. Execution Helpers
  const printToDevice = useCallback(async (binaryData: Uint8Array) => {
    return await printerService.printRaw(binaryData);
  }, []);

  return { 
    printWindow, 
    generateReceiptText, 
    generateReceiptBinary, 
    printToDevice,
    printerService 
  };
};
