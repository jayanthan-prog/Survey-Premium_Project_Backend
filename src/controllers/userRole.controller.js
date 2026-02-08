const { UserRole } = require("../models");

module.exports = {
  // Assign role to user
  async assignRole(req, res) {
    try {
      const { user_id, role } = req.body;

      const userRole = await UserRole.create({
        user_id,
        role,
      });

      return res.status(201).json({
        success: true,
        message: "Role assigned successfully",
        data: userRole,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          success: false,
          message: "User already has this role",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to assign role",
        error: error.message,
      });
    }
  },

  // Get roles by user
  async getUserRoles(req, res) {
    try {
      const { user_id } = req.params;

      const roles = await UserRole.findAll({
        where: { user_id },
      });

      return res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all user-role assignments
  async getAllRoles(req, res) {
    try {
      const { UserRole } = require('../models');
      const roles = await UserRole.findAll();
      return res.json({ success: true, data: roles });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Remove role
  async removeRole(req, res) {
    try {
      const { user_id, role } = req.body;

      const deleted = await UserRole.destroy({
        where: { user_id, role },
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      return res.json({
        success: true,
        message: "Role removed successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
