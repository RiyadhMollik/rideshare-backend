const { v4: uuidv4 } = require('uuid');
const redisClient = require('../config/redis');
const generateOtp = require('../utils/generateOtp');
const { Op } = require('sequelize');
const RideRequestModel = require('../models/rideRequestModel');
const GlobalSettings = require('../models/settings');
const User = require('../models/user');
const admin = require("firebase-admin");
class RideRequest {
  constructor(service_id, user_id, vehicle_type, pickup_point, destination, pickup_place, destination_place, user_name, user_pic, user_rating, user_number, time, fare, extra_details, user_fcm_token) {
    this.user_id = user_id;
    this.service_id = service_id;
    this.vehicle_type = vehicle_type;
    this.pickup_point = pickup_point;
    this.destination = destination;
    this.pickup_place = pickup_place;
    this.destination_place = destination_place;
    this.user_name = user_name;
    this.user_pic = user_pic;
    this.user_rating = user_rating;
    this.user_number = user_number;
    this.time = time;
    this.fare = fare;
    this.extra_details = extra_details;
    this.status = 'pending';
    this.bids = [];
    this.user_fcm_token = user_fcm_token;
  }
  async save() {
    try {
      const globalSettings = await GlobalSettings.findOne();
      const approveNeed = globalSettings.approveNeed || false;

      this.status = approveNeed ? 'pending' : 'bidding'; // Set status based on approveNeed
      const otp = generateOtp();


      console.log(otp);

      // Save ride request to MySQL without manually setting the id
      const savedRideRequest = await RideRequestModel.create({
        user_id: this.user_id,
        service_id: this.service_id,
        vehicle_type: this.vehicle_type,
        pickup_point: this.pickup_point,
        destination: this.destination,
        pickup_place: this.pickup_place,
        destination_place: this.destination_place,
        user_name: this.user_name,
        user_pic: this.user_pic,
        user_rating: this.user_rating,
        user_number: this.user_number,
        time: this.time,
        fare: this.fare,
        extra_details: this.extra_details,
        status: this.status,
        bids: this.bids,
        user_fcm_token: this.user_fcm_token,
        otp: otp,
        created_at: new Date(),
        updated_at: new Date()
      });

      this.id = savedRideRequest.id;
      console.log('savedRideRequest', savedRideRequest);

      console.log('request id', this.id);

      // Save ride request location to Redis (for geo-related tasks only)
      await redisClient.geoAdd(`rideRequests:locations:${this.service_id}:${this.vehicle_type}`, {
        longitude: this.pickup_point.longitude,
        latitude: this.pickup_point.latitude,
        member: String(this.id)
      });

    } catch (err) {
      console.error('Failed to save ride request:', err);
      throw new Error('Failed to save ride request');
    }
  }

