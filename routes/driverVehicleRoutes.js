const express = require('express');
const router = express.Router();
const DriverVehicleController = require('../controllers/driverVehicleController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Create a new driver vehicle
router.post('/driver-vehicles', authenticateToken, DriverVehicleController.createDriverVehicle);
// Get all driver vehicles (admin only)
router.get('/driver-vehicles', adminOnly, DriverVehicleController.getAllDriverVehicles);

// Get all driver vehicles by driver ID
router.get('/driver-vehicles/driver', authenticateToken, DriverVehicleController.getDriverVehiclesByDriverId);
router.get('/driver-vehicles/driver/:driverId', DriverVehicleController.getDriversVehiclesByDriverId);

// Get a single driver vehicle by ID
router.get('/driver-vehicles/:id', DriverVehicleController.getDriverVehicleById);

// Update a driver vehicle
router.put('/driver-vehicles/:id', adminOnly, DriverVehicleController.updateDriverVehicle);

// Delete a driver vehicle
router.delete('/driver-vehicles/:id', authenticateToken, DriverVehicleController.deleteDriverVehicle);

// Approve a driver vehicle (admin only)
router.put('/driver-vehicles/approve/:id', adminOnly, DriverVehicleController.approveDriverVehicle);

module.exports = router;
