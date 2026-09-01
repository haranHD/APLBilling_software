const prisma = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.generateExcelReport = async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: { vendor: true, flower: true },
      orderBy: { date: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Billing Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Vendor Name', key: 'vendorName', width: 25 },
      { header: 'Flower Name', key: 'flowerName', width: 20 },
      { header: 'Weight (Kg)', key: 'weightKg', width: 15 },
      { header: 'Rate/Kg', key: 'ratePerKg', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 20 },
    ];

    bills.forEach((bill) => {
      worksheet.addRow({
        date: bill.date.toISOString().split('T')[0],
        vendorName: bill.vendor.vendorName,
        flowerName: bill.flower.flowerName,
        weightKg: bill.weightKg,
        ratePerKg: bill.ratePerKg,
        totalAmount: bill.totalAmount,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Billing_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Error generating Excel report' });
  }
};

exports.generatePdfReport = async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: { vendor: true, flower: true },
      orderBy: { date: 'asc' },
    });

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Billing_Report.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Month End Billing Report', { align: 'center' });
    doc.moveDown();

    bills.forEach((bill) => {
      const dateStr = bill.date.toISOString().split('T')[0];
      const text = `Date: ${dateStr} | Vendor: ${bill.vendor.vendorName} | Flower: ${bill.flower.flowerName} | Weight: ${bill.weightKg}kg | Rate: ${bill.ratePerKg} | Total: ${bill.totalAmount}`;
      doc.fontSize(12).text(text);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Error generating PDF report' });
  }
};
