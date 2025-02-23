
const express = require('express');
const router = express.Router();
const ridesharingController = require('../controllers/rideSharingController');
const { authenticateToken } = require('../middleware/authMiddleware');
// Driver creates a ride
router.post('/ridesharing', authenticateToken, ridesharingController.createRide);

// Passenger searches for rides
router.get('/ridesharing/search', ridesharingController.searchRides);

// Passenger books a ride
router.post('/ridesharing/request', authenticateToken, ridesharingController.bookRide);

// Driver accepts/rejects ride requests
router.patch('/ridesharing/request/:id/status', ridesharingController.manageRideRequest);

// Get all rides of a user
router.get('/ridesharing/myridess',authenticateToken, ridesharingController.getUserRides);

// Get details of a ride
router.get('/ridesharing/:ride_id',authenticateToken, ridesharingController.getRideDetails);

// Cancel a ride (for both driver and passenger)
router.patch('/ridesharing/:ride_id/cancel', authenticateToken, ridesharingController.cancelRide);



module.exports = router;
 
