'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'e.g., boys, girls, general - for quota buckets',
      },

      year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      section: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },

      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User rank for priority surveys',
      },

      score: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'User score for allocation engine',
      },

      attributes: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: Sequelize.literal('(JSON_OBJECT())'),
        comment: 'Extra indicators, tags, etc.',
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
