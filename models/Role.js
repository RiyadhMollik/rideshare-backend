const { DataTypes } = require("sequelize");
const sequelize = require('../config/database');
const Permission = require("./Permission");

const Role = sequelize.define("Role", {
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