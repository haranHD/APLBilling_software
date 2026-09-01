const express = require('express');
const router = express.Router();
const { createBill, getBills } = require('../controllers/billController');

router.post('/', createBill);
router.get('/', getBills);

module.exports = router;
