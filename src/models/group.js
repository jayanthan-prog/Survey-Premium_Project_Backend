'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const Group = sequelize.define('Group', {
  group_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true, // matches your DB
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'groups',
  timestamps: false,
});

module.exports = Group;
