const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Middleware that accepts Bearer token or ?token= query param for convenient file download links
const requireAuthWithQuery = (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  requireAuth(req, res, next);
};

router.use(requireAuthWithQuery);

// Report Generation endpoints
router.get('/excel', reportController.generateExcelReport);
router.get('/pdf', reportController.generatePdfReport);

module.exports = router;
