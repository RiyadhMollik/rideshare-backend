//rideSchema.js
const { gql } = require('graphql-tag');
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json');

// Define the schema
const typeDefs = gql`
  scalar JSON
  scalar JSONObject
  scalar DateTime

  type ShareRide {
    id: Int
    type: String 
    vehicle: String
    vehicle_number: String
    available_seats: Int
    total_seats: Int
    per_seat_price: Float
    pickup_point: JSON
    destination_point: JSON
    polyline: JSON
    ride_time: DateTime
    status: String
    driver: User
    RideSharingRequests: [RideRequest]
  }

  type RideRequest {
    id: Int
    type: String 
    passenger: User
    requested_seats: Int
    pickup_point: JSON
    destination_point: JSON
    note: String
    status: String
    fare: Float
    ride: ShareRide  # Add this field to the schema
  }
  type Bid {
    rideRequestId: Int
    riderId: Int
    bidAmount: Float
    profilePic: String
    rating: Float
    name: String
    vehicle: String
    vehicleNumber: String
    number: String
    fcmToken: String
  }

 type NormalRide {
    id: Int
    type: String 
    passenger: User
    service_id: String
    vehicle_type: String
    pickup_point: JSON
    destination: JSON
    pickup_place: String
    destination_place: String
    fare: Float
    status: String
    driver: User
    driver_id: Int
    driver_name: String
    driver_pic: String
    driver_number: String
    user_id: Int
    user_name: String
    user_pic: String
    user_rating: Float
    user_number: String
    vehicle: String
    vehicle_number: String
    driver_rating: Float
    time: DateTime
    otp: Int
    bids: [Bid] 
  }
  type User {
    user_id: Int
    name: String
    profile_picture: String
    rating: Float
  }
   # Define a union type that can represent either a NormalRide or ShareRide
union Ride = NormalRide | ShareRide | RideRequest

 type Query {
  getDriverRides: [ShareRide]
  getPassengerRideRequests: [RideRequest] # Add a new query for passenger ride requests
  getNormalRides(isDriver: Boolean!): [NormalRide]
  getCombinedRides(isDriver: Boolean!, filter:String): [Ride] # Add a new query for combined rides
}
`;

module.exports = typeDefs;
