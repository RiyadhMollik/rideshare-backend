// routes/ratingRoutes.js
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const ratingController = require('../controllers/ratingController');

const router = express.Router();

router.post('/rating', authenticateToken, ratingController.addRating);

module.exports = router;
