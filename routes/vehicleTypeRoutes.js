// Description: This file contains the routes for vehicle types.
const express = require('express');
const router = express.Router();
const VehicleTypeController = require('../controllers/vehicleTypeController');
const { adminOnly } = require('../middleware/adminMiddleware');

// Create a new vehicle type (Admin Only)
router.post('/vehicle-types', adminOnly, VehicleTypeController.createVehicleType);

// Get all vehicle types
router.get('/vehicle-types', VehicleTypeController.getAllVehicleTypes);

router.get('/vehicle-types/:vehicleTypeId', VehicleTypeController.vehicleTypeDetails);

// Edit a vehicle type (Admin Only)
router.put('/vehicle-types/:vehicleTypeId', adminOnly, VehicleTypeController.editVehicleType);

// Delete a vehicle type (Admin Only)
router.delete('/vehicle-types/:vehicleTypeId', adminOnly, VehicleTypeController.deleteVehicleType);

module.exports = router;