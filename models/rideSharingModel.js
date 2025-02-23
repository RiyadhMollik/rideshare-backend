const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Import User model for association

const RideSharing = sequelize.define('RideSharing', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // Link to the User model
      key: 'user_id',
    },
  },
  vehicle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicle_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  available_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  per_seat_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  pickup_point: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  destination_point: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  polyline: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: "Stores the list of coordinates for the ride's path",
  },
  ride_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'canceled'),
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'RideSharing',
});

// Define associations
RideSharing.belongsTo(User, { foreignKey: 'driver_id', as: 'Driver' });
User.hasMany(RideSharing, { foreignKey: 'driver_id', as: 'Rides' });

module.exports = RideSharing;
