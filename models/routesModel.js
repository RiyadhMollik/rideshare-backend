const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  credentials: {
    type: DataTypes.STRING, 
    allowNull: false,
  },
  bus_stops: {
    type: DataTypes.JSON, 
    allowNull: false,
  },
  polyline:{
    type:DataTypes.TEXT,
    allowNull:false
  }
}, {
  tableName: 'routes',
  timestamps: false,
});

module.exports = Route;
