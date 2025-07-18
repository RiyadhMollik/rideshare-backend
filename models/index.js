const User = require('./user');
const sequelize = require('../config/database');
const RideSharing = require('../models/rideSharingModel');
const RideSharingRequest = require('../models/RideSharingRequestModel');
const RideRequestModel = require('./rideRequestModel');
const VehicleType = require('./vehicleType');
const Service = require('./service');
const serviceVehicle = require('./serviceVehicle');
const TopUpRequest = require('./topupRequest');
const Role = require('./Role');
// Define associations
// Define associations
// Service has many Vehicles

Service.hasMany(serviceVehicle, { foreignKey: 'serviceId', as: 'vehicles' });
// Vehicle belongs to Service
serviceVehicle.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
// Vehicle belongs to VehicleType
VehicleType.hasMany(serviceVehicle, { foreignKey: 'vehicleTypeId', as: 'vehicles' });
// VehicleType has many Vehicles
serviceVehicle.belongsTo(VehicleType, { foreignKey: 'vehicleTypeId', as: 'vehicleType' });




// User has many RideSharings (as driver)
User.hasMany(RideSharing, { foreignKey: 'driver_id', as: 'rides' });

// RideSharing belongs to User (as driver)
RideSharing.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

// RideSharing has many RideSharingRequests
RideSharing.hasMany(RideSharingRequest, {
  foreignKey: 'ride_sharing_id',
  as: 'RideSharingRequests' // Add alias here
});

RideSharingRequest.belongsTo(User, {
  foreignKey: 'passenger_id',
  as: 'passenger'
});

RideSharingRequest.belongsTo(RideSharing, {
  foreignKey: 'ride_sharing_id',
  as: 'ride'
});

// User has many RideSharingRequests (as passenger)
User.hasMany(RideSharingRequest, { foreignKey: 'passenger_id', as: 'rideRequests' });

User.hasMany(RideRequestModel, { foreignKey: 'user_id',  });
User.hasMany(RideRequestModel, { foreignKey: 'driver_id', });
RideRequestModel.belongsTo(User, { foreignKey: 'user_id', as: 'passenger' });
RideRequestModel.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });
User.hasMany(RideRequestModel, { foreignKey: 'driver_id', as: 'driver' });
User.hasMany(RideRequestModel, { foreignKey: 'user_id', as: 'passenger' });
TopUpRequest.belongsTo(User, { foreignKey: 'user_id' }); // Each top-up request belongs to a user
User.hasMany(TopUpRequest, { foreignKey: 'user_id' }); // A user can have many top-up requests
User.belongsTo(Role, { foreignKey: 'roleId', as: 'Role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'Users' });


// Export models for usage in the app
module.exports = {
  User,
  RideSharing,
  RideSharingRequest,
  RideRequestModel,
  VehicleType,
  Service,
  serviceVehicle,
  TopUpRequest
};