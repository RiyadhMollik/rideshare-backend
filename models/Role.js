const { DataTypes } = require("sequelize");
const sequelize = require('../config/database');
const Permission = require("./Permission");

const Role = sequelize.define("role", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// After creating a new role, set default permissions to false
Role.afterCreate(async (role) => {
  const defaultPermissions = [
    "Roles",
    "Permissions",
    "Add Service",
    "Service List",
    "Create Admin User",
    "Add Vehicle Type",
    "Vehicle Type List",
    "Add Vehicle To Service",
    "Vehicle To Service List",
    "Users",
    "All Driver Vehicle",
    "Ride Request",
    "Topup Request",
    "Messege",
    "Global Setting",
    "Profile"
  ];

  await Promise.all(
    defaultPermissions.map((permissionName) =>
      Permission.create({
        roleId: role.id,
        permission: permissionName,
        isGranted: false, // All permissions default to false
      })
    )
  );
});

module.exports = Role;