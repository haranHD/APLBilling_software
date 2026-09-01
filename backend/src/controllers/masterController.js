const prisma = require('../config/db');

// --- Vendor Master ---

exports.createVendor = async (req, res) => {
  try {
    const { vendorName, contactInfo } = req.body;
    const vendor = await prisma.vendorMaster.create({
      data: { vendorName, contactInfo },
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vendor' });
  }
};

exports.getVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendorMaster.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vendors' });
  }
};

// --- Flower Master ---

exports.createFlower = async (req, res) => {
  try {
    const { flowerName } = req.body;
    const flower = await prisma.flowerMaster.create({
      data: { flowerName },
    });
    res.status(201).json(flower);
  } catch (error) {
    res.status(500).json({ error: 'Error creating flower' });
  }
};

exports.getFlowers = async (req, res) => {
  try {
    const flowers = await prisma.flowerMaster.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(flowers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching flowers' });
  }
};
