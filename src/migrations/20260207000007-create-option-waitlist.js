'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('option_waitlist', {
      waitlist_id: {
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
      },

      bucket_value: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      priority_score: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'For ranked waiting - higher = better',
      },

      status: {
        type: Sequelize.ENUM('ACTIVE', 'PROMOTED', 'REMOVED'),
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

    await queryInterface.addIndex('option_waitlist', ['release_id', 'option_id', 'status', 'created_at'], { name: 'idx_waitlist_release_option_status' });
    
    // One waitlist entry per user per option
    await queryInterface.addConstraint('option_waitlist', {
      fields: ['release_id', 'option_id', 'user_id'],
      type: 'unique',
      name: 'uq_waitlist_user_option',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('option_waitlist');
  },
};
