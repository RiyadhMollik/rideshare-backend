const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as necessary

class DriverVehicle extends Model {}

DriverVehicle.init({
  driverId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleTypeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleTypeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  extraOptions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  vehicleDetails: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'blocked'),
    defaultValue: 'pending',
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'DriverVehicle',
  tableName: 'driver_vehicles',
  timestamps: false,
});

module.exports = DriverVehicle;
