//here is the resolver for the ride sharing schema

const { RideSharing, RideSharingRequest, User, RideRequestModel } = require('../../models'); 
const { Op } = require('sequelize');
const resolvers = {
  Query: {
    getDriverRides: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('Authenticated user:', user);
      try {
        const rides = await RideSharing.findAll({
          where: { driver_id: user.user_id },
          include: [
            {
              model: RideSharingRequest,
              as: 'RideSharingRequests', // Ensure this matches the association alias
              include: [
                {
                  model: User,
                  as: 'passenger'
                }
              ]
            },
            {
              model: User,
              as: 'driver' // This should also be defined properly in the associations
            }
          ]
        });
        console.log('Fetched rides:', JSON.stringify(rides, null, 2)); // Debugging output
        return rides;
      } catch (error) {
        console.error('Error fetching rides:', error);
        throw new Error('Error fetching rides');
      }
    },
    getPassengerRideRequests: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      try {
        const rideRequests = await RideSharingRequest.findAll({
          where: { passenger_id: user.user_id },
          include: [
            {
              model: RideSharing,
              as: 'ride', // This alias should match the model association
              include: [
                {
                  model: User,
                  as: 'driver' // Ensure the alias matches the association
                }
              ]
            },
            {
              model: User,
              as: 'passenger' // Include passenger information (though you may not need it)
            }
          ]
        });

        console.log('Ride requests:', rideRequests); // Debugging output
        return rideRequests;
      } catch (error) {
        console.error('Error fetching ride requests:', error);
        throw new Error('Error fetching ride requests');
      }
    }
    ,

    getNormalRides: async (parent, { isDriver }, { user }) => {
      try {
        if (isDriver) {
          let rides = await RideRequestModel.findAll({ where: { driver_id: user.user_id } });
          console.log('Driver rides:');
          return rides;
        } else {
          return await RideRequestModel.findAll({ where: { user_id: user.user_id } });
        }
      } catch (error) {
        console.error(error);
        throw new Error('Error fetching normal rides');
      }
    },

    getCombinedRides: async (parent, { isDriver, filter }, { user }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      try {
        let normalWhereClause = isDriver ? { driver_id: user.user_id } : { user_id: user.user_id };
        let pendingBidRides = [];
        if (isDriver && filter === 'running') {
          // Fetch only 'pending' rides
          const pendingRides = await RideRequestModel.findAll({
            where: { status: 'bidding' }
          });
          console.log('Pending rides:', pendingRides.length);
          // Filter those where the driver has placed a bid
          pendingBidRides = pendingRides
            .filter(ride => {
              const bids = Array.isArray(ride.bids) ? ride.bids : JSON.parse(ride.bids) ;
              bids.forEach(bid => console.log("bid.riderId:", bid.riderId));
              bids.forEach(bid => console.log("user.user_id:", user.user_id));
              return bids.some(bid => bid.riderId === user.user_id);
            })
            .map(ride => ({
              ...ride.toJSON(),
              type: 'NormalRide'
            }));
        }
        // Apply filter to Normal Rides
        if (filter === 'history') {
          normalWhereClause[Op.or] = [
            { status: 'ride_canceled' },
            { status: 'ride_completed' }
          ];
        } else if (filter === 'running') {
          normalWhereClause[Op.or] = [
            //TODO:: work on pending & ride_placed showing.
            { status: 'pending' },
            { status: 'bidding' },
            // { status: 'ride_placed' },
            { status: 'ride_active' },
            { status: 'arrived' },
            { status: 'ride_in_progress' }
          ];
        }
        // Fetch Normal Rides
        const normalRides = await RideRequestModel.findAll({
          where: normalWhereClause,
          include: [
            { model: User, as: 'driver' },
            { model: User, as: 'passenger' }
          ]
        });
        const normalRidesWithType = normalRides.map(ride => ({
          ...ride.toJSON(),
          type: 'NormalRide',
        }));
        // Filter condition for Share Rides
        let shareRideWhereClause = isDriver ? { driver_id: user.user_id } : { passenger_id: user.user_id };
        // Apply filter to Share Rides
        if (filter === 'history') {
          shareRideWhereClause[Op.or] = [
            { status: 'ride_canceled' },
            { status: 'ride_completed' },
            { status: 'rejected' }, // for ride sharing requests
            { status: 'completed' },
            { status: 'canceled' }
          ];
        } else if (filter === 'running') {
          shareRideWhereClause[Op.or] = [
            { status: 'pending' },
            { status: 'accepted' }, // for ride sharing requests
            { status: 'picked_up' }, // for ride sharing requests
            { status: 'dropped_off' }, // for ride sharing requests
            { status: 'active' },
            { status: 'ride_placed' },
            { status: 'ride_active' },
            { status: 'arrived' },
            { status: 'ride_in_progress' }
          ];
        }
        let shareRides;
        if (isDriver) {
          // Fetch Share Rides for driver
          shareRides = await RideSharing.findAll({
            where: shareRideWhereClause,
            include: [{ model: User, as: 'driver' }, { model: RideSharingRequest, as: 'RideSharingRequests', include: [{ model: User, as: 'passenger' }] }
            ]
          });
        } else {
          // Fetch Share Ride Requests for passenger
          shareRides = await RideSharingRequest.findAll({
            where: shareRideWhereClause,
            include: [
              {
                model: RideSharing,
                as: 'ride',
                include: [{ model: User, as: 'driver' }]
              },
              { model: User, as: 'passenger' }
            ]
          });
        }
        const shareRidesWithType = shareRides.map(rideRequest => ({
          ...rideRequest.toJSON(),
          type: isDriver ? 'ShareRide' : 'ShareRideRequest',
        }));
        // Combine both normal rides and share rides
        const uniqueCombinedRides = [...normalRidesWithType, ...pendingBidRides, ...shareRidesWithType];
        return uniqueCombinedRides;
      } catch (error) {
        console.error('Error fetching combined rides:', error);
        throw new Error('Error fetching combined rides');
      }
    }
  },
  Ride: {
    __resolveType(obj) {
      if (obj.type === 'NormalRide') {
        return 'NormalRide';
      }
      if (obj.type === 'ShareRide') {
        return 'ShareRide';
      }

      if (obj.type === 'ShareRideRequest') {
        return 'RideRequest';
      }

      return null;
    }
  }

}
module.exports = resolvers;





