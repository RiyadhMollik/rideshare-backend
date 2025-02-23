// routes/paymentRoutes.js
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/payment',authenticateToken,  paymentController.processPayment);

module.exports = router;
