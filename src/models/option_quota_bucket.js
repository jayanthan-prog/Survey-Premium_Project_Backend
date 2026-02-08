'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OptionQuotaBucket = sequelize.define(
  'OptionQuotaBucket',
  {
    quota_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    capacity_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    bucket_key: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bucket_value: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    quota_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'option_quota_buckets',
    timestamps: false,
  }
);

OptionQuotaBucket.associate = (models) => {
  if (models && models.OptionCapacity) {
    OptionQuotaBucket.belongsTo(models.OptionCapacity, { foreignKey: 'capacity_id' });
  }
};

module.exports = OptionQuotaBucket;
