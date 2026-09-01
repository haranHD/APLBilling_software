const prisma = require('../config/db');

/**
 * Create a new billing entry
 */
exports.createBill = async (req, res) => {
  try {
    const { vendorId, flowerId, weightKg, ratePerKg, date } = req.body;

    if (!vendorId || !flowerId) {
      return res.status(400).json({ error: 'Vendor and Flower selections are required.' });
    }

    const parsedWeight = parseFloat(weightKg);
    const parsedRate = parseFloat(ratePerKg);

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ error: 'Please enter a valid weight in kg (greater than 0).' });
    }

    if (isNaN(parsedRate) || parsedRate <= 0) {
      return res.status(400).json({ error: 'Please enter a valid rate per kg (greater than 0).' });
    }

    // Verify vendor and flower exist
    const vendor = await prisma.vendorMaster.findUnique({ where: { id: vendorId } });
    if (!vendor) return res.status(404).json({ error: 'Selected vendor not found.' });

    const flower = await prisma.flowerMaster.findUnique({ where: { id: flowerId } });
    if (!flower) return res.status(404).json({ error: 'Selected flower variety not found.' });

    // Auto calculate total amount
    const totalAmount = Math.round(parsedWeight * parsedRate * 100) / 100;

    const billDate = date ? new Date(date) : new Date();

    const bill = await prisma.bill.create({
      data: {
        vendorId,
        flowerId,
        weightKg: parsedWeight,
        ratePerKg: parsedRate,
        totalAmount,
        date: billDate,
      },
      include: {
        vendor: true,
        flower: true,
      },
    });

    res.status(201).json(bill);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Error creating bill', details: error.message });
  }
};

/**
 * Fetch bills with optional date and entity filters
 */
exports.getBills = async (req, res) => {
  try {
    const { startDate, endDate, month, vendorId, flowerId, limit } = req.query;

    const where = {};

    if (month) {
      // Month format: YYYY-MM
      const [year, m] = month.split('-').map(Number);
      const startOfMonth = new Date(year, m - 1, 1);
      const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (vendorId) where.vendorId = vendorId;
    if (flowerId) where.flowerId = flowerId;

    const take = limit ? parseInt(limit, 10) : undefined;

    const bills = await prisma.bill.findMany({
      where,
      include: {
        vendor: true,
        flower: true,
      },
      orderBy: { date: 'desc' },
      take,
    });

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bills', details: error.message });
  }
};

/**
 * Fetch a single bill by ID
 */
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { vendor: true, flower: true },
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bill details', details: error.message });
  }
};

/**
 * Delete a bill
 */
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bill.delete({ where: { id } });
    res.status(200).json({ message: 'Bill deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting bill', details: error.message });
  }
};

/**
 * Dashboard Statistics (Today's summary, monthly totals, recent bills)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // Today's range in local time / UTC
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Current Month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Today's metrics
    const todayBills = await prisma.bill.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    let todayRevenue = 0;
    let todayWeightKg = 0;
    todayBills.forEach((b) => {
      todayRevenue += b.totalAmount;
      todayWeightKg += b.weightKg;
    });

    // 2. Month's metrics
    const monthBills = await prisma.bill.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    let monthRevenue = 0;
    let monthWeightKg = 0;
    monthBills.forEach((b) => {
      monthRevenue += b.totalAmount;
      monthWeightKg += b.weightKg;
    });

    // 3. Total counts
    const totalVendors = await prisma.vendorMaster.count();
    const totalFlowers = await prisma.flowerMaster.count();
    const totalBills = await prisma.bill.count();

    // 4. Recent 5 bills
    const recentBills = await prisma.bill.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: true,
        flower: true,
      },
    });

    res.status(200).json({
      today: {
        revenue: Math.round(todayRevenue * 100) / 100,
        weightKg: Math.round(todayWeightKg * 100) / 100,
        billCount: todayBills.length,
      },
      month: {
        revenue: Math.round(monthRevenue * 100) / 100,
        weightKg: Math.round(monthWeightKg * 100) / 100,
        billCount: monthBills.length,
      },
      totals: {
        vendors: totalVendors,
        flowers: totalFlowers,
        bills: totalBills,
      },
      recentBills,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error fetching dashboard stats', details: error.message });
  }
};
