// Used for defining the VehicleType model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VehicleType = sequelize.define('VehicleType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  extraOptions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'vehicle_types',
  timestamps: false,
});

module.exports = VehicleType;

