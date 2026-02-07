const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enum = sequelize.define('Enum', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true, // ✅ Mark as primary key
  },
  value: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
}, {
  tableName: 'enums',
  timestamps: false,
  // no id column is present
  // Sequelize will now use `name` as PK instead of expecting `id`
});

module.exports = Enum;
