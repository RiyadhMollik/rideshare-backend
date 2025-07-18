const { DataTypes } = require("sequelize");
const sequelize = require('../config/database');

const Permission = sequelize.define("Permission", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  permission: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isGranted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Permission;