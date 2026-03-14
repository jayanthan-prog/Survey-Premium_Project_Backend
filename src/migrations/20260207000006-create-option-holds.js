'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('option_holds', {
      hold_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      release_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'survey_releases',
          key: 'release_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      option_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      bucket_key: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'e.g., gender',
      },

      bucket_value: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'e.g., boys, girls',
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When this hold expires if not consumed',
      },

      status: {
        type: Sequelize.ENUM('ACTIVE', 'CONSUMED', 'EXPIRED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('option_holds', ['release_id', 'option_id', 'status'], { name: 'idx_holds_release_option_status' });
    await queryInterface.addIndex('option_holds', ['user_id', 'status'], { name: 'idx_holds_user_status' });
    await queryInterface.addIndex('option_holds', ['expires_at'], { name: 'idx_holds_expires' });

    // Prevent duplicate active holds for same user/option
    await queryInterface.addConstraint('option_holds', {
      fields: ['release_id', 'option_id', 'user_id', 'status'],
      type: 'unique',
      name: 'uq_holds_active',
      where: {
        status: 'ACTIVE',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('option_holds');
  },
};
