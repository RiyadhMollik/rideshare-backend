const express = require("express");
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissionsByRole,
  updatePermissions,
  syncAllRolePermissions,
  getUserPermissionsMapped
} = require("../controllers/roleController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getRoles); // Fetch all roles
router.post("/", createRole); // Create a new role
router.put("/:id", updateRole); // Update an existing role
router.delete("/:id", deleteRole); // Delete a role
router.get("/roles/:roleId/permissions", getPermissionsByRole);
router.put("/roles/:roleId/permissions", updatePermissions);
router.post("/sync-role-permissions", syncAllRolePermissions);
router.get("/user-permissions",authenticateToken, getUserPermissionsMapped);

module.exports = router;