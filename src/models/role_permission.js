'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  permission_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'role_permissions',
  timestamps: false,
  primaryKey: ['role_id', 'permission_id'],
});

RolePermission.associate = (models) => {
  if (models && models.Role) RolePermission.belongsTo(models.Role, { foreignKey: 'role_id' });
  if (models && models.Permission) RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id' });
};

module.exports = RolePermission;
