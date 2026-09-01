const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Protect all bill routes
router.use(requireAuth);

// Dashboard Summary KPI endpoint
router.get('/dashboard-summary', billController.getDashboardStats);

// Bill CRUD
router.post('/', billController.createBill);
router.get('/', billController.getBills);
router.get('/:id', billController.getBillById);
router.delete('/:id', billController.deleteBill);

module.exports = router;
