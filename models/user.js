const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('users', {
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
  },
  phone_number: {
    type: DataTypes.STRING,
    unique: true,
  },
  password_hash: DataTypes.STRING,
  name: DataTypes.STRING,
  profile_picture: DataTypes.STRING,
  address: DataTypes.TEXT,
  nid_photo: DataTypes.STRING,
  user_type: {
    type: DataTypes.ENUM('normal', 'driver', 'admin'),
    defaultValue: 'normal',
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  push_token: DataTypes.STRING,
  referral_code: DataTypes.STRING,
  referred_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  wallet_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    defaultValue: 'Male',
  },
  otp: DataTypes.STRING,
  otp_expires_at: DataTypes.DATE,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
}, {
  timestamps: false,
  tableName: 'users',
});

module.exports = User;
