const Driver = require('../models/riderModel');
const redisClient = require('../config/redis');
const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
// join service channel for ride request
    socket.on('joinFindRideChannel', ({ serviceId, vehicleType }) => {
      const serviceChannel = `service:${serviceId}:vehicle:${vehicleType}`;
      socket.join(serviceChannel);
      console.log(`Client ${socket.id} joined ${serviceChannel}`);
    });
    // join ride request to get update about bid, ride status
    socket.on('joinRideRequest', (rideRequestId) => {
      socket.join(`rideRequest:${rideRequestId}`);
      console.log(`Client joined rideRequest room: rideRequest:${rideRequestId}`);
    });

    socket.on('driverUpdateLocation', async (data) => {
      const { driverId, latitude, longitude, serviceId, vehicleType } = data;
  
      const driver = new Driver(driverId, latitude, longitude, serviceId, vehicleType, socket.id);
      await driver.saveLocation();
  
      console.log(`Updated location for driver ${driverId}`);
    });
    socket.on('locationUpdate', (data) => {
      const { role, userId, lat, lng, rideRequestId } = data;
      console.log(`Location update received: ${JSON.stringify(data)}`);
  
      // Emit the location update to the specific rideRequest room
      io.to(`rideRequest:${rideRequestId}`).emit('locationUpdate', { role, userId, lat, lng });
    });

    //bus routes
  // Listen for the 'authenticate' event (sending the routeID)
  socket.on('joinBusRoutes', (routeID) => {
    // Join the room based on the routeID
    socket.join(routeID);
    console.log(`Client joined route: ${routeID}`);
});
 // Listen for a 'leave' event to exit from a route's room
 socket.on('leaveBusRoute', (routeID) => {
  // Leave the room based on the routeID
  socket.leave(routeID);
  console.log(`Client left route: ${routeID}`);
});


// Listen for location updates sent by buses
socket.on('busLocation', (data) => {
    const { routeID, lat, lng } = data;
    console.log(`Location update received for route ${routeID}: ${lat}, ${lng}`);

    // Emit the location update only to clients in the same routeID room
    io.to(routeID).emit('busUpdate', { routeID, lat, lng });
});

    socket.on('disconnect', async () => {
      try {
        // Fetch the driver's serviceId and vehicleType from Redis
        const driverData = await redisClient.hGetAll(`driver:${socket.id}`);
        const { serviceId, vehicleType } = driverData;
  
        // Remove the driver location and socket ID from Redis
        await redisClient.zRem(`drivers:locations:${serviceId}:${vehicleType}`, socket.id);
        await redisClient.del(`driver:${socket.id}`);
  
        console.log(`Driver disconnected and removed from geospatial index: ${socket.id}`);
      } catch (err) {
        console.error(`Failed to remove driver from geospatial index: ${socket.id}`, err);
      }
    });
  });
};

module.exports = { initializeSocket, getIO: () => io };
