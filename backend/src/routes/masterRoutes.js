const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Protect all master routes
router.use(requireAuth);

// Vendor Master Routes
router.post('/vendors', masterController.createVendor);
router.get('/vendors', masterController.getVendors);
router.put('/vendors/:id', masterController.updateVendor);
router.delete('/vendors/:id', masterController.deleteVendor);

// Flower Master Routes
router.post('/flowers', masterController.createFlower);
router.get('/flowers', masterController.getFlowers);
router.put('/flowers/:id', masterController.updateFlower);
router.delete('/flowers/:id', masterController.deleteFlower);

module.exports = router;
