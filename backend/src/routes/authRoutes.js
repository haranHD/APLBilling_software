const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/register-owner', authController.registerOwner);

// Protected routes
router.get('/me', requireAuth, authController.getProfile);

module.exports = router;
