'use strict';

const Sequelize = require('sequelize');
require('dotenv').config();

// Use the shared Sequelize instance from config/database so all models share the same connection
const sequelize = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Robust model loader: supports both factory exports (module.exports = (sequelize, DataTypes) => {})
// and class-style models that initialize themselves (module.exports = class ... with init called inside file).
const loadModel = (propName, filePath) => {
  const mod = require(filePath);
  let model;

  // If the module already exports an initialized Sequelize model
  if (mod && typeof mod === 'object' && mod.tableName && mod.sequelize) {
    model = mod;
  } else if (typeof mod === 'function') {
    // detect ES class vs plain factory function
    const fnStr = Function.prototype.toString.call(mod);
    const isClass = /^class\s/.test(fnStr);

    if (isClass) {
      // ES class that likely used Model.init internally -> use it directly
      model = mod;
    } else {
      // factory function: initialize with the shared sequelize instance
      model = mod(sequelize, Sequelize.DataTypes);
    }
  } else {
    model = mod;
  }

  db[propName] = model;
};

loadModel('Survey', './survey');
loadModel('User', './users');
loadModel('SurveyRelease', './survey_release');
loadModel('SurveyQuestion', './survey_question');
loadModel('SurveyQuestionOption', './survey_question_option');
loadModel('UserRole', './user_role');
// additional commonly used models
loadModel('AuditLog', './audit_log');
loadModel('CalendarSlot', './calendar_slot');
loadModel('ActionPlan', './action_plan');
loadModel('ActionPlanItem', './action_plan_item');
// Additional models discovered in migrations
loadModel('ApprovalAction', './approval_action');
loadModel('ApprovalItem', './approval_item');
loadModel('ApprovalStep', './approval_step');
loadModel('ApprovalWorkflow', './approval_workflow');
loadModel('AuditEvent', './audit_event');
loadModel('AuthToken', './auth_token');
loadModel('Enum', './enum');
loadModel('Group', './group');
loadModel('GroupMember', './group_member');
loadModel('OptionCapacity', './option_capacity');
loadModel('OptionQuotaBucket', './option_quota_bucket');
loadModel('Permission', './permission');
loadModel('RelayInstance', './relay_instance');
loadModel('RelayStage', './relay_stage');
loadModel('RelayStageAction', './relay_stage_action');
loadModel('RelayWorkflow', './relay_workflow');
loadModel('Role', './role');
loadModel('RolePermission', './role_permission');
loadModel('SlotBooking', './slot_booking');
loadModel('SurveyAnswer', './survey_answer');
loadModel('SurveyAnswerSelection', './survey_answer_selection');
loadModel('SurveyOptions', './survey_options');
loadModel('SurveyParticipant', './survey_participant');
loadModel('SurveyReleaseAudience', './survey_release_audience');
loadModel('SurveySession', './survey_session');

// ✅ RUN ASSOCIATIONS *AFTER* ALL MODELS ARE LOADED
Object.values(db).forEach(model => {
  if (model && model.associate) {
    model.associate(db);
  }
});

module.exports = db;
