const express = require('express');
const router = express.Router();
const routeController = require('../controllers/busRoutesController');

// API to authenticate route
router.post('/authenticate', routeController.authenticate);
router.get('/busroutes',  routeController.getAllRoutes);

module.exports = router;