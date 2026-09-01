const PDFDocument = require('pdfkit');

/**
 * Generates a styled tabular PDF report with prominent APL header and table row/column formatting.
 * @param {Array} bills - Array of bill objects with vendor & flower
 * @param {String} title - Report title
 * @param {Object} res - Express response object to stream to
 */
const generateBillsPdf = (bills, title = 'APL Billing Report', res) => {
  const doc = new PDFDocument({ margin: 36, size: 'A4' });

  doc.pipe(res);

  // Colors
  const primaryColor = '#15803D'; // Forest Green
  const textColor = '#111827';
  const tableHeaderBg = '#15803D';
  const borderColor = '#D1D5DB';
  const zebraBg = '#F9FAFB';

  const pageWidth = 523; // 595.28 - (36 * 2)

  // 1. Prominent APL Main Header Banner
  doc.rect(36, 36, pageWidth, 55).fill(primaryColor);

  doc
    .fillColor('#FFFFFF')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('APL', 36, 44, { align: 'center', width: pageWidth, characterSpacing: 3 });

  doc
    .fillColor('#DCFCE7')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('FLOWER MERCHANTS & COMMISSION AGENT', 36, 70, {
      align: 'center',
      width: pageWidth,
      characterSpacing: 1,
    });

  // 2. Report Subtitle & Generation Metadata Box
  doc.rect(36, 96, pageWidth, 28).fill('#F3F4F6');
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), 46, 104, { width: 300 });

  doc
    .fillColor('#4B5563')
    .fontSize(8.5)
    .font('Helvetica')
    .text(
      `Date: ${new Date().toLocaleDateString()} | Bills: ${bills.length}`,
      300,
      105,
      { align: 'right', width: 250 }
    );

  let y = 132;

  // Table Column Coordinates & Widths
  const col = {
    sno: { x: 36, w: 32 },
    date: { x: 68, w: 65 },
    vendor: { x: 133, w: 130 },
    flower: { x: 263, w: 110 },
    weight: { x: 373, w: 55 },
    rate: { x: 428, w: 55 },
    total: { x: 483, w: 76 },
  };

  const drawHeader = (currY) => {
    // Header background
    doc.rect(36, currY, pageWidth, 22).fill(tableHeaderBg);

    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    doc.text('S.No', col.sno.x, currY + 6, { width: col.sno.w, align: 'center' });
    doc.text('Date', col.date.x + 4, currY + 6, { width: col.date.w - 4 });
    doc.text('Vendor Name', col.vendor.x + 4, currY + 6, { width: col.vendor.w - 4 });
    doc.text('Flower Variety', col.flower.x + 4, currY + 6, { width: col.flower.w - 4 });
    doc.text('Weight (kg)', col.weight.x, currY + 6, { width: col.weight.w - 4, align: 'right' });
    doc.text('Rate/Kg (Rs)', col.rate.x, currY + 6, { width: col.rate.w - 4, align: 'right' });
    doc.text('Total (Rs)', col.total.x, currY + 6, { width: col.total.w - 6, align: 'right' });

    // Header vertical borders
    doc.strokeColor('#FFFFFF').lineWidth(0.5);
    Object.values(col).forEach((c) => {
      doc.moveTo(c.x, currY).lineTo(c.x, currY + 22).stroke();
    });
    doc.moveTo(36 + pageWidth, currY).lineTo(36 + pageWidth, currY + 22).stroke();
  };

  drawHeader(y);
  y += 22;

  let totalWeight = 0;
  let grandTotal = 0;

  bills.forEach((bill, idx) => {
    // Page overflow check
    if (y > 750) {
      doc.addPage();
      y = 36;
      drawHeader(y);
      y += 22;
    }

    const rowHeight = 18;
    const isEven = idx % 2 === 0;

    // Row Background
    if (!isEven) {
      doc.rect(36, y, pageWidth, rowHeight).fill(zebraBg);
    }

    const dateStr = new Date(bill.date).toISOString().split('T')[0];
    const vendorName = bill.vendor ? bill.vendor.vendorName : 'N/A';
    const flowerName = bill.flower ? bill.flower.flowerName : 'N/A';
    const weight = Number(bill.weightKg) || 0;
    const rate = Number(bill.ratePerKg) || 0;
    const total = Number(bill.totalAmount) || 0;

    totalWeight += weight;
    grandTotal += total;

    // Text Data
    doc.fillColor(textColor).fontSize(8).font('Helvetica');
    doc.text(String(idx + 1), col.sno.x, y + 5, { width: col.sno.w, align: 'center' });
    doc.text(dateStr, col.date.x + 4, y + 5, { width: col.date.w - 4 });
    doc.text(vendorName.substring(0, 22), col.vendor.x + 4, y + 5, { width: col.vendor.w - 4 });
    doc.text(flowerName.substring(0, 18), col.flower.x + 4, y + 5, { width: col.flower.w - 4 });
    doc.text(weight.toFixed(2), col.weight.x, y + 5, { width: col.weight.w - 4, align: 'right' });
    doc.text(rate.toFixed(2), col.rate.x, y + 5, { width: col.rate.w - 4, align: 'right' });
    doc.text(total.toFixed(2), col.total.x, y + 5, { width: col.total.w - 6, align: 'right' });

    // Horizontal bottom border
    doc.moveTo(36, y + rowHeight).lineTo(36 + pageWidth, y + rowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();

    // Vertical column borders
    doc.strokeColor(borderColor).lineWidth(0.5);
    Object.values(col).forEach((c) => {
      doc.moveTo(c.x, y).lineTo(c.x, y + rowHeight).stroke();
    });
    doc.moveTo(36 + pageWidth, y).lineTo(36 + pageWidth, y + rowHeight).stroke();

    y += rowHeight;
  });

  // Grand Total Summary Row
  if (y > 730) {
    doc.addPage();
    y = 36;
  }

  const totalHeight = 24;
  doc.rect(36, y, pageWidth, totalHeight).fill('#DCFCE7'); // Emerald light

  doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold');
  doc.text('GRAND TOTAL', col.date.x, y + 7, { width: 150 });
  doc.text(`${bills.length} Bills`, col.flower.x, y + 7, { width: 100 });
  doc.text(`${totalWeight.toFixed(2)} kg`, col.weight.x, y + 7, { width: col.weight.w - 4, align: 'right' });
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, col.total.x, y + 7, { width: col.total.w - 6, align: 'right' });

  // Border for grand total
  doc.rect(36, y, pageWidth, totalHeight).strokeColor(primaryColor).lineWidth(1.5).stroke();

  doc.end();
};

module.exports = {
  generateBillsPdf,
};
