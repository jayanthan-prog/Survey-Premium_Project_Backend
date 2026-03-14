'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration converts all user_id columns from UUID to BIGINT
    
    // 1. surveys table - created_by (already exists)
    await queryInterface.changeColumn('surveys', 'created_by', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 2. survey_releases table - created_by
    await queryInterface.changeColumn('survey_releases', 'created_by', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 3. group_members table - user_id
    await queryInterface.changeColumn('group_members', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 4. survey_participation table - user_id
    await queryInterface.changeColumn('survey_participation', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 5. survey_sessions table - user_id
    await queryInterface.changeColumn('survey_sessions', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 6. survey_answers table - user_id
    await queryInterface.changeColumn('survey_answers', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 7. role_permissions table - user_id
    await queryInterface.changeColumn('role_permissions', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 8. user_roles table - user_id
    await queryInterface.changeColumn('user_roles', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 9. auth_tokens table - user_id
    await queryInterface.changeColumn('auth_tokens', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 10. audit_logs table - user_id
    await queryInterface.changeColumn('audit_logs', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 11. approval_items table - user_id
    await queryInterface.changeColumn('approval_items', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 12. approval_actions table - acted_by_user_id
    await queryInterface.changeColumn('approval_actions', 'acted_by_user_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 13. relay_instances table - created_by_user_id
    await queryInterface.changeColumn('relay_instances', 'created_by_user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 14. relay_stage_actions table - acted_by_user_id
    await queryInterface.changeColumn('relay_stage_actions', 'acted_by_user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 15. slot_bookings table - user_id
    await queryInterface.changeColumn('slot_bookings', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 16. action_plans table - user_id
    await queryInterface.changeColumn('action_plans', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 17. audit_events table - actor_user_id
    await queryInterface.changeColumn('audit_events', 'actor_user_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 18. documents table - user_id
    await queryInterface.changeColumn('documents', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 19. auth_challenges table - user_id
    await queryInterface.changeColumn('auth_challenges', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 20. option_holds table - user_id
    await queryInterface.changeColumn('option_holds', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 21. option_waitlist table - user_id
    await queryInterface.changeColumn('option_waitlist', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 22. action_plan_schedule table - user_id
    await queryInterface.changeColumn('action_plan_schedule', 'user_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // This would require converting back to UUID, which is complex
    console.log('Rollback not supported - would require manual table recreation');
  },
};
