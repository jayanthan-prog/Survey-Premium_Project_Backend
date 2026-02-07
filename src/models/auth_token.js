'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthToken = sequelize.define('AuthToken', {
  auth_token_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  token_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'auth_tokens',
  timestamps: false,
});

module.exports = AuthToken;
