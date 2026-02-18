'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('option_quota_buckets', {
      quota_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      capacity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'option_capacity',
          key: 'capacity_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      bucket_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      bucket_value: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      quota_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ),
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

    await queryInterface.addIndex(
      'option_quota_buckets',
      ['capacity_id'],
      { name: 'idx_quota_capacity' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('option_quota_buckets');
  },
};
