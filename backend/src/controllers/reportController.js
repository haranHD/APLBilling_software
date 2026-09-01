const prisma = require('../config/db');
const { createBillsWorkbook } = require('../services/excelService');
const { generateBillsPdf } = require('../services/pdfService');

/**
 * Helper to build where condition and title based on query
 */
const buildReportFilter = (query) => {
  const { month, startDate, endDate } = query;
  const where = {};
  let reportTitle = 'APL Billing Report';
  let fileSuffix = 'All';

  if (month) {
    // Expected format: YYYY-MM
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);

    const startOfMonth = new Date(year, m - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);

    where.date = {
      gte: startOfMonth,
      lte: endOfMonth,
    };

    const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
    reportTitle = `Monthly Billing Report - ${monthName} ${year}`;
    fileSuffix = `${year}_${monthStr}`;
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
    reportTitle = `Billing Report (${startDate || 'Start'} to ${endDate || 'Present'})`;
    fileSuffix = `${startDate || 'Start'}_to_${endDate || 'Present'}`;
  }

  return { where, reportTitle, fileSuffix };
};

/**
 * Generate Excel Report
 */
exports.generateExcelReport = async (req, res) => {
  try {
    const { where, reportTitle, fileSuffix } = buildReportFilter(req.query);

    const bills = await prisma.bill.findMany({
      where,
      include: { vendor: true, flower: true },
      orderBy: { date: 'asc' },
    });

    const workbook = await createBillsWorkbook(bills, reportTitle);

    const filename = `APL_Billing_Report_${fileSuffix}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel report error:', error);
    res.status(500).json({ error: 'Error generating Excel report', details: error.message });
  }
};

/**
 * Generate PDF Report
 */
exports.generatePdfReport = async (req, res) => {
  try {
    const { where, reportTitle, fileSuffix } = buildReportFilter(req.query);

    const bills = await prisma.bill.findMany({
      where,
      include: { vendor: true, flower: true },
      orderBy: { date: 'asc' },
    });

    const filename = `APL_Billing_Report_${fileSuffix}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateBillsPdf(bills, reportTitle, res);
  } catch (error) {
    console.error('PDF report error:', error);
    res.status(500).json({ error: 'Error generating PDF report', details: error.message });
  }
};
