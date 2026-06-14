import ExcelJS from 'exceljs';

export const generateExcel = (data: any[], filename: string = 'export.xlsx', sheetName: string = 'Sheet1') => {
  try {
    // Dynamic import to keep initial bundle size small, only loading xlsx when needed
    import('xlsx').then((XLSX) => {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Convert JSON data to a worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Write the workbook and trigger download
      XLSX.writeFile(wb, filename);
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
  }
};

/**
 * Generates an Excel file using ExcelJS for more advanced formatting and features
 */
export const generateExcelAdvanced = async (
  options: {
    data: any[];
    filename?: string;
    sheetName?: string;
    columns?: Partial<ExcelJS.Column>[];
    onBeforeSave?: (workbook: ExcelJS.Workbook) => Promise<void> | void;
  }
) => {
  const { data, filename = 'export.xlsx', sheetName = 'Sheet1', columns, onBeforeSave } = options;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (columns) {
      worksheet.columns = columns;
    } else if (data.length > 0) {
      // Auto-determine columns from keys
      const keys = Object.keys(data[0]);
      worksheet.columns = keys.map(key => ({ header: key, key: key, width: 15 }));
    }

    worksheet.addRows(data);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    if (onBeforeSave) {
      await onBeforeSave(workbook);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating advanced Excel file:', error);
  }
};
