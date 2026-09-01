const ExcelJS = require('exceljs');

/**
 * Generate Excel workbook stream for bills with summary metrics.
 * @param {Array} bills - Array of bill objects with vendor and flower relations
 * @param {String} title - Report title (e.g. "Monthly Billing Report - August 2026")
 * @returns {ExcelJS.Workbook}
 */
const createBillsWorkbook = async (bills, title = 'APL Billing Report') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'APL Billing Software';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Billing Report', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  // Main APL Header Banner
  worksheet.mergeCells('A1:G1');
  const mainTitleCell = worksheet.getCell('A1');
  mainTitleCell.value = 'APL - FLOWER MERCHANTS & COMMISSION AGENT';
  mainTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  mainTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803D' }, // Forest Green
  };
  mainTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Subtitle (Report Title)
  worksheet.mergeCells('A2:G2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = title.toUpperCase();
  subTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF111827' } };
  subTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDCFCE7' }, // Light Emerald
  };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 24;

  // Generated date subtitle
  worksheet.mergeCells('A3:G3');
  const subCell = worksheet.getCell('A3');
  subCell.value = `Generated on: ${new Date().toLocaleString()} | Total Bills: ${bills.length}`;
  subCell.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF4B5563' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 18;

  // Table Column Headers
  const headers = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Vendor Name', key: 'vendorName', width: 28 },
    { header: 'Flower Variety', key: 'flowerName', width: 22 },
    { header: 'Weight (kg)', key: 'weightKg', width: 16 },
    { header: 'Rate / kg (₹)', key: 'ratePerKg', width: 16 },
    { header: 'Total Amount (₹)', key: 'totalAmount', width: 20 },
  ];

  const headerRow = worksheet.getRow(5);
  headerRow.values = headers.map((h) => h.header);
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF15803D' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    };
  });

  // Set column widths
  headers.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width;
  });

  let totalWeight = 0;
  let grandTotal = 0;
  let currentRowIndex = 6;

  bills.forEach((bill, idx) => {
    const row = worksheet.getRow(currentRowIndex);
    const dateFormatted = new Date(bill.date).toISOString().split('T')[0];

    row.values = [
      idx + 1,
      dateFormatted,
      bill.vendor ? bill.vendor.vendorName : 'N/A',
      bill.flower ? bill.flower.flowerName : 'N/A',
      bill.weightKg,
      bill.ratePerKg,
      bill.totalAmount,
    ];

    totalWeight += Number(bill.weightKg) || 0;
    grandTotal += Number(bill.totalAmount) || 0;

    // Formatting & Zebra striping
    const isEven = idx % 2 === 0;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      if (!isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      if (colNumber === 1 || colNumber === 2) cell.alignment = { horizontal: 'center' };
      if (colNumber === 3 || colNumber === 4) cell.alignment = { horizontal: 'left' };
      if (colNumber === 5) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0.00';
      }
      if (colNumber === 6 || colNumber === 7) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '₹#,##0.00';
      }
    });

    row.height = 22;
    currentRowIndex++;
  });

  // Summary / Grand Total Row
  const summaryRow = worksheet.getRow(currentRowIndex);
  summaryRow.values = [
    'TOTAL',
    '',
    '',
    `${bills.length} Records`,
    totalWeight,
    '',
    grandTotal,
  ];
  summaryRow.height = 28;

  summaryRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF111827' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDCFCE7' }, // Light Emerald
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF15803D' } },
      bottom: { style: 'double', color: { argb: 'FF15803D' } },
      left: { style: 'thin', color: { argb: 'FF15803D' } },
      right: { style: 'thin', color: { argb: 'FF15803D' } },
    };

    if (colNumber === 1) cell.alignment = { horizontal: 'center' };
    if (colNumber === 4) cell.alignment = { horizontal: 'center' };
    if (colNumber === 5) {
      cell.alignment = { horizontal: 'right' };
      cell.numFmt = '#,##0.00 "kg"';
    }
    if (colNumber === 7) {
      cell.alignment = { horizontal: 'right' };
      cell.numFmt = '₹#,##0.00';
    }
  });

  return workbook;
};

module.exports = {
  createBillsWorkbook,
};
