'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      document_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      participation_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'survey_participation',
          key: 'participation_id',
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

      tag: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'e.g., resume, id_proof, income_certificate',
      },

      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      file_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME type',
      },

      file_size_bytes: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      storage_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Path/key in S3/local storage',
      },

      checksum: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'SHA-256 hash for integrity',
      },

      status: {
        type: Sequelize.ENUM('UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REUPLOAD_REQUIRED'),
        allowNull: false,
        defaultValue: 'UPLOADED',
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

    await queryInterface.addIndex('documents', ['participation_id'], { name: 'idx_documents_participation' });
    await queryInterface.addIndex('documents', ['user_id', 'tag'], { name: 'idx_documents_user_tag' });
    await queryInterface.addIndex('documents', ['status'], { name: 'idx_documents_status' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('documents');
  },
};
