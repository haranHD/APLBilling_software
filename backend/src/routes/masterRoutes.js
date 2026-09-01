const express = require('express');
const router = express.Router();
const { createVendor, getVendors, createFlower, getFlowers } = require('../controllers/masterController');

router.post('/vendors', createVendor);
router.get('/vendors', getVendors);

router.post('/flowers', createFlower);
router.get('/flowers', getFlowers);

module.exports = router;
