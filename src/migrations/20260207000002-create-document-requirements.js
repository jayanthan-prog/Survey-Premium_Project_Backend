'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_requirements', {
      doc_req_id: {
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
        allowNull: true,
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'If null, applies to entire survey; if set, applies to specific option',
      },

      tag: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'e.g., resume, id_proof',
      },

      min_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      allowed_types: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: ['pdf', 'jpg', 'jpeg', 'png'],
        comment: 'Array of allowed file extensions',
      },

      max_size_mb: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },

      verification_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Does this document need manual verification?',
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

    await queryInterface.addIndex('document_requirements', ['release_id'], { name: 'idx_doc_req_release' });
    await queryInterface.addIndex('document_requirements', ['option_id'], { name: 'idx_doc_req_option' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('document_requirements');
  },
};
