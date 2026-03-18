'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Convert known user reference columns from UUID to BIGINT when they exist.
    const conversions = [
      { table: 'surveys', column: 'created_by', allowNull: true, onDelete: 'SET NULL' },
      { table: 'survey_releases', column: 'created_by', allowNull: true, onDelete: 'SET NULL' },
      { table: 'group_members', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'survey_participation', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'survey_sessions', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'survey_answers', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'user_roles', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'auth_tokens', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'audit_logs', column: 'user_id', allowNull: true, onDelete: 'SET NULL' },
      { table: 'approval_items', column: 'user_id', allowNull: true, onDelete: 'SET NULL' },
      { table: 'approval_actions', column: 'acted_by_user_id', allowNull: true, onDelete: 'SET NULL' },
      { table: 'relay_instances', column: 'created_by_user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'relay_stage_actions', column: 'acted_by_user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'slot_bookings', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'action_plans', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'audit_events', column: 'actor_user_id', allowNull: true, onDelete: 'SET NULL' },
      { table: 'documents', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'auth_challenges', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'option_holds', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'option_waitlist', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
      { table: 'action_plan_schedule', column: 'user_id', allowNull: false, onDelete: 'CASCADE' },
    ];

    for (const item of conversions) {
      let tableInfo;

      try {
        tableInfo = await queryInterface.describeTable(item.table);
      } catch (error) {
        console.warn(`[migration:convert-all-user-id-to-bigint] skipping missing table ${item.table}`);
        continue;
      }

      if (!Object.prototype.hasOwnProperty.call(tableInfo, item.column)) {
        console.warn(`[migration:convert-all-user-id-to-bigint] skipping missing column ${item.table}.${item.column}`);
        continue;
      }

      await queryInterface.changeColumn(item.table, item.column, {
        type: Sequelize.BIGINT,
        allowNull: item.allowNull,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: item.onDelete,
        onUpdate: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // This would require converting back to UUID, which is complex
    console.log('Rollback not supported - would require manual table recreation');
  },
};