  static async approveRideRequest(rideRequestId) {
    try {
      const rideRequest = await RideRequestModel.findOne({ where: { id: rideRequestId } });
      if (!rideRequest) {
        throw new Error('Ride request not found');
      }

      rideRequest.status = 'bidding';
      await RideRequestModel.update(
        { status: rideRequest.status },
        { where: { id: rideRequestId } }
      );

      return rideRequest;
    } catch (err) {
      console.error('Failed to approve ride request:', err);
      throw new Error('Failed to approve ride request');
    }
  }
  static async getRideRequest(rideRequestId) {
    try {
      const rideRequest = await RideRequestModel.findOne({ where: { id: rideRequestId } });
      if (!rideRequest) {
        throw new Error('Ride request not found');
      }
      return rideRequest;
    } catch (error) {
      console.error('Failed to retrieve ride request:', error);
      throw new Error('Failed to get ride request');
    }
  }
  static async addBid(
    rideRequestId,
    riderId,
    bidAmount,
    profilePic,
    rating,
    name,
    vehicle,
    vehicleNumber,
    number,
    fcmToken, adminCommissionRate, service_charge
  ) {
    // Fetch the ride request
    const rideRequest = await RideRequestModel.findOne({ where: { id: rideRequestId } });
    if (!rideRequest) {
      throw new Error('Ride request not found');
    }
    // Check if the ride is already booked or has reached the max bids
    if (rideRequest.status !== 'bidding') {
      throw new Error('Ride already booked');
    }
    // Get the existing bids
    let bids = rideRequest.bids;
    // Add the new bid to the bids array
    if (!Array.isArray(bids)) {
      bids = bids ? JSON.parse(bids) : [];
    }
    // Fetch the driver's profile to check the wallet balance
    const driverProfile = await User.findOne({ where: { user_id: riderId } });
    if (!driverProfile) {
      throw new Error('Driver not found');
    }
    //TODO: Add admin commission value from service Vehicle table
    // Calculate the admin commission (assume it’s a percentage of the bid amount)
    const newAdminCommissionRate = adminCommissionRate / 100; // Convert to a decimal
    const requiredAdminCommission = bidAmount * newAdminCommissionRate; // 15% of the bid amount
    const serviceCharge = service_charge / 100;
    const totalServiceCharge = serviceCharge * bidAmount;
    const newBidAmount = totalServiceCharge + Number(bidAmount);
    console.log("new bid amount ", newBidAmount);
    // Check if the driver has enough balance in their wallet
    console.log("driver wallet:", driverProfile.wallet_balance);
    // if (Number(driverProfile.wallet_balance) < requiredAdminCommission) {
    //   throw { message: 'Insufficient balance to cover admin commission', type: 'INSUFFICIENT_BALANCE' };
    // }
    // Add the bid to the ride request
    bids.push({
      rideRequestId,
      riderId,
      bidAmount: newBidAmount,
      profilePic,
      rating,
      name,
      vehicle,
      vehicleNumber,
      number,
      fcmToken,
      status: 'pending',
    });

    rideRequest.bids = bids;
    // Update the ride request with the new bid
    await RideRequestModel.update(
      { bids: rideRequest.bids },
      { where: { id: rideRequestId } }
    );

    const token = rideRequest.user_fcm_token;
    const tokens = [token];
    const title = 'রাইডের অনুরোধ';
    const body = 'আপনার যাত্রার জন্য কেউ নতুন দাম প্রস্তাব করেছে।';
    const message = {
      notification: { title, body },
      tokens,
    };
    await admin.messaging().sendEachForMulticast(message);

    return rideRequest;
  }
  static async updateBidStatus(rideRequestId, riderId, bidStatus) {
    try {
      const rideRequest = await RideRequestModel.findOne({ where: { id: rideRequestId } });
      if (!rideRequest) {
        throw new Error('Ride request not found');
      }

      let bids = rideRequest.bids;
      bids = JSON.parse(bids);
      const bidIndex = bids.findIndex(bid => bid.riderId === riderId);
      if (bidIndex === -1) {
        throw new Error('Bid not found');
      }

      bids[bidIndex].status = bidStatus;

      const driverRating = bids[bidIndex].rating || 5;

      if (bidStatus === 'accepted') {
        rideRequest.driver_id = riderId;
        rideRequest.fare = bids[bidIndex].bidAmount;
        rideRequest.driver_pic = bids[bidIndex].profilePic;
        rideRequest.driver_name = bids[bidIndex].name;
        rideRequest.vehicle = bids[bidIndex].vehicle;
        rideRequest.vehicle_number = bids[bidIndex].vehicleNumber;
        rideRequest.driver_number = bids[bidIndex].number;
        rideRequest.driver_fcm_token = bids[bidIndex].fcmToken;
        rideRequest.driver_rating = driverRating;
        rideRequest.status = 'ride_placed';

        await RideRequestModel.update({
          status: rideRequest.status,
          driver_id: rideRequest.driver_id,
          fare: rideRequest.fare,
          driver_pic: rideRequest.driver_pic,
          driver_name: rideRequest.driver_name,
          vehicle: rideRequest.vehicle,
          vehicle_number: rideRequest.vehicle_number,
          driver_number: rideRequest.driver_number,
          driver_fcm_token: rideRequest.driver_fcm_token,
          driver_rating: rideRequest.driver_rating,
        }, { where: { id: rideRequestId } });

        bids[bidIndex].status = bidStatus;
        const token = bids[bidIndex].fcmToken;
        const tokens = [token];
        const title = 'রাইডের অনুরোধ';
        const body = 'আপনার বিড ' + bidStatus + ' হয়েছে';
        const message = {
          notification: { title, body },
          tokens,
        };
        await admin.messaging().sendEachForMulticast(message);
      }
      return rideRequest;
    } catch (err) {
      console.error('Failed to update bid status:', err);
      throw new Error('Failed to update bid status');
    }
  }

