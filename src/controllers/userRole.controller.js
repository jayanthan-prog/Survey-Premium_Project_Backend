const { Role, UserRole } = require("../models");

async function findRoleRecord(roleName) {
  const normalized = String(roleName || "").trim().toUpperCase();
  if (!normalized) return null;

  return Role.findOne({
    where: { name: normalized },
  });
}

async function ensureRoleRecord(roleName) {
  const normalized = String(roleName || "").trim().toUpperCase();
  if (!normalized) return null;

  let role = await findRoleRecord(normalized);
  if (role) return role;

  const [rows] = await Role.sequelize.query(
    "SELECT COALESCE(MAX(role_id), 0) + 1 AS nextRoleId FROM roles"
  );
  const nextRoleId = Number(rows && rows[0] ? rows[0].nextRoleId : 1);

  await Role.sequelize.query(
    `INSERT INTO roles (role_id, name, description, created_at, updated_at)
     VALUES (:roleId, :name, :description, NOW(), NOW())`,
    {
      replacements: {
        roleId: nextRoleId,
        name: normalized,
        description: `${normalized} access role`,
      },
    }
  );

  role = await findRoleRecord(normalized);
  return role;
}

async function resolveRoleRecord(roleName) {
  return ensureRoleRecord(roleName);
}

module.exports = {
  // Assign role to user
  async assignRole(req, res) {
    try {
      const { user_id, role } = req.body;

      const roleRecord = await resolveRoleRecord(role);
      if (!roleRecord) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      const userRole = await UserRole.create({
        user_id,
        role_id: roleRecord.role_id,
      });

      return res.status(201).json({
        success: true,
        message: "Role assigned successfully",
        data: {
          user_id: userRole.user_id,
          role_id: userRole.role_id,
          role: roleRecord.name,
          assigned_at: userRole.assigned_at,
        },
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
        include: [{ model: Role, attributes: ["role_id", "name"] }],
      });

      return res.json({
        success: true,
        data: roles.map((item) => ({
          user_id: item.user_id,
          role_id: item.role_id,
          role: item.Role?.name || null,
          assigned_at: item.assigned_at,
        })),
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

      const roleRecord = await resolveRoleRecord(role);
      if (!roleRecord) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      const deleted = await UserRole.destroy({
        where: { user_id, role_id: roleRecord.role_id },
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
