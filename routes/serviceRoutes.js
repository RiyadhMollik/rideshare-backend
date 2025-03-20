// routes/serviceRoutes.js

const express = require('express');
const router = express.Router();

const ServiceController = require('../controllers/serviceController');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/multerConfig');
// Create a new service (Admin Only)
router.post('/services',upload.single('image'),  ServiceController.createService);

// Get all services, including their vehicles
router.get('/services', ServiceController.getAllServices);
router.get('/services/:id', ServiceController.ServiceDetails);

// Add a vehicle to a service (Admin Only)
 router.post('/services/vehicles', adminOnly, ServiceController.addVehicleToService);

// Edit a service (Admin Only)
 router.put('/services/:serviceId',upload.single('image'),   ServiceController.editService);

// Delete a service (Admin Only)
 router.delete('/services/:serviceId', adminOnly, ServiceController.deleteService);

// Update a service vehicle (Admin Only)
router.put('/services/vehicles/:vehicleId', adminOnly, ServiceController.updateServiceVehicle);

// Delete a service vehicle (Admin Only)
router.delete('/services/vehicles/:vehicleId', adminOnly, ServiceController.deleteServiceVehicle);

module.exports = router;
