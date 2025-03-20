const { User, RideSharing, RideSharingRequest } = require('../models/index');
const redisClient = require('../config/redis');
const turf = require('@turf/turf'); // Import turf.js for geometry operations
const { Op } = require('sequelize');

// Create a new ride with polyline
exports.createRide = async (req, res) => {
    const driver_id = req.user.user_id; // Get the authenticated user from the request
    try {
        const {
            vehicle,
            vehicle_number,
            available_seats,
            total_seats,
            per_seat_price,
            pickup_lat,
            pickup_lng,
            pickup_address, // Assuming you want to store address details as well
            destination_lat,
            destination_lng,
            destination_address, // Assuming you want to store address details as well
            ride_time,
            polyline // Array of lat/lng points representing the route
        } = req.body;

        // Create the ride-sharing entry in the database
        const ride = await RideSharing.create({
            driver_id,
            vehicle,
            vehicle_number,
            available_seats,
            total_seats,
            per_seat_price,
            pickup_point: {
                lat: pickup_lat,
                lng: pickup_lng,
                address: pickup_address
            },
            destination_point: {
                lat: destination_lat,
                lng: destination_lng,
                address: destination_address
            },
            polyline, // Polyline route points
            ride_time
        });

        // Store pickup and destination coordinates in Redis for fast geospatial search
        await redisClient.geoAdd('ride:pickup_points', {
            longitude: pickup_lng,
            latitude: pickup_lat,
            member: `ride:${ride.id}:pickup`
        });

        await redisClient.geoAdd('ride:destination_points', {
            longitude: destination_lng,
            latitude: destination_lat,
            member: `ride:${ride.id}:destination`
        });

        res.status(201).json({ 
            success: true, 
            message: 'Ride created successfully', 
            ride 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating ride', 
            error 
        });
    }
};


