'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  role_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  permission_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
}, {
  tableName: 'role_permissions',
  timestamps: false,
});

RolePermission.associate = (models) => {
  if (models && models.Role) RolePermission.belongsTo(models.Role, { foreignKey: 'role_id' });
  if (models && models.Permission) RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id' });
};

module.exports = RolePermission;
