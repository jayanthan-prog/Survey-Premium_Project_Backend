'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // must be Sequelize instance

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true, validate: { isEmail: true } },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = User;
