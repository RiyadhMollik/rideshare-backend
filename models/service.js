// service model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
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
  type: { type: DataTypes.STRING, allowNull: false }, // type of service
  description: { type: DataTypes.STRING, allowNull: true },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }, created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
}
}, {
  timestamps: false,
  tableName: 'services',
});

module.exports = Service;
