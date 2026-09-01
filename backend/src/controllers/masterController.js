const prisma = require('../config/db');

// ==========================================
// --- Vendor Master ---
// ==========================================

exports.createVendor = async (req, res) => {
  try {
    const { vendorName, contactInfo } = req.body;

    if (!vendorName || vendorName.trim() === '') {
      return res.status(400).json({ error: 'Vendor name is required' });
    }

    // Check if duplicate vendor name exists
    const existing = await prisma.vendorMaster.findUnique({
      where: { vendorName: vendorName.trim() },
    });

    if (existing) {
      return res.status(400).json({ error: 'A vendor with this name already exists' });
    }

    const vendor = await prisma.vendorMaster.create({
      data: {
        vendorName: vendorName.trim(),
        contactInfo: contactInfo ? contactInfo.trim() : null,
      },
    });

    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vendor', details: error.message });
  }
};

exports.getVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendorMaster.findMany({
      include: {
        _count: {
          select: { bills: true },
        },
      },
      orderBy: { vendorName: 'asc' },
    });
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vendors', details: error.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorName, contactInfo } = req.body;

    if (!vendorName || vendorName.trim() === '') {
      return res.status(400).json({ error: 'Vendor name cannot be empty' });
    }

    // Check if new name conflicts with another vendor
    const existing = await prisma.vendorMaster.findFirst({
      where: {
        vendorName: vendorName.trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Another vendor already has this name' });
    }

    const updated = await prisma.vendorMaster.update({
      where: { id },
      data: {
        vendorName: vendorName.trim(),
        contactInfo: contactInfo !== undefined ? (contactInfo ? contactInfo.trim() : null) : undefined,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error updating vendor', details: error.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vendor has linked bills
    const billCount = await prisma.bill.count({ where: { vendorId: id } });
    if (billCount > 0) {
      return res.status(400).json({
        error: `Cannot delete vendor. There are ${billCount} billing records associated with this vendor.`,
      });
    }

    await prisma.vendorMaster.delete({ where: { id } });
    res.status(200).json({ message: 'Vendor deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting vendor', details: error.message });
  }
};

// ==========================================
// --- Flower Master ---
// ==========================================

exports.createFlower = async (req, res) => {
  try {
    const { flowerName } = req.body;

    if (!flowerName || flowerName.trim() === '') {
      return res.status(400).json({ error: 'Flower name is required' });
    }

    // Check duplicate
    const existing = await prisma.flowerMaster.findUnique({
      where: { flowerName: flowerName.trim() },
    });

    if (existing) {
      return res.status(400).json({ error: 'A flower with this name already exists' });
    }

    const flower = await prisma.flowerMaster.create({
      data: { flowerName: flowerName.trim() },
    });

    res.status(201).json(flower);
  } catch (error) {
    res.status(500).json({ error: 'Error creating flower', details: error.message });
  }
};

exports.getFlowers = async (req, res) => {
  try {
    const flowers = await prisma.flowerMaster.findMany({
      include: {
        _count: {
          select: { bills: true },
        },
      },
      orderBy: { flowerName: 'asc' },
    });
    res.status(200).json(flowers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching flowers', details: error.message });
  }
};

exports.updateFlower = async (req, res) => {
  try {
    const { id } = req.params;
    const { flowerName } = req.body;

    if (!flowerName || flowerName.trim() === '') {
      return res.status(400).json({ error: 'Flower name cannot be empty' });
    }

    const existing = await prisma.flowerMaster.findFirst({
      where: {
        flowerName: flowerName.trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Another flower already has this name' });
    }

    const updated = await prisma.flowerMaster.update({
      where: { id },
      data: { flowerName: flowerName.trim() },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error updating flower', details: error.message });
  }
};

exports.deleteFlower = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if flower has linked bills
    const billCount = await prisma.bill.count({ where: { flowerId: id } });
    if (billCount > 0) {
      return res.status(400).json({
        error: `Cannot delete flower. There are ${billCount} billing records associated with this flower.`,
      });
    }

    await prisma.flowerMaster.delete({ where: { id } });
    res.status(200).json({ message: 'Flower deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting flower', details: error.message });
  }
};
