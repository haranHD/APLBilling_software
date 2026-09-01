const express = require('express');
const router = express.Router();
const { generateExcelReport, generatePdfReport } = require('../controllers/reportController');

router.get('/excel', generateExcelReport);
router.get('/pdf', generatePdfReport);

module.exports = router;
