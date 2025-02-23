const express = require('express');
const router = express.Router();
const { createTopUpRequest, getTopUpRequests, approveTopUpRequest} = require('../controllers/walletController'); // Adjust path accordingly
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
router.post('/topup-request',authenticateToken, createTopUpRequest);
// GET request with pagination
router.get('/top-up-requests',adminOnly, getTopUpRequests);
router.post('/approve-topup-request',adminOnly, approveTopUpRequest);
module.exports = router;