// Search for available rides (Passenger) with path matching
exports.searchRides = async (req, res) => {
    try {
        const { pickup_lat, pickup_lng, destination_lat, destination_lng, radius = 5000, seats_required = 1, ride_time } = req.query;

     // Step 1: Find nearby pickup and destination points using Redis
const nearbyPickupRides = await redisClient.geoSearch(
    'ride:pickup_points',
    {
        longitude: pickup_lng,
        latitude: pickup_lat
    },
    {
        radius: radius,
        unit: 'km',
        withCoordinates: true,
        withDistances: true,
        withHashes: true,
        count: 5,
        sort: 'ASC'
    }
);

const nearbyDestinationRides = await redisClient.geoSearch(
    'ride:destination_points',
    {
        longitude: destination_lng,
        latitude: destination_lat
    },
    {
        radius: radius,
        unit: 'km',
        withCoordinates: true,
        withDistances: true,
        withHashes: true,
        count: 5,
        sort: 'ASC'
    }
);


if (nearbyPickupRides.length === 0 || nearbyDestinationRides.length === 0) {
    return res.status(404).json({ success: false, message: "No rides found near your pickup or destination location." });
}

      
// Extract ride IDs from Redis results
const pickupRideIds = new Set(
    nearbyPickupRides.map(ride => {
        const rideId = ride.split(':')[1]; // Split the string directly to get the ID
        return rideId ? rideId : null; // Return only valid ride IDs
    }).filter(rideId => rideId !== null) // Filter out null values
);

const destinationRideIds = new Set(
    nearbyDestinationRides.map(ride => {
        const rideId = ride.split(':')[1]; // Split the string directly to get the ID
        return rideId ? rideId : null; // Return only valid ride IDs
    }).filter(rideId => rideId !== null) // Filter out null values
);

// Find common ride IDs between pickup and destination
const matchingRideIds = [...pickupRideIds].filter(rideId => destinationRideIds.has(rideId));
console.log("matching rides:", matchingRideIds);

if (matchingRideIds.length === 0) {
    return res.status(404).json({ success: false, message: "No rides match both pickup and destination points." });
}
        // Step 2: Retrieve all matching rides from MySQL
        const matchedRides = await RideSharing.findAll({
            where: {
            id: {
                [Op.in]: matchingRideIds // Use Op.in to match multiple IDs
            },
            available_seats: {
                [Op.gte]: seats_required // Ensure seats required is valid and not null
            },
            ride_time: {
                [Op.gte]: ride_time // Ensure ride_time is valid and not null
            }
            },
            include: [
            { model: RideSharingRequest },
            { model: User, as: 'driver' }
            ]
        });
        console.log("matched rides:", matchedRides);
        if (matchedRides.length === 0) {
            return res.status(404).json({ success: false, message: "0 rides available matching the search criteria." });
        }

    //  //   Step 3: Use Turf.js to check if pickup and destination points are on the same path (polyline) of the ride
    //     const ridesOnSamePath = matchedRides.filter(ride => {
    //         const route = turf.lineString(ride.polyline); // Convert polyline to a Turf.js LineString
    //         const pickupPoint = turf.point([parseFloat(pickup_lng), parseFloat(pickup_lat)]);
    //         const destinationPoint = turf.point([parseFloat(destination_lng), parseFloat(destination_lat)]);

    //         // Check if pickup and destination points are within a small buffer (e.g., 100 meters) of the route
    //         const isPickupOnRoute = turf.booleanPointOnLine(pickupPoint, route, { tolerance: 0.1 });
    //         const isDestinationOnRoute = turf.booleanPointOnLine(destinationPoint, route, { tolerance: 0.1 });

    //         return isPickupOnRoute && isDestinationOnRoute;
    //     });

    //     if (ridesOnSamePath.length === 0) {
    //         return res.status(404).json({ success: false, message: "No rides found with matching routes." });
    //     }

        // Step 4: Return the filtered rides that match the path
        res.status(200).json({
            success: true,
            rides: matchedRides
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error searching for rides.", error });
    }
};


// Book a ride (Passenger)
exports.bookRide = async (req, res) => {
    
   try {
    const passenger_id = req.user.user_id;
        const { ride_sharing_id, requested_seats, pickup_point, destination_point, note } = req.body;

        const newRequest = await RideSharingRequest.create({
            ride_sharing_id,
            passenger_id,
            requested_seats,
            pickup_point,
            destination_point,
            note,
            status: 'pending'
        });
console.log("newRequest:", newRequest);
        res.status(201).json({
            success: true,
            message: "Ride request sent successfully.",
            request_id: newRequest.id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error booking ride.", error });
    }
};

// Manage ride request status (Driver accepts/rejects)
exports.manageRideRequest = async (req, res) => {
    try {
      //  const driver_id = req.user.user_id;
        const { id } = req.params;
        const { status } = req.body; // accepted/rejected

        const rideRequest = await RideSharingRequest.findByPk(id);
        if (!rideRequest) {
            return res.status(404).json({ success: false, message: "Ride request not found." });
        }
        if(rideRequest.status !== 'pending'){
            return res.status(400).json({ success: false, message: "Ride request is not pending." });
        }
        //TODO: Check if the driver is authorized to manage this ride request
        // if (rideRequest.driver_id !== driver_id) {
        //     return res.status(403).json({ success: false, message: "You are not authorized to manage this ride request." });
        // }
        rideRequest.status = status;
        await rideRequest.save();

        res.status(200).json({
            success: true,
            message: `Ride request ${status}.`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ride request.", error });
    }
};

// Get ride details (Driver/Passenger)
exports.getRideDetails = async (req, res) => {
    try {
        const { ride_id } = req.params;
        console.log("ride_id:", ride_id);

        const ride = await RideSharing.findByPk(ride_id, {
            include: [
                { model: RideSharingRequest, as: 'RideSharingRequests' }, // Ensure alias matches model association
                { model: User, as: 'driver' }
            ]
        });

        if (!ride) {
            return res.status(404).json({ success: false, message: "Ride not found." });
        }

        res.status(200).json({ success: true, ride });
    } catch (error) {
        console.error("Error fetching ride details:", error);
        res.status(500).json({ success: false, message: "Error fetching ride details.", error: error.message });
    }
};



// Get all rides (Driver/Passenger)
exports.getUserRides = async (req, res) => {
    const user_id = req.user.user_id;
    const { isDriver } = req.query;
    console.log("isDriver:", isDriver);

    try {
        let rides;

        if (isDriver === 'true') {
            // Fetch all RideSharing records with associated RideSharingRequest and passengers
            rides = await RideSharing.findAll({
                where: { driver_id: user_id },
                include: [
                    {
                        model: RideSharingRequest,
                        include: [
                            {
                                model: User,
                                as: 'passenger' // Must match the alias used in associations
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'driver' // Must match the alias used in associations
                    }
                ]
            });
        } else {
            // Fetch all RideSharingRequest records with associated RideSharing and driver
            rides = await RideSharingRequest.findAll({
                where: { passenger_id: user_id },
                include: [
                    {
                        model: RideSharing,
                        include: [
                            {
                                model: User,
                                as: 'driver' // Must match the alias used in associations
                            }
                        ]
                    }
                ]
            });
        }

        res.status(200).json({ success: true, rides });
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).json({ success: false, message: "Error fetching rides.", error });
    }
};



// Cancel ride (Driver or Passenger)
exports.cancelRide = async (req, res) => {
    try {
        const driver_id = req.user.user_id;
        const { ride_id } = req.params;
        
        
        const ride = await RideSharing.findByPk(ride_id);
        if (!ride) {
            return res.status(404).json({ success: false, message: "Ride not found." });
        }
        if(driver_id !== ride.driver_id){
            return res.status(403).json({ success: false, message: "You are not authorized to cancel this ride." });
        }

        // Logic to cancel the ride based on user (driver or passenger)
        ride.status = 'canceled';
        await ride.save();

        res.status(200).json({ success: true, message: "Ride canceled successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error canceling ride.", error });
    }
};
