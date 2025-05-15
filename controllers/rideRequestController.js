const RideRequest = require('../models/RideRequest');
const Driver = require('../models/riderModel');
const rideRequestModel = require('../models/rideRequestModel');
const { Op } = require('sequelize');
const { User, VehicleType } = require('../models');
const admin = require("firebase-admin");
const DriverVehicle = require('../models/driverVehicle');

exports.getRideRequestMetrics = async (req, res) => {
  try {
    // Total Ride Requests
    const totalRideRequests = await rideRequestModel.count();
    // Total Ride Places
    const totalRidePlaces = await rideRequestModel.aggregate('pickup_place', 'DISTINCT', { plain: false });
    const destinationPlaces = await rideRequestModel.aggregate('destination_place', 'DISTINCT', { plain: false });
    const allPlaces = [...new Set([...totalRidePlaces.map(p => p['pickup_place']), ...destinationPlaces.map(p => p['destination_place'])])];

    // Total Ride Canceled
    const totalRideCanceled = await rideRequestModel.count({
      where: { status: 'ride_canceled' }
    });

    // Total Ride Request Pending
    const totalRideReqPending = await rideRequestModel.count({
      where: { status: 'pending' }
    });

    // Total Ride Complete
    const totalRideComplete = await rideRequestModel.count({
      where: { status: 'ride_completed' }
    });

    // Total Bidding/Active
    const totalBiddingActive = await rideRequestModel.count({
      where: {
        status: {
          [Op.or]: ['bidding', 'ride_active']
        }
      }
    });

    // Return all metrics as a response
    res.json({
      totalRideRequests,
      totalRidePlaces: allPlaces.length,
      totalRideCanceled,
      totalRideReqPending,
      totalRideComplete,
      totalBiddingActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRideRequest = async (req, res) => {
  const rideid = req.query.id;
  try {
    const rideRequest = await RideRequest.getRideRequest(rideid);
    res.status(200).json(rideRequest);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to get ride request', error: error.message })
  }
};
exports.getAllUserRideRequests = async (req, res) => {
  const { isDriver, filter } = req.query;
  const userId = req.user.user_id;
  try {
    const rideRequests = await RideRequest.getAllRideRequestsByUser(userId, isDriver === 'true', filter);
    res.status(200).json({ success: true, data: rideRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// get all rides for showing in admin panel

exports.getAllRideRequests = async (req, res) => {
  // Extract query parameters for pagination and status filter
  const { status = null, page = 1, limit = 10, search } = req.query;

  try {
    // Call the service method with the provided status, page, and limit
    const { rideRequests, pagination } = await RideRequest.getAllRideRequests(
      status,
      parseInt(page),   // Convert page to integer
      parseInt(limit),  // Convert limit to integer
      search
    );
    // Send the response with ride requests and pagination info
    res.status(200).json({
      success: true,
      data: rideRequests,
      pagination: {
        totalItems: pagination.total_items,
        totalPages: pagination.total_pages,
        currentPage: pagination.current_page,
        pageSize: pagination.page_size
      }
    });
  } catch (error) {
    // Handle errors and send a failure response
    console.error('Error fetching ride requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.newMessage = async (req, res) => {
  const { message, name, userId, role, rideRequestId } = req.body;

  try {
    const io = req.app.get('socketio');
    io.to(`rideRequest:${rideRequestId}`).emit('newMessage', { userId, name, message, role });
    res.status(200).json({ "message": "send message successfully" });
  } catch (error) {
    res.status(500).json("Can't send message");
  }
};
exports.updateLocation = async (req, res) => {
  const { role, userId, lat, lng, rideRequestId } = req.body;

  try {
    const io = req.app.get('socketio');
    io.to(`rideRequest:${rideRequestId}`).emit('locationUpdate', { role, userId, lat, lng });
    res.status(200).json({ "message": "location update successfully" });
  } catch (error) {
    res.status(500).json("failed to update location");
  }
};

exports.createRideRequest = async (req, res) => {
  const { service_id, vehicle_type, pickup_point, destination, pickup_place, destination_place, user_name, user_pic, user_rating, user_number, time, fare, extra_details, user_fcm_token } = req.body;
  const user_id = req.user.user_id;
  const rideRequest = new RideRequest(service_id, user_id, vehicle_type, pickup_point, destination, pickup_place, destination_place, user_name, user_pic, user_rating, user_number, time, fare, extra_details, user_fcm_token);
  console.log(rideRequest);

  try {
    await rideRequest.save();
    console.log(rideRequest);

    const jsonPickupPoint = JSON.parse(JSON.stringify(pickup_point));
    // Find nearby drivers for the specific service and vehicle type, limited to 20
    if (rideRequest.status == 'bidding') {
      const nearbyDriverSocketIds = await Driver.getNearbyDrivers(jsonPickupPoint.latitude, jsonPickupPoint.longitude, service_id, vehicle_type, 10, 20);
      // Emit event to notify nearby drivers of the new ride request
      const io = req.app.get('socketio');
      nearbyDriverSocketIds.forEach(socketId => {
        io.to(socketId).emit('rideRequest', rideRequest); // Emitting to a specific driver's socket
      });
    }
    const title = 'নতুন রাইড অনুরোধ';
    const body = 'নতুন একটি রাইড অনুরোধ এসেছে।';

    const vehicleTypeId = rideRequest.vehicle_type;

    const driverVehicles = await DriverVehicle.findAll({
      where: { vehicleTypeId },
      attributes: ['driverId'],
    });
    const driverIds = driverVehicles.map(dv => dv.driverId);

    if (driverIds.length === 0) {
      return res.status(400).json({ error: "No drivers found for this vehicle type" });
    }

    // Step 2: Get push tokens for those driver IDs
    const users = await User.findAll({
      where: {
        user_id: {
          [Op.in]: driverIds,
        },
        push_token: {
          [Op.not]: null,
        },
        user_type: 'driver',
      },
      attributes: ['push_token'],
    });

    const tokens = users.map(user => user.push_token).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No valid push tokens found" });
    }

    // Firebase allows a maximum of 500 tokens per request
    const BATCH_SIZE = 500;
    const tokenChunks = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      tokenChunks.push(tokens.slice(i, i + BATCH_SIZE));
    }

    const message = {
      notification: { title, body },
    };

    for (const chunk of tokenChunks) {
      const messageWithTokens = { ...message, tokens: chunk };
      try {
        await admin.messaging().sendEachForMulticast(messageWithTokens);
      } catch (error) {
        console.error("Error sending push notification", error);
        return res.status(500).json({ error: "Failed to send notifications" });
      }
    }
    res.status(201).json(rideRequest);
  } catch (error) {
    console.error('Error in createRideRequest controller:', error);
    res.status(500).json({ message: 'Failed to create ride request', error: error.message });
  }
};
exports.approveRideRequest = async (req, res) => {
  const { rideRequestId } = req.body;
  try {
    const updatedRideRequest = await RideRequest.approveRideRequest(rideRequestId);
    const nearbyDriverSocketIds = await Driver.getNearbyDrivers(updatedRideRequest.pickup_point.latitude, updatedRideRequest.pickup_point.longitude, updatedRideRequest.service_id, updatedRideRequest.vehicle_type, 10, 20);

    console.log('latitude:', updatedRideRequest.pickup_point.latitude);
    console.log('nearbyDriverSocketIds:', nearbyDriverSocketIds);
    console.log('ride status:', updatedRideRequest.status);
    // Emit event to notify nearby drivers of the new ride request
    const io = req.app.get('socketio');
    nearbyDriverSocketIds.forEach(socketId => {
      io.to(socketId).emit('rideRequest', updatedRideRequest); // Emitting to a specific driver's socket
    });
    res.status(200).json(updatedRideRequest);
  } catch (error) {
    console.error('Error in approveRideRequest controller:', error);
    res.status(500).json({ message: 'Failed to approve ride request', error: error.message });
  }
}
exports.getAllNearbyRideRequests = async (req, res) => {
  const { serviceId, vehicleType, latitude, longitude } = req.query;
  console.log(serviceId, vehicleType);

  try {
    const rideRequests = await RideRequest.getAllNearby(serviceId, vehicleType, latitude, longitude);
    console.log(rideRequests);
    res.status(200).json(rideRequests);
  } catch (error) {
    console.error('Error in getAllNearbyRideRequests controller:', error);
    res.status(500).json({ message: 'Failed to fetch nearby ride requests', error: error.message });
  }
};
exports.addBid = async (req, res) => {
  const { rideRequestId, bidAmount, profilePic, rating, name, vehicle, vehicleNumber, number, fcmToken, adminCommissionRate, serviceCharge } = req.body;
  const riderId = req.user.user_id;
  try {
    const updatedRideRequest = await RideRequest.addBid(rideRequestId, riderId, bidAmount, profilePic, rating, name, vehicle, vehicleNumber, number, fcmToken, adminCommissionRate, serviceCharge);
    // Emit event to notify clients of new bid for a specific ride request
    const io = req.app.get('socketio');
    io.to(`rideRequest:${rideRequestId}`).emit('newBid', { rideRequestId, riderId, bidAmount, profilePic, rating, name, vehicle, fcmToken, status: 'pending' });
    res.status(200).json(updatedRideRequest);
  } catch (error) {
    console.error('Error in addBid controller:', error);
    if (error.message === 'Bid already exists') {
      return res.status(400).json({ message: error.message });
    }
    else if (error.type === 'INSUFFICIENT_BALANCE') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to add bid', error: error.message });
    }
  }
};

exports.updateBidStatus = async (req, res) => {
  const { rideRequestId, riderId, status } = req.body;
  // console.log(status);

  try {
    const updatedRideRequest = await RideRequest.updateBidStatus(rideRequestId, riderId, status);
    // Emit event to notify all clients in the specific rideRequest room of bid status update
    const io = req.app.get('socketio');
    io.to(`rideRequest:${rideRequestId}`).emit('rideStatusUpdate', { rideRequestId, riderId, status });
    res.status(200).json(updatedRideRequest);
  } catch (error) {
    console.error('Error in updateBidStatus controller:', error);
    res.status(500).json({ message: 'Failed to update bid status', error: error.message });
  }
};
exports.updateRideStatus = async (req, res) => {
  const { rideRequestId, newStatus, otp } = req.body; // Extract OTP from request body if provided
  const userId = req.user.user_id;
  try {
    // Update ride status and verify OTP if necessary
    const updateResponse = await RideRequest.updateRideReqStatus(rideRequestId, newStatus, otp);
    console.log(updateResponse);
    // Handle OTP verification failure
    if (updateResponse.error) {
      return res.status(400).json({ message: updateResponse.error });
    }
    // Emit event to notify all clients in the specific rideRequest room of status update
    const io = req.app.get('socketio');
    console.log(`rideRequest:${rideRequestId} newStatus:${newStatus}`);

    io.to(`rideRequest:${rideRequestId}`).emit('rideStatusUpdate', { status: newStatus });
    console.log('ride status updated');

    res.status(200).json({ message: 'Ride status updated successfully' });
  } catch (error) {
    console.error('Error in updateRideStatus controller:', error);
    res.status(500).json({ message: 'Failed to update ride status', error: error.message });
  }
};

exports.getRideRequestById = async (req, res) => {
  try {
    const { id } = req.params; // Ensure id is extracted correctly
    if (!id) {
      return res.status(400).json({ error: "Ride request ID is required" });
    }
    const rideRequest = await rideRequestModel.findByPk(id); // Use findByPk or findOne
    const vehicle_type = await VehicleType.findByPk(rideRequest.vehicle_type);
    
    if (!rideRequest || !vehicle_type) {
      return res.status(404).json({ error: "Ride request not found" });
    }
    res.status(200).json( { rideRequest, vehicle_type });
  } catch (error) {
    console.error("Error fetching ride request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateRideRequestPlaces = async (req, res) => {
  const { id } = req.params;
  const { pickup_place, destination_place } = req.body;

  try {
    if (!pickup_place || !destination_place) {
      return res.status(400).json({ message: "Pickup place and destination place are required" });
    }

    // Use .update() to only touch specific fields
    const [updatedRows] = await rideRequestModel.update(
      { pickup_place, destination_place },
      {
        where: { id }
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Ride request not found or nothing updated" });
    }

    const updatedRideRequest = await rideRequestModel.findByPk(id);

    return res.status(200).json({ message: "Ride request updated successfully", rideRequest: updatedRideRequest });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteRideRequest = async (req, res) => {
  const { id } = req.params; 

  try {
    const rideRequest = await rideRequestModel.findByPk(id);
    if (!rideRequest) {
      return res.status(404).json({ message: 'Ride request not found' });
    }

    await rideRequest.destroy();

    res.json({ message: 'ride request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete ride request', error: error.message });
  }
};
