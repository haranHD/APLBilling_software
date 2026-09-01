const PDFDocument = require('pdfkit');

/**
 * Generates a styled tabular PDF report.
 * @param {Array} bills - Array of bill objects with vendor & flower
 * @param {String} title - Report title
 * @param {Object} res - Express response object to stream to
 */
const generateBillsPdf = (bills, title = 'APL Billing Report', res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.pipe(res);

  // Colors
  const primaryColor = '#15803D'; // Forest Green
  const textColor = '#1F2937';
  const tableHeaderBg = '#F3F4F6';
  const borderColor = '#E5E7EB';

  // Title Banner
  doc.rect(40, 40, 515, 45).fill(primaryColor);
  doc
    .fillColor('#FFFFFF')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), 40, 52, { align: 'center', width: 515 });

  // Subtitle / Date
  doc.moveDown(1.5);
  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}  |  Total Bills: ${bills.length}`, 40, 95, {
      align: 'right',
      width: 515,
    });

  let y = 120;

  // Table Headers
  const colX = {
    date: 45,
    vendor: 115,
    flower: 240,
    weight: 345,
    rate: 420,
    total: 485,
  };

  const drawHeader = (currY) => {
    doc.rect(40, currY - 5, 515, 22).fill(tableHeaderBg);
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
    doc.text('Date', colX.date, currY);
    doc.text('Vendor', colX.vendor, currY);
    doc.text('Flower Variety', colX.flower, currY);
    doc.text('Weight (kg)', colX.weight, currY, { width: 65, align: 'right' });
    doc.text('Rate/kg', colX.rate, currY, { width: 55, align: 'right' });
    doc.text('Total (Rs)', colX.total, currY, { width: 65, align: 'right' });

    doc.moveTo(40, currY + 16).lineTo(555, currY + 16).strokeColor('#9CA3AF').lineWidth(1).stroke();
  };

  drawHeader(y);
  y += 24;

  let totalWeight = 0;
  let grandTotal = 0;

  bills.forEach((bill, i) => {
    // Check for page overflow
    if (y > 750) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += 24;
    }

    const dateStr = new Date(bill.date).toISOString().split('T')[0];
    const vendorName = bill.vendor ? bill.vendor.vendorName : 'N/A';
    const flowerName = bill.flower ? bill.flower.flowerName : 'N/A';
    const weight = Number(bill.weightKg) || 0;
    const rate = Number(bill.ratePerKg) || 0;
    const total = Number(bill.totalAmount) || 0;

    totalWeight += weight;
    grandTotal += total;

    doc.fillColor(textColor).fontSize(8.5).font('Helvetica');
    doc.text(dateStr, colX.date, y);
    doc.text(vendorName.substring(0, 22), colX.vendor, y, { width: 120 });
    doc.text(flowerName.substring(0, 18), colX.flower, y, { width: 100 });
    doc.text(weight.toFixed(2), colX.weight, y, { width: 65, align: 'right' });
    doc.text(rate.toFixed(2), colX.rate, y, { width: 55, align: 'right' });
    doc.text(total.toFixed(2), colX.total, y, { width: 65, align: 'right' });

    y += 18;
    doc.moveTo(40, y - 2).lineTo(555, y - 2).strokeColor(borderColor).lineWidth(0.5).stroke();
  });

  // Summary / Grand Total box
  if (y > 720) {
    doc.addPage();
    y = 40;
  }

  y += 8;
  doc.rect(40, y - 4, 515, 26).fill('#DCFCE7'); // Emerald light
  doc.fillColor('#15803D').fontSize(9.5).font('Helvetica-Bold');
  doc.text('GRAND TOTAL', colX.date, y);
  doc.text(`${bills.length} Bills`, colX.flower, y);
  doc.text(`${totalWeight.toFixed(2)} kg`, colX.weight, y, { width: 65, align: 'right' });
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, colX.total, y, { width: 65, align: 'right' });

  doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor(primaryColor).lineWidth(1.5).stroke();
  doc.moveTo(40, y + 22).lineTo(555, y + 22).strokeColor(primaryColor).lineWidth(1.5).stroke();

  doc.end();
};

module.exports = {
  generateBillsPdf,
};

