const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GlobalSettings = sequelize.define('GlobalSettings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  commission: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  referral_commission: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  service_charge: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  approveNeed: { // New column
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'settings',
  timestamps: true,
});

module.exports = GlobalSettings;