  static async updateRideReqStatus(rideRequestId, newStatus, otp = null) {
    try {
      //TODO: now anyone can update status. please change this.
      if (newStatus === 'ride_completed') {
        const rideRequest = await RideRequestModel.findOne({ where: { id: rideRequestId } });

        if (!rideRequest) {
          throw new Error('Ride request not found');
        }

        if (rideRequest.otp !== otp) {
          return { error: 'Invalid OTP' };
        }
      }
      const rideRequest = await RideRequestModel.findOne({ where: { id: rideRequestId } });
      const userToken = rideRequest.user_fcm_token;
      const driverToken = rideRequest.driver_fcm_token;
      let token = null;
      if (newStatus === 'ride_active' || newStatus === 'arrived' || newStatus === 'ride_in_progress' || newStatus === 'ride_completed') {
        token = userToken;
      }
      else {
        token = driverToken;
      }
      const tokens = [token];
      const title = 'রাইডের অনুরোধ';
      const body = 'আপনার যাত্রা ' + newStatus + ' হয়েছে';
      const message = {
        notification: { title, body },
        tokens,
      };
      await admin.messaging().sendEachForMulticast(message);
      await RideRequestModel.update(
        { status: newStatus },
        { where: { id: rideRequestId } }
      );

      return { success: true };
    } catch (err) {
      console.error('Failed to update ride request status:', err);
      throw new Error('Failed to update ride request status');
    }
  }

  static async getAllRideRequestsByUser(userId, isDriver = false, filter = 'all') {
    try {
      const whereClause = isDriver ? { driver_id: userId } : { user_id: userId };

      if (filter === 'history') {
        whereClause[Op.or] = [
          { status: 'ride_canceled' },
          { status: 'ride_completed' }
        ];
      } else if (filter === 'running') {
        whereClause[Op.or] = [
          { status: 'pending' },
          { status: 'bidding' },
          { status: 'ride_placed' },
          { status: 'ride_active' },
          { status: 'arrived' },
          { status: 'ride_in_progress' }
        ];
      }
      console.log(filter);
      const rideRequests = await RideRequestModel.findAll({ where: whereClause });
      return rideRequests;
    } catch (err) {
      console.error('Failed to fetch ride requests:', err);
      throw new Error('Failed to fetch ride requests');
    }
  }

  static async getAllRideRequests(status = null, page = 1, limit = 10, search = '') {
    try {
      const whereClause = {};

      // Handle status filtering
      if (status && status !== 'expired') {
        whereClause.status = status;
      }

      // Special logic for expired
      if (status === 'expired') {
        whereClause.time = {
          [Op.lt]: new Date() // time is less than now => expired
        };
        // Optional: include only specific statuses like 'pending' or 'bidding'
        whereClause.status = {
          [Op.in]: ['pending', 'bidding', 'ride_placed']
        };
      }

      // Search filters
      if (search.trim() !== '') {
        whereClause[Op.or] = [
          { user_name: { [Op.like]: `%${search}%` } },
          { user_number: { [Op.like]: `%${search}%` } },
          { driver_name: { [Op.like]: `%${search}%` } },
        ];
      }

      // Pagination
      const offset = (page - 1) * limit;

      const totalRideRequests = await RideRequestModel.count({ where: whereClause });

      const rideRequests = await RideRequestModel.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'DESC']],
      });

      const total_pages = Math.ceil(totalRideRequests / limit);

      return {
        rideRequests,
        pagination: {
          total_items: totalRideRequests,
          total_pages,
          current_page: page,
          page_size: limit
        }
      };
    } catch (err) {
      console.error('Failed to fetch ride requests:', err);
      throw new Error('Failed to fetch ride requests');
    }
  }


  static async getAllNearby(serviceId, vehicleType, latitude, longitude, radius = 2) {
    try {
      // Fetch nearby IDs from Redis
      const nearbyRequestIds = await redisClient.zRangeByScore(
        `rideRequests:locations:${serviceId}:${vehicleType}`,
        '-inf',
        '+inf'
      );
      // If there are no nearby requests, return an empty array
      if (nearbyRequestIds.length === 0) {
        return [];
      }
      console.log(nearbyRequestIds);
      // Fetch all ride requests with the given IDs from MySQL
      const rideRequests = await RideRequestModel.findAll({
        where: {
          id: nearbyRequestIds,
          status: 'bidding'
          // Assuming bids is an array and you want to check its length
        },
        order: [['created_at', 'DESC']] // Sort by time, latest first
      });

      return rideRequests;
    } catch (err) {
      console.error('Failed to fetch nearby ride requests:', err);
      throw new Error('Failed to fetch nearby ride requests');
    }
  }
}

module.exports = RideRequest;
