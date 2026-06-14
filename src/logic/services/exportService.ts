/**
 * SERVICES/EXPORTSERVICE.TS
 * Logic for exporting data to various formats (CSV, Excel-compatible).
 */

class ExportService {
  /**
   * Exports an array of objects to a CSV file.
   * @param data Array of objects to export.
   * @param filename Desired filename.
   * @param headers Optional header mapping { key: 'Display Name' }.
   */
  toCSV<T>(data: T[], filename: string, headers?: Record<keyof T, string>): void {
    if (data.length === 0) return;

    // Determine keys
    const keys = (Object.keys(data[0] as object) as (keyof T)[]);
    
    // Create Header Row
    const headerRow = keys.map((k) => headers?.[k] || String(k)).join(',');
    
    // Create Data Rows
    const dataRows = data.map((item) => {
      return keys.map((k) => {
        let val: any = item[k];
        // Handle special characters
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Trigger Download
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Imports a CSV string and converts it to an array of objects.
   */
  fromCSV<T>(csvText: string): T[] {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        let val: any = values[index]?.trim();
        // Try to parse numbers
        if (!isNaN(Number(val)) && val !== '') {
          val = Number(val);
        }
        obj[header] = val;
      });
      return obj as T;
    }).filter(item => Object.keys(item).length > 0);
  }

  /**
   * Simple HTML Table to Excel export trick.
   */
  toExcelPlaceholder<T>(data: T[], filename: string): void {
    // Note: True Excel (.xlsx) requires libraries like 'xlsx' or 'exceljs'.
    // Here we export as CSV which is automatically opened by Excel.
    this.toCSV(data, filename);
  }
}

export const exportService = new ExportService();
