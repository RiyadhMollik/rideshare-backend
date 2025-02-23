// This file defines the Rating model and its associations with the User model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/user'); // Make sure this path is correct

const Rating = sequelize.define('Rating', {
  rating_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ride_request_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  from_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  to_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'Ratings'
});

// Define associations
User.hasMany(Rating, { foreignKey: 'from_user_id', as: 'givenRatings' });
User.hasMany(Rating, { foreignKey: 'to_user_id', as: 'receivedRatings' });
Rating.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });
Rating.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

module.exports = Rating;
