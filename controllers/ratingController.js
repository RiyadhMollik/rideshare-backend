const express = require('express');
const router = express.Router();
const Rating = require('../models/ratingModel'); // Make sure the paths are correct
// POST /ratings
exports.addRating= async (req, res) => {
  const { rideRequestId, toUserId, rating, review } = req.body;
  const fromUserId = req.user.user_id; 

  try {
   // TODO: enable the check
    // const rideRequest = await RideRequest.findOne({ where: { id: rideRequestId } });
    // if (!rideRequest || (rideRequest.user_id !== fromUserId && rideRequest.driver_id !== fromUserId)) {
    //   return res.status(400).json({ message: 'Invalid ride request or unauthorized user' });
    // }

    const newRating = await Rating.create({
      ride_request_id: rideRequestId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      rating,
      review
    });

    res.status(201).json(newRating);
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ message: 'Failed to create rating', error: error.message });
  }
};
