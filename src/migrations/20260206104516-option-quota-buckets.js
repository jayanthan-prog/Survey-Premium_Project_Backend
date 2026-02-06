'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('option_quota_buckets', {
      quota_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      capacity_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'option_capacity',
          key: 'capacity_id',
        },
        onDelete: 'CASCADE',
      },

      bucket_key: {
        type: Sequelize.STRING(100),
      },

      bucket_value: {
        type: Sequelize.STRING(100),
      },

      quota_limit: Sequelize.INTEGER,

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addConstraint('option_quota_buckets', {
      fields: ['capacity_id', 'bucket_key', 'bucket_value'],
      type: 'unique',
      name: 'uniq_quota_bucket',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('option_quota_buckets');
  },
};
