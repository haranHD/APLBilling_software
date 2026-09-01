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

  // Title Banner
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803D' }, // Forest Green
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Generated date subtitle
  worksheet.mergeCells('A2:F2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Generated on: ${new Date().toLocaleString()} | Total Bills: ${bills.length}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF374151' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // Table Column Headers
  const headers = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Vendor Name', key: 'vendorName', width: 30 },
    { header: 'Flower Variety', key: 'flowerName', width: 24 },
    { header: 'Weight (kg)', key: 'weightKg', width: 18 },
    { header: 'Rate / kg (₹)', key: 'ratePerKg', width: 18 },
    { header: 'Total Amount (₹)', key: 'totalAmount', width: 22 },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers.map((h) => h.header);
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' }, // Dark Gray/Navy
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
  let currentRowIndex = 5;

  bills.forEach((bill, idx) => {
    const row = worksheet.getRow(currentRowIndex);
    const dateFormatted = new Date(bill.date).toISOString().split('T')[0];

    row.values = [
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

      if (colNumber === 1) cell.alignment = { horizontal: 'center' };
      if (colNumber === 2 || colNumber === 3) cell.alignment = { horizontal: 'left' };
      if (colNumber === 4) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0.00';
      }
      if (colNumber === 5 || colNumber === 6) {
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
    if (colNumber === 3) cell.alignment = { horizontal: 'center' };
    if (colNumber === 4) {
      cell.alignment = { horizontal: 'right' };
      cell.numFmt = '#,##0.00 "kg"';
    }
    if (colNumber === 6) {
      cell.alignment = { horizontal: 'right' };
      cell.numFmt = '₹#,##0.00';
    }
  });

  return workbook;
};

module.exports = {
  createBillsWorkbook,
};

