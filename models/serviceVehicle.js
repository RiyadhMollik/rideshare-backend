// serviceVehicle model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const serviceVehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  vehicleTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicle_types',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleTypeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  extraOptions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  perKm: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  outsideCity: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  labourAvailable: {
    type: DataTypes.BOOLEAN,
    allowNull:true,
    defaultValue:false
  },
  commissionType: {
    type: DataTypes.ENUM('percentage', 'amount'),
    allowNull: false,
    defaultValue: 'amount',
  },
  commission: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'service_vehicles',
  timestamps: false,
});

module.exports = serviceVehicle;
