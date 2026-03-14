'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('slot_quota_buckets', {
      slot_quota_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      slot_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'calendar_slots',
          key: 'calendar_slot_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      bucket_key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'e.g., gender, year',
      },

      bucket_value: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'e.g., boys, girls, 1, 2, 3',
      },

      quota_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Max bookings for this bucket',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('slot_quota_buckets', ['slot_id', 'bucket_key', 'bucket_value'], { 
      unique: true, 
      name: 'uq_slot_quota_bucket' 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('slot_quota_buckets');
  },
};
