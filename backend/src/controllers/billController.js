const prisma = require('../config/db');

exports.createBill = async (req, res) => {
  try {
    const { vendorId, flowerId, weightKg, ratePerKg } = req.body;
    
    // Auto calculate the total amount
    const totalAmount = parseFloat(weightKg) * parseFloat(ratePerKg);

    const bill = await prisma.bill.create({
      data: {
        vendorId,
        flowerId,
        weightKg: parseFloat(weightKg),
        ratePerKg: parseFloat(ratePerKg),
        totalAmount,
      },
      include: {
        vendor: true,
        flower: true,
      }
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Error creating bill', details: error.message });
  }
};

exports.getBills = async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        vendor: true,
        flower: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bills' });
  }
};
