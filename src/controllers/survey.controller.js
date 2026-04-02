const db = require('../models');
const { sendSurveyDeadlineReminder, sendSurveyCreationNotification } = require('../utils/surveyNotificationService');
const { hasManageAccess, isApproverScoped, canAccessSurvey } = require('../utils/ownershipScope');

function hasManagePermission(req) {
  return hasManageAccess(req);
}

function isStudentRole(req) {
  const roles = Array.isArray(req.userRoles) ? req.userRoles : [];
  return roles.includes('USER') || roles.includes('STUDENT');
}

async function ensureSurveyManageAccess(req, surveyId, res, transaction) {
  if (!hasManagePermission(req)) {
    if (transaction) await transaction.rollback();
    res.status(403).json({ error: 'Only admin or approver can manage surveys' });
    return false;
  }

  if (isApproverScoped(req)) {
    const allowed = await canAccessSurvey(req, db, surveyId, transaction);
    if (!allowed) {
      if (transaction) await transaction.rollback();
      res.status(403).json({ error: 'Approvers can only access surveys they created' });
      return false;
    }
  }

  return true;
}

function toDbDateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseJsonSafe(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (_err) {
    return fallback;
  }
}

function normalizeMailDraft(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    subject: String(source.subject || ''),
    body: String(source.body || ''),
  };
}

function normalizeChoiceLabel(value, fallback = '') {
  const label = String(value == null ? fallback : value).trim();
  return label || String(fallback || 'Option').trim() || 'Option';
}

function toChoiceValue(label, fallbackIndex = 0) {
  const text = String(label || '').trim();
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || `option_${fallbackIndex + 1}`;
}

function parseMetaObject(value, fallback = {}) {
  if (!value) return { ...fallback };
  if (typeof value === 'object') return { ...fallback, ...value };

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : { ...fallback };
  } catch (_err) {
    return { ...fallback };
  }
}

function normalizeChoiceOption(rawOption, index = 0) {
  if (rawOption == null) {
    return {
      label: `Option ${index + 1}`,
      value: `option_${index + 1}`,
      limit: null,
      selectedCount: 0,
    };
  }

  if (typeof rawOption === 'string' || typeof rawOption === 'number') {
    const label = normalizeChoiceLabel(rawOption, `Option ${index + 1}`);
    return {
      label,
      value: toChoiceValue(label, index),
      limit: null,
      selectedCount: 0,
    };
  }

  const meta = parseMetaObject(rawOption.meta, {});
  const label = normalizeChoiceLabel(rawOption.label || rawOption.text || rawOption.option_text || rawOption.value, `Option ${index + 1}`);
  const value = normalizeChoiceLabel(rawOption.value || rawOption.option_value || label, label) || toChoiceValue(label, index);
  const limitSource = rawOption.limit ?? rawOption.seatLimit ?? meta.limit ?? meta.seatLimit;
  const selectedCountSource = rawOption.selectedCount ?? rawOption.selected_count ?? meta.selectedCount ?? meta.selected_count;

  return {
    id: rawOption.id != null ? String(rawOption.id) : rawOption.question_option_id != null ? String(rawOption.question_option_id) : undefined,
    label,
    value,
    limit: limitSource == null || limitSource === '' ? null : Math.max(0, Number(limitSource) || 0),
    selectedCount: Math.max(0, Number(selectedCountSource) || 0),
    meta,
  };
}

function isChoiceQuestionType(questionType, config = {}) {
  const normalized = String(questionType || config.answerType || '').toLowerCase();
  return ['single_choice', 'multiple_choice', 'dropdown', 'limited_dropdown', 'priority_select', 'multi_level_selection'].includes(normalized);
}

function normalizeSelectionRules(value, fallback = {}) {
  let source = value && typeof value === 'object' ? value : {};

  // Allow builder to send rules as an array: [{ key/type, value, message }]
  if (Array.isArray(value)) {
    const reduced = {};
    for (const entry of value) {
      const key = String(entry?.key ?? entry?.type ?? '').trim();
      if (!key) continue;
      reduced[key] = entry?.value;
    }
    source = reduced;
  }

  return {
    maxPrimary: Math.max(0, Number(source.maxPrimary ?? fallback.maxPrimary) || 0),
    maxSecondary: Math.max(0, Number(source.maxSecondary ?? fallback.maxSecondary) || 0),
    maxSpecial: Math.max(0, Number(source.maxSpecial ?? fallback.maxSpecial) || 0),
    preventDuplicate: source.preventDuplicate == null ? Boolean(fallback.preventDuplicate) : Boolean(source.preventDuplicate),
  };
}

function normalizeValidation(value) {
  if (!value || typeof value !== 'object') return {};

  const minLengthSource = value.minLength;
  const maxLengthSource = value.maxLength;
  const minLength = minLengthSource === '' || minLengthSource == null ? null : Math.max(0, Number(minLengthSource) || 0);
  const maxLength = maxLengthSource === '' || maxLengthSource == null ? null : Math.max(0, Number(maxLengthSource) || 0);

  return {
    minLength,
    maxLength,
    regex: typeof value.regex === 'string' ? value.regex : '',
    email: Boolean(value.email),
  };
}

function extractSelectionValues(questionType, answerValue) {
  const normalized = String(questionType || '').toLowerCase();
  if (normalized === 'priority_select') {
    return Array.isArray(answerValue) ? answerValue.map((value) => String(value)).filter(Boolean) : [];
  }
  if (normalized === 'multi_level_selection') {
    if (!answerValue || typeof answerValue !== 'object') return [];
    return [
      ...((Array.isArray(answerValue.primary) ? answerValue.primary : [answerValue.primary]).filter(Boolean)),
      ...((Array.isArray(answerValue.secondary) ? answerValue.secondary : [answerValue.secondary]).filter(Boolean)),
      ...((Array.isArray(answerValue.special) ? answerValue.special : [answerValue.special]).filter(Boolean)),
    ].map((value) => String(value)).filter(Boolean);
  }
  if (normalized === 'multiple_choice') {
    return Array.isArray(answerValue) ? answerValue.map((value) => String(value)).filter(Boolean) : [];
  }
  if (normalized === 'single_choice' || normalized === 'dropdown' || normalized === 'limited_dropdown') {
    return answerValue == null || answerValue === '' ? [] : [String(answerValue)];
  }
  return [];
}

function optionKey(option) {
  return String(option?.value || option?.option_text || option?.label || '').trim().toLowerCase();
}

function findMatchingOption(questionOptions, selectedValue) {
  const normalized = String(selectedValue || '').trim().toLowerCase();
  return (questionOptions || []).find((option) => optionKey(option) === normalized);
}

function normalizeResponseCategoryLimits(input) {
  const items = Array.isArray(input) ? input : [];
  const allowedFields = new Set(['year', 'category', 'department', 'section', 'attributes.gender']);

  return items
    .map((entry) => {
      const field = String(entry?.field || '').trim();
      const value = entry?.value == null ? '' : String(entry.value).trim();
      const limit = Math.max(0, Number(entry?.limit) || 0);
      const label = String(entry?.label || `${field}:${value}`).trim();

      if (!allowedFields.has(field) || !value || !limit) return null;
      return { field, value, limit, label };
    })
    .filter(Boolean);
}

function normalizeComparable(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function normalizeSurveyPagesForConfig(pages) {
  const safePages = Array.isArray(pages) ? pages : [];

  return safePages
    .map((page, index) => {
      const questions = Array.isArray(page?.questions) ? page.questions : [];
      return {
        id: page?.id != null ? String(page.id) : `page-${index + 1}`,
        title: String(page?.title || `Page ${index + 1}`),
        collapsed: Boolean(page?.collapsed),
        questions: questions.map((question) => {
          if (!question || typeof question !== 'object') return question;
          return {
            id: question.id,
            text: question.text,
            description: question.description,
            type: question.type,
            required: question.required,
            randomizeOptions: question.randomizeOptions,
            options: Array.isArray(question.options)
              ? question.options.map((opt) => ({
                id: opt?.id,
                label: opt?.label,
                value: opt?.value,
                limit: opt?.limit ?? null,
                selectedCount: opt?.selectedCount ?? 0,
                meta: opt?.meta,
              }))
              : [],
            selectionRules: question.selectionRules,
            maxRank: question.maxRank,
            scaleMin: question.scaleMin,
            scaleMax: question.scaleMax,
            min: question.min,
            max: question.max,
            rows: question.rows,
            columns: question.columns,
            displayLogic: question.displayLogic,
            skipLogic: question.skipLogic,
            validation: question.validation,
          };
        }),
      };
    })
    .filter(Boolean);
}

function extractUserCategoryValue(user, field) {
  if (!user || !field) return '';
  if (field === 'attributes.gender') {
    const attributes = parseJsonSafe(user.attributes, {});
    return attributes && attributes.gender != null ? String(attributes.gender) : '';
  }
  if (Object.prototype.hasOwnProperty.call(user, field)) {
    return user[field] == null ? '' : String(user[field]);
  }
  return '';
}

function buildCategorySqlClause(field) {
  if (field === 'year') {
    return 'CAST(u.year AS CHAR) = :expectedValue';
  }
  if (field === 'category') {
    return 'LOWER(COALESCE(u.category, \"\")) = :expectedLower';
  }
  if (field === 'department') {
    return 'LOWER(COALESCE(u.department, \"\")) = :expectedLower';
  }
  if (field === 'section') {
    return 'LOWER(COALESCE(u.section, \"\")) = :expectedLower';
  }
  if (field === 'attributes.gender') {
    return 'LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.attributes, \"$.gender\")), \"\")) = :expectedLower';
  }
  return null;
}

async function findReachedCategoryQuota({ surveyId, userId, surveyConfig, transaction }) {
  const limits = normalizeResponseCategoryLimits(surveyConfig?.responseCategoryLimits || surveyConfig?.responseQuotas);
  if (!limits.length) return null;

  const [userRows] = await db.sequelize.query(
    'SELECT user_id, year, category, department, section, attributes FROM users WHERE user_id = :userId LIMIT 1',
    { replacements: { userId }, transaction }
  );
  const user = userRows && userRows[0] ? userRows[0] : null;
  if (!user) return null;

  for (const limit of limits) {
    const userValue = extractUserCategoryValue(user, limit.field);
    if (normalizeComparable(userValue) !== normalizeComparable(limit.value)) {
      continue;
    }

    const clause = buildCategorySqlClause(limit.field);
    if (!clause) continue;

    const [rows] = await db.sequelize.query(
      `SELECT COUNT(1) AS total
       FROM survey_participation sp
       INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
       INNER JOIN users u ON u.user_id = sp.user_id
       WHERE sr.survey_id = :surveyId
         AND sp.status = 'SUBMITTED'
         AND ${clause}`,
      {
        replacements: {
          surveyId,
          expectedValue: String(limit.value),
          expectedLower: normalizeComparable(limit.value),
        },
        transaction,
      }
    );

    const total = Number(rows && rows[0] ? rows[0].total : 0);
    if (total >= Number(limit.limit)) {
      return {
        ...limit,
        currentCount: total,
      };
    }
  }

  return null;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function mapQuestionType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');

  // DB enum for survey_questions.question_type supports only: SINGLE, MULTI, TEXT, SCALE.
  if (normalized === 'single_choice' || normalized === 'single') return 'SINGLE';
  if (normalized === 'multiple_choice' || normalized === 'multi') return 'MULTI';
  if (normalized === 'rating' || normalized === 'scale') return 'SCALE';

  // Keep all other specialized frontend types represented as TEXT + config.answerType.
  return 'TEXT';
}

function mapQuestionTypeToFrontend(value, questionConfig = {}) {
  const normalized = String(value || '').toUpperCase();
  const answerType = String(questionConfig?.answerType || '').toLowerCase();
  const passthroughTypes = new Set(['short_text', 'long_text', 'file_upload', 'single_choice', 'multiple_choice', 'rating', 'dropdown', 'date', 'number', 'matrix', 'limited_dropdown', 'priority_select', 'multi_level_selection']);

  if (passthroughTypes.has(answerType)) return answerType;
  if (normalized === 'SINGLE') return 'single_choice';
  if (normalized === 'MULTI') return 'multiple_choice';
  if (normalized === 'SCALE') return 'rating';
  if (normalized === 'MATRIX') return 'matrix';
  if (normalized === 'DROPDOWN') return 'dropdown';
  if (normalized === 'DATE') return 'date';
  if (normalized === 'NUMBER') return 'number';
  return 'short_text';
}

function normalizeDisplayLogic(value) {
  if (!value || typeof value !== 'object') {
    return {
      enabled: false,
      sourceQuestionId: '',
      operator: 'equals',
      expectedValue: '',
    };
  }

  const allowedOperators = new Set(['equals', 'not_equals', 'contains_any', 'answered', 'not_answered']);
  const operator = allowedOperators.has(String(value.operator || '').toLowerCase())
    ? String(value.operator).toLowerCase()
    : 'equals';

  return {
    enabled: Boolean(value.enabled),
    sourceQuestionId: value.sourceQuestionId == null ? '' : String(value.sourceQuestionId),
    operator,
    expectedValue: Array.isArray(value.expectedValue)
      ? value.expectedValue.map((entry) => String(entry)).filter(Boolean)
      : String(value.expectedValue || ''),
  };
}

function normalizeSkipLogic(value, clientToDbQuestionId = new Map()) {
  if (!value || typeof value !== 'object') {
    return {
      enabled: false,
      sourceQuestionId: '',
      operator: 'equals',
      expectedValue: '',
      action: 'jumpToPage',
      targetId: '',
    };
  }

  const allowedOperators = new Set(['equals', 'not_equals', 'contains_any', 'answered', 'not_answered']);
  const operator = allowedOperators.has(String(value.operator || '').toLowerCase())
    ? String(value.operator).toLowerCase()
    : 'equals';

  const action = ['jumpToPage', 'jumpToQuestion'].includes(String(value.action || ''))
    ? String(value.action)
    : 'jumpToPage';

  const sourceKey = String(value.sourceQuestionId || '').trim();
  const mappedSourceId = sourceKey ? clientToDbQuestionId.get(sourceKey) : null;
  const targetId = value.targetId ? String(value.targetId) : '';

  return {
    enabled: Boolean(value.enabled),
    sourceQuestionId: mappedSourceId ? String(mappedSourceId) : '',
    operator,
    expectedValue: Array.isArray(value.expectedValue)
      ? value.expectedValue.map((entry) => String(entry)).filter(Boolean)
      : String(value.expectedValue || ''),
    action,
    targetId,
  };
}

function parseAnswerValue(value) {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch (_err) {
    return trimmed;
  }
}

function answerValueToText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ');
  if (typeof value === 'object') {
    if (value.file_name) return String(value.file_name);
    return JSON.stringify(value);
  }
  return String(value);
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function getSurveyResponseSnapshot(surveyId, searchText = '') {
  const [surveyRows] = await db.sequelize.query(
    `SELECT s.*, u.name AS created_by_name
     FROM surveys s
     LEFT JOIN users u ON u.user_id = s.created_by
     WHERE s.survey_id = :surveyId
     LIMIT 1`,
    { replacements: { surveyId } }
  );
  const survey = surveyRows && surveyRows[0] ? surveyRows[0] : null;
  if (!survey) {
    return { survey: null, questions: [], responses: [] };
  }

  const [questionRows] = await db.sequelize.query(
    `SELECT question_id, question_type, question_text, sort_order, config
     FROM survey_questions
     WHERE survey_id = :surveyId
     ORDER BY sort_order ASC, question_id ASC`,
    { replacements: { surveyId } }
  );

  const questionIds = (questionRows || []).map((row) => Number(row.question_id));
  let optionRows = [];
  if (questionIds.length) {
    const [rows] = await db.sequelize.query(
      `SELECT question_option_id, question_id, option_text, value, sort_order, meta
       FROM survey_question_options
       WHERE question_id IN (:questionIds)
       ORDER BY sort_order ASC, question_option_id ASC`,
      { replacements: { questionIds } }
    );
    optionRows = rows || [];
  }

  const optionsByQuestion = new Map();
  for (const option of optionRows) {
    const key = Number(option.question_id);
    const existing = optionsByQuestion.get(key) || [];
    existing.push(option);
    optionsByQuestion.set(key, existing);
  }

  const questions = (questionRows || []).map((row) => {
    const cfg = parseJsonSafe(row.config, {});
    const qType = mapQuestionTypeToFrontend(row.question_type, cfg);
    const options = (optionsByQuestion.get(Number(row.question_id)) || []).map((option, index) => {
      const normalizedOption = normalizeChoiceOption(option, index);
      return {
        id: Number(option.question_option_id),
        label: normalizedOption.label,
        value: normalizedOption.value,
        limit: normalizedOption.limit,
        selectedCount: normalizedOption.selectedCount,
        sortOrder: Number(option.sort_order || 0),
      };
    });

    const question = {
      id: Number(row.question_id),
      text: row.question_text,
      type: qType,
      sortOrder: Number(row.sort_order || 0),
      options,
      selectionRules: normalizeSelectionRules(cfg.selectionRules, {
        maxPrimary: cfg.maxPrimary || (qType === 'priority_select' ? 3 : 0),
        maxSecondary: cfg.maxSecondary || (qType === 'multi_level_selection' ? 2 : 0),
        preventDuplicate: ['priority_select', 'multi_level_selection'].includes(qType),
      }),
      maxRank: Number(cfg.maxRank || (qType === 'priority_select' ? 3 : 0)) || 0,
      displayLogic: normalizeDisplayLogic(cfg.displayLogic),
      skipLogic: normalizeSkipLogic(cfg.skipLogic),
    };

    return question;
  });

  const [participationRows] = await db.sequelize.query(
    `SELECT
      sp.participation_id,
      sp.user_id,
      sp.status,
      sp.submitted_at,
      sp.meta,
      u.name AS respondent_name,
      u.email AS respondent_email
     FROM survey_participation sp
     INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
     LEFT JOIN users u ON u.user_id = sp.user_id
     WHERE sr.survey_id = :surveyId
     ORDER BY sp.submitted_at DESC, sp.created_at DESC`,
    { replacements: { surveyId } }
  );

  const search = String(searchText || '').trim().toLowerCase();
  const filteredParticipations = (participationRows || []).filter((row) => {
    if (!search) return true;
    return [row.respondent_name, row.respondent_email, row.status, row.participation_id]
      .map((entry) => String(entry || '').toLowerCase())
      .some((entry) => entry.includes(search));
  });

  const participationIds = filteredParticipations
    .map((row) => Number(row.participation_id))
    .filter((id) => Number.isInteger(id) && id > 0);

  let answerRows = [];
  if (participationIds.length) {
    const [rows] = await db.sequelize.query(
      `SELECT answer_id, participation_id, question_id, value_json
       FROM survey_answers
       WHERE participation_id IN (:participationIds)
       ORDER BY created_at ASC, answer_id ASC`,
      { replacements: { participationIds } }
    );
    answerRows = rows || [];
  }

  const answersByParticipation = new Map();
  for (const answer of answerRows) {
    const key = Number(answer.participation_id);
    const existing = answersByParticipation.get(key) || [];
    existing.push({
      answer_id: Number(answer.answer_id),
      question_id: Number(answer.question_id),
      value: parseAnswerValue(answer.value_json),
    });
    answersByParticipation.set(key, existing);
  }

  const responses = filteredParticipations.map((row) => {
    const participationId = Number(row.participation_id);
    const rawMeta = parseJsonSafe(row.meta, {});
    const groupAnswers = rawMeta && rawMeta.groupAnswers && typeof rawMeta.groupAnswers === 'object'
      ? rawMeta.groupAnswers
      : {};
    const answers = answersByParticipation.get(participationId) || [];
    const answerMap = {};
    for (const answer of answers) {
      answerMap[String(answer.question_id)] = answer.value;
    }

    return {
      participation_id: participationId,
      user_id: Number(row.user_id),
      status: row.status,
      submitted_at: row.submitted_at,
      respondent_name: row.respondent_name || 'Unknown User',
      respondent_email: row.respondent_email || '-',
      answers,
      answerMap,
      groupAnswers,
    };
  });

  return {
    survey,
    questions,
    responses,
  };
}

async function nextId(tableName, columnName, transaction) {
  const [rows] = await db.sequelize.query(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS nextValue FROM ${tableName} `,
    { transaction }
  );
  return Number(rows && rows[0] ? rows[0].nextValue : 1);
}

async function getActiveGroupIds(groupIds, transaction) {
  const normalized = Array.isArray(groupIds)
    ? groupIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
    : [];

  if (!normalized.length) {
    return [];
  }

  const [groupRows] = await db.sequelize.query(
    'SELECT group_id, attributes FROM `groups` WHERE group_id IN (:groupIds)',
    {
      replacements: { groupIds: normalized },
      transaction,
    }
  );

  const activeSet = new Set();
  for (const row of groupRows || []) {
    const attributes = parseJsonSafe(row.attributes, {});
    if (attributes.is_active !== false) {
      activeSet.add(Number(row.group_id));
    }
  }

  const inactiveRequested = normalized.filter((groupId) => !activeSet.has(groupId));
  if (inactiveRequested.length) {
    const error = new Error(`Inactive or unknown groups cannot be used: ${inactiveRequested.join(', ')} `);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

async function getActiveUserIds(userIds, transaction) {
  const normalized = Array.isArray(userIds)
    ? userIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
    : [];

  if (!normalized.length) {
    return [];
  }

  const [userRows] = await db.sequelize.query(
    'SELECT user_id FROM users WHERE user_id IN (:userIds) AND (is_active = 1 OR is_active IS NULL)',
    {
      replacements: { userIds: normalized },
      transaction,
    }
  );

  const activeSet = new Set((userRows || []).map((row) => Number(row.user_id)));
  const inactiveRequested = normalized.filter((userId) => !activeSet.has(userId));
  if (inactiveRequested.length) {
    const error = new Error(`Inactive or unknown users cannot be used: ${inactiveRequested.join(', ')} `);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

async function getSurveyList(req) {
  const studentView = isStudentRole(req) && !hasManagePermission(req);
  const whereClauses = [];
  const replacements = {};

  if (studentView) {
    whereClauses.push("s.status = 'PUBLISHED'");
  }

  if (isApproverScoped(req)) {
    whereClauses.push('s.created_by = :currentUserId');
    replacements.currentUserId = req.userId;
  }

  const visibilityClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')} ` : '';

  const [rows] = await db.sequelize.query(
    `SELECT
    s.survey_id,
      s.code,
      s.title,
      s.type,
      s.version,
      s.status,
      s.config,
      s.dsl_rules,
      s.created_by,
      s.created_at,
      s.updated_at,
      u.name AS created_by_name,
        COALESCE(q.question_count, 0) AS question_count,
          lr.release_id AS latest_release_id,
            lr.name AS latest_release_name,
              lr.opens_at AS latest_release_opens_at,
                lr.closes_at AS latest_release_closes_at,
                  lr.is_frozen AS latest_release_is_frozen
    FROM surveys s
    LEFT JOIN users u ON u.user_id = s.created_by
    LEFT JOIN(
                    SELECT survey_id, COUNT(*) AS question_count
      FROM survey_questions
      GROUP BY survey_id
                  ) q ON q.survey_id = s.survey_id
    LEFT JOIN survey_releases lr ON lr.release_id = (
      SELECT sr.release_id
      FROM survey_releases sr
      WHERE sr.survey_id = s.survey_id
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    ${visibilityClause}
    ORDER BY s.updated_at DESC, s.created_at DESC`,
    { replacements }
  );

  return rows || [];
}

exports.createSurvey = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    if (!hasManagePermission(req)) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Only admin or approver can create surveys' });
    }

    const title = String(req.body?.title || '').trim();
    if (!title) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Survey title is required' });
    }

    const surveyType = String(req.body?.category || req.body?.type || 'PICK_N').toUpperCase();
    const allowedTypes = ['PICK_N', 'PRIORITY', 'WORKFLOW_RELAY', 'CALENDAR_SLOT', 'ACTION_PLAN', 'VERIFICATION', 'AUTH'];
    const type = allowedTypes.includes(surveyType) ? surveyType : 'PICK_N';

    const surveyId = await nextId('surveys', 'survey_id', transaction);
    const version = Number(req.body?.version || 1);
    const code = `SVY - ${String(surveyId).padStart(4, '0')} `;

    const config = {
      summary: req.body?.summary || '',
      otpRequired: Boolean(req.body?.otpRequired),
      fileRequired: Boolean(req.body?.fileRequired),
      anonymous: Boolean(req.body?.anonymous),
      targetGroups: Array.isArray(req.body?.targetGroups) ? req.body.targetGroups : [],
      targetGroupIds: await getActiveGroupIds(req.body?.targetGroupIds, transaction),
      targetUserIds: await getActiveUserIds(req.body?.targetUserIds, transaction),
      startDate: req.body?.startDate || null,
      endDate: req.body?.endDate || null,
      groups: Array.isArray(req.body?.groups) ? req.body.groups : [],
      pages: normalizeSurveyPagesForConfig(req.body?.pages),
      maxResponses: req.body?.maxResponses == null ? null : Math.max(0, Number(req.body.maxResponses) || 0),
      responseCategoryLimits: normalizeResponseCategoryLimits(req.body?.responseCategoryLimits || req.body?.responseQuotas),
      mailDraft: normalizeMailDraft(req.body?.mailDraft || req.body?.config?.mailDraft),
    };

    await db.sequelize.query(
      `INSERT INTO surveys(survey_id, code, title, type, version, status, config, dsl_rules, created_by, created_at, updated_at)
  VALUES(:surveyId, :code, :title, :type, :version, 'DRAFT', :config, :dslRules, :createdBy, NOW(), NOW())`,
      {
        replacements: {
          surveyId,
          code,
          title,
          type,
          version,
          config: JSON.stringify(config),
          dslRules: JSON.stringify({}),
          createdBy: req.userId,
        },
        transaction,
      }
    );

    // Support both flat questions and pages format
    let allQuestions = [];
    if (Array.isArray(req.body?.pages) && req.body.pages.length) {
      // Pages format: flatten pages into questions array
      for (const page of req.body.pages) {
        if (Array.isArray(page.questions)) {
          allQuestions = allQuestions.concat(page.questions);
        }
      }
    } else if (Array.isArray(req.body?.questions)) {
      // Flat format: use as-is
      allQuestions = req.body.questions;
    }

    if (!allQuestions.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Survey must have at least one question' });
    }

    let nextQuestionId = await nextId('survey_questions', 'question_id', transaction);
    let nextOptionId = await nextId('survey_question_options', 'question_option_id', transaction);

    const clientToDbQuestionId = new Map();
    for (let index = 0; index < allQuestions.length; index += 1) {
      const dbQuestionId = nextQuestionId + index;
      const clientId = allQuestions[index]?.id;
      if (clientId != null && String(clientId).trim()) {
        clientToDbQuestionId.set(String(clientId), dbQuestionId);
      }
      clientToDbQuestionId.set(String(index + 1), dbQuestionId);
    }

    for (let index = 0; index < allQuestions.length; index += 1) {
      const question = allQuestions[index];
      const questionId = nextQuestionId;
      nextQuestionId += 1;

      const rawDisplayLogic = normalizeDisplayLogic(question?.displayLogic);
      const sourceKey = String(rawDisplayLogic.sourceQuestionId || '').trim();
      const mappedSourceId = sourceKey ? clientToDbQuestionId.get(sourceKey) : null;
      const mappedDisplayLogic = {
        ...rawDisplayLogic,
        sourceQuestionId: mappedSourceId ? String(mappedSourceId) : '',
      };
      if (!mappedDisplayLogic.sourceQuestionId) {
        mappedDisplayLogic.enabled = false;
      }

      const rawSkipLogic = normalizeSkipLogic(question?.skipLogic, clientToDbQuestionId);
      const mappedSkipLogic = {
        ...rawSkipLogic,
      };
      if (!mappedSkipLogic.sourceQuestionId) {
        mappedSkipLogic.enabled = false;
      }

      const questionConfig = {
        answerType: String(question?.type || 'short_text').toLowerCase(),
        displayLogic: mappedDisplayLogic,
        skipLogic: mappedSkipLogic,
        validation: normalizeValidation(question?.validation),
        scaleMin: Number(question?.scaleMin || 1),
        scaleMax: Number(question?.scaleMax || 5),
        fileName: question?.fileName || '',
        min: question?.min != null ? Number(question.min) : null,
        max: question?.max != null ? Number(question.max) : null,
        rows: Array.isArray(question?.rows) ? question.rows : [],
        columns: Array.isArray(question?.columns) ? question.columns : [],
        selectionRules: normalizeSelectionRules(question?.selectionRules, {
          maxPrimary: question?.type === 'priority_select' ? 3 : 2,
          maxSecondary: question?.type === 'multi_level_selection' ? 2 : 0,
          maxSpecial: 0,
          preventDuplicate: ['priority_select', 'multi_level_selection'].includes(String(question?.type || '').toLowerCase()),
        }),
        maxRank: Number(question?.maxRank || (question?.type === 'priority_select' ? 3 : 0)) || 0,
      };

      await db.sequelize.query(
        `INSERT INTO survey_questions(question_id, survey_id, question_type, question_text, is_required, sort_order, config, created_at, updated_at)
  VALUES(:questionId, :surveyId, :questionType, :questionText, :isRequired, :sortOrder, :config, NOW(), NOW())`,
        {
          replacements: {
            questionId,
            surveyId,
            questionType: mapQuestionType(question?.type),
            questionText: String(question?.text || '').trim() || `Question ${index + 1} `,
            isRequired: question?.required !== false,
            sortOrder: index + 1,
            config: JSON.stringify(questionConfig),
          },
          transaction,
        }
      );

      const choices = Array.isArray(question?.options) ? question.options : [];
      if (choices.length && ['single_choice', 'multiple_choice', 'dropdown', 'limited_dropdown', 'priority_select', 'multi_level_selection'].includes(String(question?.type || '').toLowerCase())) {
        for (let optionIndex = 0; optionIndex < choices.length; optionIndex += 1) {
          const normalizedOption = normalizeChoiceOption(choices[optionIndex], optionIndex);
          const optionText = normalizedOption.label;
          if (!optionText) continue;

          const optionId = nextOptionId;
          nextOptionId += 1;

          const meta = {
            ...(normalizedOption.meta || {}),
            limit: normalizedOption.limit,
            selectedCount: normalizedOption.selectedCount,
          };

          await db.sequelize.query(
            `INSERT INTO survey_question_options(question_option_id, question_id, option_text, value, sort_order, meta, created_at, updated_at)
  VALUES(:optionId, :questionId, :optionText, :value, :sortOrder, :meta, NOW(), NOW())`,
            {
              replacements: {
                optionId,
                questionId,
                optionText,
                value: normalizedOption.value || optionText,
                sortOrder: optionIndex + 1,
                meta: JSON.stringify(meta),
              },
              transaction,
            }
          );
        }
      }
    }

    await transaction.commit();

    try {
      await sendSurveyCreationNotification({
        surveyId,
        surveyTitle: title,
        actorUserId: req.userId,
        targetGroupIds: config.targetGroupIds,
        targetUserIds: config.targetUserIds,
        mailDraft: config.mailDraft,
        surveyDeadline: config.endDate,
      });
    } catch (notificationError) {
      console.error('[survey.controller] failed to send survey creation notifications', notificationError && (notificationError.message || notificationError));
    }

    const [createdRows] = await db.sequelize.query(
      'SELECT survey_id, code, title, type, version, status, created_at, updated_at FROM surveys WHERE survey_id = :surveyId',
      { replacements: { surveyId } }
    );

    return res.status(201).json(createdRows && createdRows[0] ? createdRows[0] : { survey_id: surveyId });
  } catch (err) {
    await transaction.rollback();
    return res.status(400).json({ error: err.message || 'Failed to create survey' });
  }
};

exports.getSurveys = async (req, res) => {
  try {
    const surveys = await getSurveyList(req);
    return res.json(surveys);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch surveys' });
  }
};

exports.getSurveyById = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    const [surveyRows] = await db.sequelize.query(
      `SELECT s.*, u.name AS created_by_name
       FROM surveys s
       LEFT JOIN users u ON u.user_id = s.created_by
       WHERE s.survey_id = :surveyId
       LIMIT 1`,
      { replacements: { surveyId } }
    );

    const survey = surveyRows && surveyRows[0] ? surveyRows[0] : null;
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    if (hasManagePermission(req) && isApproverScoped(req) && Number(survey.created_by) !== Number(req.userId)) {
      return res.status(403).json({ error: 'Approvers can only access surveys they created' });
    }

    if (isStudentRole(req) && !hasManagePermission(req) && survey.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This survey is not available for students' });
    }

    const surveyConfig = parseJsonSafe(survey.config, {});
    if (isStudentRole(req) && !hasManagePermission(req)) {
      const [existingRows] = await db.sequelize.query(
        `SELECT sp.participation_id
         FROM survey_participation sp
         INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
         WHERE sr.survey_id = :surveyId AND sp.user_id = :userId
         ORDER BY sp.created_at DESC
         LIMIT 1`,
        { replacements: { surveyId, userId: req.userId } }
      );

      const hasExisting = Boolean(existingRows && existingRows[0]);
      if (!hasExisting) {
        const reachedQuota = await findReachedCategoryQuota({
          surveyId,
          userId: req.userId,
          surveyConfig,
        });
        if (reachedQuota) {
          return res.status(409).json({
            error: `Response limit reached for your category(${reachedQuota.label})`,
            quota: reachedQuota,
          });
        }
      }
    }

    const [questionRows] = await db.sequelize.query(
      `SELECT question_id, question_type, question_text, is_required, sort_order, config
       FROM survey_questions
       WHERE survey_id = :surveyId
       ORDER BY sort_order ASC, question_id ASC`,
      { replacements: { surveyId } }
    );

    const questionIds = (questionRows || []).map((row) => Number(row.question_id));
    let optionRows = [];
    if (questionIds.length) {
      const [rows] = await db.sequelize.query(
        `SELECT question_option_id, question_id, option_text, value, sort_order, meta
         FROM survey_question_options
         WHERE question_id IN(:questionIds)
         ORDER BY sort_order ASC, question_option_id ASC`,
        { replacements: { questionIds } }
      );
      optionRows = rows || [];
    }

    const optionsByQuestion = new Map();
    for (const option of optionRows) {
      const key = Number(option.question_id);
      const existing = optionsByQuestion.get(key) || [];
      existing.push(option);
      optionsByQuestion.set(key, existing);
    }

    const questions = (questionRows || []).map((question) => {
      const config = question.config && typeof question.config === 'string' ? JSON.parse(question.config) : (question.config || {});
      const qType = mapQuestionTypeToFrontend(question.question_type, config);
      const options = (optionsByQuestion.get(Number(question.question_id)) || []).map((option, index) => {
        const normalizedOption = normalizeChoiceOption(option, index);
        return {
          id: Number(option.question_option_id),
          label: normalizedOption.label,
          value: normalizedOption.value,
          limit: normalizedOption.limit,
          selectedCount: normalizedOption.selectedCount,
          sortOrder: Number(option.sort_order || 0),
        };
      });

      const q = {
        id: Number(question.question_id),
        text: question.question_text,
        type: qType,
        required: Boolean(question.is_required),
        sortOrder: Number(question.sort_order || 0),
        displayLogic: normalizeDisplayLogic(config.displayLogic),
        skipLogic: normalizeSkipLogic(config.skipLogic),
        validation: normalizeValidation(config.validation),
        selectionRules: normalizeSelectionRules(config.selectionRules, {
          maxPrimary: config.maxPrimary || (qType === 'priority_select' ? 3 : 0),
          maxSecondary: config.maxSecondary || (qType === 'multi_level_selection' ? 2 : 0),
          maxSpecial: config.maxSpecial || 0,
          preventDuplicate: ['priority_select', 'multi_level_selection'].includes(qType),
        }),
        maxRank: Number(config.maxRank || (qType === 'priority_select' ? 3 : 0)) || 0,
      };

      if (['single_choice', 'multiple_choice', 'dropdown', 'limited_dropdown', 'priority_select', 'multi_level_selection'].includes(qType)) {
        q.options = options;
      }

      if (qType === 'rating') {
        q.scaleMin = Number(config.scaleMin || 1);
        q.scaleMax = Number(config.scaleMax || 5);
      }

      if (qType === 'number') {
        if (config.min != null) q.min = config.min;
        if (config.max != null) q.max = config.max;
      }

      if (qType === 'matrix') {
        q.rows = Array.isArray(config.rows) ? config.rows : [];
        q.columns = Array.isArray(config.columns) ? config.columns : [];
      }

      return q;
    });

    const [releaseRows] = await db.sequelize.query(
      `SELECT release_id, name, opens_at, closes_at, is_frozen, created_at
       FROM survey_releases
       WHERE survey_id = :surveyId
       ORDER BY created_at DESC`,
      { replacements: { surveyId } }
    );

    const groups = Array.isArray(surveyConfig.groups) ? surveyConfig.groups : [];
    const pages = Array.isArray(surveyConfig.pages) ? surveyConfig.pages : [];

    return res.json({
      ...survey,
      questions,
      pages,
      groups,
      releases: releaseRows || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch survey' });
  }
};

exports.updateSurvey = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const [rows] = await db.sequelize.query('SELECT survey_id, config FROM surveys WHERE survey_id = :surveyId LIMIT 1', {
      replacements: { surveyId },
    });
    if (!rows || !rows[0]) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const currentConfig = rows[0].config && typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : (rows[0].config || {});
    const hasTopLevelMailDraft = Object.prototype.hasOwnProperty.call(req.body || {}, 'mailDraft');
    const hasConfigMailDraft = req.body?.config && Object.prototype.hasOwnProperty.call(req.body.config, 'mailDraft');
    const incomingMailDraft = hasTopLevelMailDraft
      ? req.body.mailDraft
      : (hasConfigMailDraft ? req.body.config.mailDraft : currentConfig.mailDraft);

    const nextConfig = {
      ...currentConfig,
      ...(req.body?.config || {}),
      summary: Object.prototype.hasOwnProperty.call(req.body || {}, 'summary') ? (req.body.summary || '') : (currentConfig.summary || ''),
      otpRequired: Object.prototype.hasOwnProperty.call(req.body || {}, 'otpRequired') ? Boolean(req.body.otpRequired) : Boolean(currentConfig.otpRequired),
      fileRequired: Object.prototype.hasOwnProperty.call(req.body || {}, 'fileRequired') ? Boolean(req.body.fileRequired) : Boolean(currentConfig.fileRequired),
      anonymous: Object.prototype.hasOwnProperty.call(req.body || {}, 'anonymous') ? Boolean(req.body.anonymous) : Boolean(currentConfig.anonymous),
      targetGroups: Object.prototype.hasOwnProperty.call(req.body || {}, 'targetGroups') ? (Array.isArray(req.body.targetGroups) ? req.body.targetGroups : []) : (currentConfig.targetGroups || []),
      targetGroupIds: Object.prototype.hasOwnProperty.call(req.body || {}, 'targetGroupIds')
        ? await getActiveGroupIds(req.body.targetGroupIds)
        : (currentConfig.targetGroupIds || []),
      targetUserIds: Object.prototype.hasOwnProperty.call(req.body || {}, 'targetUserIds')
        ? await getActiveUserIds(req.body.targetUserIds)
        : (currentConfig.targetUserIds || []),
      startDate: Object.prototype.hasOwnProperty.call(req.body || {}, 'startDate') ? (req.body.startDate || null) : (currentConfig.startDate || null),
      endDate: Object.prototype.hasOwnProperty.call(req.body || {}, 'endDate') ? (req.body.endDate || null) : (currentConfig.endDate || null),
      groups: Object.prototype.hasOwnProperty.call(req.body || {}, 'groups') ? (Array.isArray(req.body.groups) ? req.body.groups : []) : (currentConfig.groups || []),
      pages: Object.prototype.hasOwnProperty.call(req.body || {}, 'pages') ? normalizeSurveyPagesForConfig(req.body.pages) : (currentConfig.pages || []),
      maxResponses: Object.prototype.hasOwnProperty.call(req.body || {}, 'maxResponses')
        ? (req.body.maxResponses == null ? null : Math.max(0, Number(req.body.maxResponses) || 0))
        : (currentConfig.maxResponses == null ? null : Number(currentConfig.maxResponses)),
      responseCategoryLimits: Object.prototype.hasOwnProperty.call(req.body || {}, 'responseCategoryLimits')
        ? normalizeResponseCategoryLimits(req.body.responseCategoryLimits)
        : (Object.prototype.hasOwnProperty.call(req.body || {}, 'responseQuotas')
          ? normalizeResponseCategoryLimits(req.body.responseQuotas)
          : normalizeResponseCategoryLimits(currentConfig.responseCategoryLimits || currentConfig.responseQuotas)),
      mailDraft: normalizeMailDraft(incomingMailDraft),
    };

    const surveyType = String(req.body?.type || req.body?.category || '').toUpperCase();
    const allowedTypes = ['PICK_N', 'PRIORITY', 'WORKFLOW_RELAY', 'CALENDAR_SLOT', 'ACTION_PLAN', 'VERIFICATION', 'AUTH'];

    await db.sequelize.query(
      `UPDATE surveys
       SET title = COALESCE(:title, title),
    type = COALESCE(:type, type),
    status = COALESCE(:status, status),
    config = :config,
      updated_at = NOW()
       WHERE survey_id = :surveyId`,
      {
        replacements: {
          surveyId,
          title: Object.prototype.hasOwnProperty.call(req.body || {}, 'title') ? String(req.body.title || '').trim() : null,
          type: allowedTypes.includes(surveyType) ? surveyType : null,
          status: req.body?.status || null,
          config: JSON.stringify(nextConfig),
        },
      }
    );

    const [updatedRows] = await db.sequelize.query('SELECT * FROM surveys WHERE survey_id = :surveyId LIMIT 1', {
      replacements: { surveyId },
    });

    return res.json(updatedRows && updatedRows[0] ? updatedRows[0] : { survey_id: surveyId });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update survey' });
  }
};

exports.deleteSurvey = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res, transaction))) {
      return;
    }

    await db.sequelize.query('DELETE FROM survey_question_options WHERE question_id IN (SELECT question_id FROM survey_questions WHERE survey_id = :surveyId)', {
      replacements: { surveyId },
      transaction,
    });
    await db.sequelize.query('DELETE FROM survey_questions WHERE survey_id = :surveyId', {
      replacements: { surveyId },
      transaction,
    });
    await db.sequelize.query('DELETE FROM survey_release_audience WHERE release_id IN (SELECT release_id FROM survey_releases WHERE survey_id = :surveyId)', {
      replacements: { surveyId },
      transaction,
    });
    await db.sequelize.query('DELETE FROM survey_releases WHERE survey_id = :surveyId', {
      replacements: { surveyId },
      transaction,
    });
    const [result] = await db.sequelize.query('DELETE FROM surveys WHERE survey_id = :surveyId', {
      replacements: { surveyId },
      transaction,
    });

    await transaction.commit();
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    return res.json({ message: 'Survey deleted successfully', survey_id: surveyId });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message || 'Failed to delete survey' });
  }
};

exports.publishSurvey = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  let committed = false;

  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res, transaction))) {
      return;
    }

    const [surveyRows] = await db.sequelize.query('SELECT survey_id, title, config FROM surveys WHERE survey_id = :surveyId LIMIT 1', {
      replacements: { surveyId },
      transaction,
    });
    if (!surveyRows || !surveyRows[0]) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Survey not found' });
    }

    const surveyConfig = parseJsonSafe(surveyRows[0]?.config, {});

    // Sync updated questions from config to database (for republishing)
    let allQuestions = [];
    if (Array.isArray(surveyConfig?.pages) && surveyConfig.pages.length) {
      for (const page of surveyConfig.pages) {
        if (Array.isArray(page.questions)) {
          allQuestions = allQuestions.concat(page.questions);
        }
      }
    } else if (Array.isArray(surveyConfig?.questions)) {
      allQuestions = surveyConfig.questions;
    }

    if (allQuestions.length) {
      // Delete existing questions and options to replace with updated ones
      await db.sequelize.query('DELETE FROM survey_question_options WHERE question_id IN (SELECT question_id FROM survey_questions WHERE survey_id = :surveyId)', {
        replacements: { surveyId },
        transaction,
      });
      await db.sequelize.query('DELETE FROM survey_questions WHERE survey_id = :surveyId', {
        replacements: { surveyId },
        transaction,
      });

      // Re-insert updated questions and options
      let nextQuestionId = await nextId('survey_questions', 'question_id', transaction);
      let nextOptionId = await nextId('survey_question_options', 'question_option_id', transaction);

      const clientToDbQuestionId = new Map();
      for (let index = 0; index < allQuestions.length; index += 1) {
        const dbQuestionId = nextQuestionId + index;
        const clientId = allQuestions[index]?.id;
        if (clientId != null && String(clientId).trim()) {
          clientToDbQuestionId.set(String(clientId), dbQuestionId);
        }
        clientToDbQuestionId.set(String(index + 1), dbQuestionId);
      }

      for (let index = 0; index < allQuestions.length; index += 1) {
        const question = allQuestions[index];
        const questionId = nextQuestionId;
        nextQuestionId += 1;

        const rawDisplayLogic = normalizeDisplayLogic(question?.displayLogic);
        const sourceKey = String(rawDisplayLogic.sourceQuestionId || '').trim();
        const mappedSourceId = sourceKey ? clientToDbQuestionId.get(sourceKey) : null;
        const mappedDisplayLogic = {
          ...rawDisplayLogic,
          sourceQuestionId: mappedSourceId ? String(mappedSourceId) : '',
        };
        if (!mappedDisplayLogic.sourceQuestionId) {
          mappedDisplayLogic.enabled = false;
        }

        const rawSkipLogic = normalizeSkipLogic(question?.skipLogic, clientToDbQuestionId);
        const mappedSkipLogic = {
          ...rawSkipLogic,
        };
        if (!mappedSkipLogic.sourceQuestionId) {
          mappedSkipLogic.enabled = false;
        }

        const questionConfig = {
          answerType: String(question?.type || 'short_text').toLowerCase(),
          displayLogic: mappedDisplayLogic,
          skipLogic: mappedSkipLogic,
          validation: normalizeValidation(question?.validation),
          scaleMin: Number(question?.scaleMin || 1),
          scaleMax: Number(question?.scaleMax || 5),
          fileName: question?.fileName || '',
          min: question?.min != null ? Number(question.min) : null,
          max: question?.max != null ? Number(question.max) : null,
          rows: Array.isArray(question?.rows) ? question.rows : [],
          columns: Array.isArray(question?.columns) ? question.columns : [],
          selectionRules: normalizeSelectionRules(question?.selectionRules, {
            maxPrimary: question?.type === 'priority_select' ? 3 : 2,
            maxSecondary: question?.type === 'multi_level_selection' ? 2 : 0,
            maxSpecial: 0,
            preventDuplicate: ['priority_select', 'multi_level_selection'].includes(String(question?.type || '').toLowerCase()),
          }),
          maxRank: Number(question?.maxRank || (question?.type === 'priority_select' ? 3 : 0)) || 0,
        };

        await db.sequelize.query(
          `INSERT INTO survey_questions(question_id, survey_id, question_type, question_text, is_required, sort_order, config, created_at, updated_at)
  VALUES(:questionId, :surveyId, :questionType, :questionText, :isRequired, :sortOrder, :config, NOW(), NOW())`,
          {
            replacements: {
              questionId,
              surveyId,
              questionType: mapQuestionType(question?.type),
              questionText: String(question?.text || '').trim() || `Question ${index + 1} `,
              isRequired: question?.required !== false,
              sortOrder: index + 1,
              config: JSON.stringify(questionConfig),
            },
            transaction,
          }
        );

        const choices = Array.isArray(question?.options) ? question.options : [];
        if (choices.length && ['single_choice', 'multiple_choice', 'dropdown', 'limited_dropdown', 'priority_select', 'multi_level_selection'].includes(String(question?.type || '').toLowerCase())) {
          for (let optionIndex = 0; optionIndex < choices.length; optionIndex += 1) {
            const normalizedOption = normalizeChoiceOption(choices[optionIndex], optionIndex);
            const optionText = normalizedOption.label;
            if (!optionText) continue;

            const optionId = nextOptionId;
            nextOptionId += 1;

            const meta = {
              ...(normalizedOption.meta || {}),
              limit: normalizedOption.limit,
              selectedCount: normalizedOption.selectedCount,
            };

            await db.sequelize.query(
              `INSERT INTO survey_question_options(question_option_id, question_id, option_text, value, sort_order, meta, created_at, updated_at)
  VALUES(:optionId, :questionId, :optionText, :value, :sortOrder, :meta, NOW(), NOW())`,
              {
                replacements: {
                  optionId,
                  questionId,
                  optionText,
                  value: normalizedOption.value || optionText,
                  sortOrder: optionIndex + 1,
                  meta: JSON.stringify(meta),
                },
                transaction,
              }
            );
          }
        }
      }
    }

    const releaseId = await nextId('survey_releases', 'release_id', transaction);
    const releaseName = String(req.body?.release_name || `${surveyRows[0].title} Release`).trim();
    const opensAt = toDbDateOrNull(req.body?.opens_at || req.body?.startDate);
    const closesAt = toDbDateOrNull(req.body?.closes_at || req.body?.endDate);
    const releaseConfig = {
      publishedBy: req.userId,
      note: req.body?.note || null,
    };

    await db.sequelize.query(
      `INSERT INTO survey_releases(release_id, survey_id, name, phase, opens_at, closes_at, is_frozen, release_config, created_by, created_at, updated_at)
  VALUES(:releaseId, :surveyId, :name, :phase, :opensAt, :closesAt, 0, :releaseConfig, :createdBy, NOW(), NOW())`,
      {
        replacements: {
          releaseId,
          surveyId,
          name: releaseName,
          phase: Number(req.body?.phase || 1),
          opensAt,
          closesAt,
          releaseConfig: JSON.stringify(releaseConfig),
          createdBy: req.userId,
        },
        transaction,
      }
    );

    const audienceGroupIds = Array.isArray(req.body?.audience_group_ids)
      ? await getActiveGroupIds(req.body.audience_group_ids, transaction)
      : await getActiveGroupIds(surveyConfig.targetGroupIds, transaction);

    if (audienceGroupIds.length) {
      let nextAudienceId = await nextId('survey_release_audience', 'release_audience_id', transaction);
      for (const groupId of audienceGroupIds) {
        await db.sequelize.query(
          `INSERT INTO survey_release_audience(release_audience_id, release_id, audience_type, ref_id, filter_expr, created_at, updated_at)
  VALUES(:audienceId, :releaseId, 'GROUP', :groupId, :filterExpr, NOW(), NOW())`,
          {
            replacements: {
              audienceId: nextAudienceId,
              releaseId,
              groupId,
              filterExpr: JSON.stringify({}),
            },
            transaction,
          }
        );
        nextAudienceId += 1;
      }
    }

    await db.sequelize.query(
      `UPDATE surveys
       SET status = 'PUBLISHED', updated_at = NOW()
       WHERE survey_id = :surveyId`,
      { replacements: { surveyId }, transaction }
    );

    await transaction.commit();
    committed = true;

    let notificationResult;
    try {
      const draft = normalizeMailDraft(surveyConfig.mailDraft);
      notificationResult = await sendSurveyDeadlineReminder({
        surveyId,
        releaseId,
        actorUserId: req.userId,
        customSubject: draft.subject || null,
        customMessage: draft.body || null,
      });
    } catch (notifyErr) {
      notificationResult = {
        release_id: releaseId,
        survey_id: surveyId,
        error: notifyErr.message || 'Failed to send reminders',
      };
    }

    return res.json({
      message: 'Survey published successfully',
      survey_id: surveyId,
      release_id: releaseId,
      notifications: notificationResult,
    });
  } catch (err) {
    if (!committed) {
      await transaction.rollback();
    }
    return res.status(500).json({ error: err.message || 'Failed to publish survey' });
  }
};

exports.unpublishSurvey = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    await db.sequelize.query(
      `UPDATE surveys
       SET status = 'DRAFT', updated_at = NOW()
       WHERE survey_id = :surveyId`,
      { replacements: { surveyId } }
    );
    await db.sequelize.query(
      `UPDATE survey_releases
       SET is_frozen = 1, closes_at = COALESCE(closes_at, NOW()), updated_at = NOW()
       WHERE survey_id = :surveyId AND is_frozen = 0`,
      { replacements: { surveyId } }
    );

    return res.json({ message: 'Survey moved back to draft', survey_id: surveyId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to unpublish survey' });
  }
};

exports.archiveSurvey = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    await db.sequelize.query(
      `UPDATE surveys
       SET status = 'ARCHIVED', updated_at = NOW()
       WHERE survey_id = :surveyId`,
      { replacements: { surveyId } }
    );

    return res.json({ message: 'Survey archived successfully', survey_id: surveyId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to archive survey' });
  }
};

exports.getReleasesForSurvey = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const [rows] = await db.sequelize.query(
      `SELECT
  sr.release_id,
    sr.name,
    sr.phase,
    sr.opens_at,
    sr.closes_at,
    sr.is_frozen,
    sr.release_config,
    sr.created_at,
    sr.updated_at,
    u.name AS created_by_name,
      COUNT(DISTINCT sp.participation_id) AS total_participants,
        COUNT(DISTINCT CASE WHEN sp.status = 'SUBMITTED' THEN sp.participation_id END) AS submitted_count
      FROM survey_releases sr
      LEFT JOIN users u ON u.user_id = sr.created_by
      LEFT JOIN survey_participation sp ON sp.release_id = sr.release_id
      WHERE sr.survey_id = :surveyId
      GROUP BY sr.release_id, sr.name, sr.phase, sr.opens_at, sr.closes_at,
    sr.is_frozen, sr.release_config, sr.created_at, sr.updated_at, u.name
      ORDER BY sr.created_at DESC`,
      { replacements: { surveyId } }
    );

    return res.json(rows || []);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch releases' });
  }
};

exports.createRelease = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  let committed = false;

  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res, transaction))) {
      return;
    }

    const [surveyRows] = await db.sequelize.query(
      'SELECT survey_id, title, config FROM surveys WHERE survey_id = :surveyId LIMIT 1',
      { replacements: { surveyId }, transaction }
    );
    if (!surveyRows || !surveyRows[0]) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Survey not found' });
    }

    const releaseId = await nextId('survey_releases', 'release_id', transaction);
    const releaseName = String(req.body?.release_name || req.body?.name || `${surveyRows[0].title} Release`).trim();
    const opensAt = toDbDateOrNull(req.body?.opens_at);
    const closesAt = toDbDateOrNull(req.body?.closes_at);

    await db.sequelize.query(
      `INSERT INTO survey_releases(release_id, survey_id, name, phase, opens_at, closes_at, is_frozen, release_config, created_by, created_at, updated_at)
  VALUES(:releaseId, :surveyId, :name, :phase, :opensAt, :closesAt, 0, :releaseConfig, :createdBy, NOW(), NOW())`,
      {
        replacements: {
          releaseId,
          surveyId,
          name: releaseName,
          phase: Number(req.body?.phase || 1),
          opensAt,
          closesAt,
          releaseConfig: JSON.stringify({ publishedBy: req.userId, note: req.body?.note || null }),
          createdBy: req.userId,
        },
        transaction,
      }
    );

    const surveyConfig = parseJsonSafe(surveyRows[0]?.config, {});
    const audienceGroupIds = Array.isArray(req.body?.audience_group_ids)
      ? await getActiveGroupIds(req.body.audience_group_ids, transaction)
      : await getActiveGroupIds(surveyConfig.targetGroupIds, transaction);
    const audienceUserIds = Array.isArray(req.body?.audience_user_ids)
      ? await getActiveUserIds(req.body.audience_user_ids, transaction)
      : await getActiveUserIds(surveyConfig.targetUserIds, transaction);

    if (audienceGroupIds.length || audienceUserIds.length) {
      let nextAudienceId = await nextId('survey_release_audience', 'release_audience_id', transaction);
      for (const groupId of audienceGroupIds) {
        await db.sequelize.query(
          `INSERT INTO survey_release_audience(release_audience_id, release_id, audience_type, ref_id, filter_expr, created_at, updated_at)
  VALUES(:audienceId, :releaseId, 'GROUP', :groupId, :filterExpr, NOW(), NOW())`,
          {
            replacements: { audienceId: nextAudienceId, releaseId, groupId, filterExpr: JSON.stringify({}) },
            transaction,
          }
        );
        nextAudienceId += 1;
      }

      for (const userId of audienceUserIds) {
        await db.sequelize.query(
          `INSERT INTO survey_release_audience(release_audience_id, release_id, audience_type, ref_id, filter_expr, created_at, updated_at)
  VALUES(:audienceId, :releaseId, 'USER', :userId, :filterExpr, NOW(), NOW())`,
          {
            replacements: { audienceId: nextAudienceId, releaseId, userId, filterExpr: JSON.stringify({}) },
            transaction,
          }
        );
        nextAudienceId += 1;
      }
    }

    await transaction.commit();
    committed = true;

    let notificationResult;
    try {
      const draft = normalizeMailDraft(surveyConfig.mailDraft);
      notificationResult = await sendSurveyDeadlineReminder({
        surveyId,
        releaseId,
        actorUserId: req.userId,
        customSubject: draft.subject || null,
        customMessage: draft.body || null,
      });
    } catch (notifyErr) {
      notificationResult = {
        release_id: releaseId,
        survey_id: surveyId,
        error: notifyErr.message || 'Failed to send reminders',
      };
    }

    const [createdRows] = await db.sequelize.query(
      'SELECT * FROM survey_releases WHERE release_id = :releaseId LIMIT 1',
      { replacements: { releaseId } }
    );

    const payload = createdRows && createdRows[0] ? createdRows[0] : { release_id: releaseId };
    return res.status(201).json({ ...payload, notifications: notificationResult });
  } catch (err) {
    if (!committed) {
      await transaction.rollback();
    }
    return res.status(500).json({ error: err.message || 'Failed to create release' });
  }
};

exports.sendReleaseDeadlineReminder = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const releaseId = Number(req.params.releaseId);
    const [surveyRows] = await db.sequelize.query(
      'SELECT config FROM surveys WHERE survey_id = :surveyId LIMIT 1',
      { replacements: { surveyId } }
    );
    const surveyConfig = parseJsonSafe(surveyRows && surveyRows[0] ? surveyRows[0].config : {}, {});
    const draft = normalizeMailDraft(surveyConfig.mailDraft);
    const customMessage = req.body && typeof req.body.message === 'string'
      ? req.body.message.trim()
      : '';
    const customSubject = req.body && typeof req.body.subject === 'string'
      ? req.body.subject.trim()
      : '';

    const result = await sendSurveyDeadlineReminder({
      surveyId,
      releaseId,
      actorUserId: req.userId,
      customSubject: customSubject || draft.subject || null,
      customMessage: customMessage || draft.body || null,
    });

    return res.json({
      message: 'Deadline reminder dispatched',
      ...result,
    });
  } catch (err) {
    const statusCode = Number(err && err.statusCode) || 500;
    return res.status(statusCode).json({ error: err.message || 'Failed to dispatch release reminder' });
  }
};

exports.updateRelease = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const releaseId = Number(req.params.releaseId);

    const [rows] = await db.sequelize.query(
      'SELECT release_id FROM survey_releases WHERE release_id = :releaseId AND survey_id = :surveyId LIMIT 1',
      { replacements: { releaseId, surveyId } }
    );
    if (!rows || !rows[0]) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const updates = [];
    const replacements = { releaseId, surveyId };

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'name')) {
      updates.push('name = :name');
      replacements.name = String(req.body.name || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'opens_at')) {
      updates.push('opens_at = :opensAt');
      replacements.opensAt = toDbDateOrNull(req.body.opens_at);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'closes_at')) {
      updates.push('closes_at = :closesAt');
      replacements.closesAt = toDbDateOrNull(req.body.closes_at);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'is_frozen')) {
      updates.push('is_frozen = :isFrozen');
      replacements.isFrozen = req.body.is_frozen ? 1 : 0;
    }

    if (updates.length) {
      updates.push('updated_at = NOW()');
      await db.sequelize.query(
        `UPDATE survey_releases SET ${updates.join(', ')} WHERE release_id = :releaseId AND survey_id = :surveyId`,
        { replacements }
      );
    }

    const [updatedRows] = await db.sequelize.query(
      'SELECT * FROM survey_releases WHERE release_id = :releaseId LIMIT 1',
      { replacements: { releaseId } }
    );

    return res.json(updatedRows && updatedRows[0] ? updatedRows[0] : { release_id: releaseId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update release' });
  }
};

exports.deleteRelease = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res, transaction))) {
      return;
    }

    const releaseId = Number(req.params.releaseId);

    const [rows] = await db.sequelize.query(
      'SELECT release_id FROM survey_releases WHERE release_id = :releaseId AND survey_id = :surveyId LIMIT 1',
      { replacements: { releaseId, surveyId }, transaction }
    );
    if (!rows || !rows[0]) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Release not found' });
    }

    // Cascade: delete answers → participation → audience → release
    const [participationRows] = await db.sequelize.query(
      'SELECT participation_id FROM survey_participation WHERE release_id = :releaseId',
      { replacements: { releaseId }, transaction }
    );
    const participationIds = (participationRows || []).map((r) => Number(r.participation_id));

    if (participationIds.length) {
      await db.sequelize.query(
        'DELETE FROM survey_answers WHERE participation_id IN (:participationIds)',
        { replacements: { participationIds }, transaction }
      );
    }

    await db.sequelize.query(
      'DELETE FROM survey_participation WHERE release_id = :releaseId',
      { replacements: { releaseId }, transaction }
    );
    await db.sequelize.query(
      'DELETE FROM survey_release_audience WHERE release_id = :releaseId',
      { replacements: { releaseId }, transaction }
    );

    const [result] = await db.sequelize.query(
      'DELETE FROM survey_releases WHERE release_id = :releaseId AND survey_id = :surveyId',
      { replacements: { releaseId, surveyId }, transaction }
    );

    await transaction.commit();

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Release not found' });
    }

    return res.json({ message: 'Release deleted successfully', release_id: releaseId });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message || 'Failed to delete release' });
  }
};

exports.generateSurveyOtp = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const [rows] = await db.sequelize.query(
      'SELECT survey_id, config FROM surveys WHERE survey_id = :surveyId LIMIT 1',
      { replacements: { surveyId } }
    );

    const survey = rows && rows[0] ? rows[0] : null;
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const currentConfig = parseJsonSafe(survey.config, {});
    if (!currentConfig.otpRequired) {
      return res.status(400).json({ error: 'OTP is not enabled for this survey' });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 1000).toISOString();
    const nextConfig = {
      ...currentConfig,
      otpCode,
      otpExpiresAt: expiresAt,
      otpGeneratedAt: new Date().toISOString(),
    };

    await db.sequelize.query(
      `UPDATE surveys
       SET config = :config, updated_at = NOW()
       WHERE survey_id = :surveyId`,
      {
        replacements: {
          surveyId,
          config: JSON.stringify(nextConfig),
        },
      }
    );

    return res.json({
      message: 'OTP generated successfully',
      survey_id: surveyId,
      otp: otpCode,
      expires_at: expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to generate OTP' });
  }
};

exports.getSurveyReport = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const [surveyRows] = await db.sequelize.query(
      `SELECT s.*, u.name AS created_by_name
       FROM surveys s
       LEFT JOIN users u ON u.user_id = s.created_by
       WHERE s.survey_id = :surveyId
       LIMIT 1`,
      { replacements: { surveyId } }
    );

    const survey = surveyRows && surveyRows[0] ? surveyRows[0] : null;
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const [questionRows] = await db.sequelize.query(
      `SELECT question_id, question_type, question_text, is_required, sort_order, config
       FROM survey_questions
       WHERE survey_id = :surveyId
       ORDER BY sort_order ASC, question_id ASC`,
      { replacements: { surveyId } }
    );

    const questionIds = (questionRows || []).map((row) => Number(row.question_id));
    let optionRows = [];
    if (questionIds.length) {
      const [rows] = await db.sequelize.query(
        `SELECT question_option_id, question_id, option_text, value, sort_order
         FROM survey_question_options
         WHERE question_id IN(:questionIds)
         ORDER BY sort_order ASC, question_option_id ASC`,
        { replacements: { questionIds } }
      );
      optionRows = rows || [];
    }

    const [answerRows] = await db.sequelize.query(
      `SELECT
  sa.answer_id,
    sa.question_id,
    sa.value_json,
    sp.participation_id,
    sp.user_id,
    sp.status AS participation_status,
      sp.submitted_at,
      u.name AS respondent_name,
        u.email AS respondent_email
      FROM survey_answers sa
      INNER JOIN survey_participation sp ON sp.participation_id = sa.participation_id
      INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
      LEFT JOIN users u ON u.user_id = sp.user_id
      WHERE sr.survey_id = :surveyId
      ORDER BY sp.submitted_at DESC, sa.created_at DESC`,
      { replacements: { surveyId } }
    );

    const [participantRows] = await db.sequelize.query(
      `SELECT
  sp.participation_id,
    sp.user_id,
    sp.status,
    sp.submitted_at,
    u.name,
    u.email
      FROM survey_participation sp
      INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
      LEFT JOIN users u ON u.user_id = sp.user_id
      WHERE sr.survey_id = :surveyId
      ORDER BY sp.submitted_at DESC, sp.created_at DESC`,
      { replacements: { surveyId } }
    );

    const optionsByQuestion = new Map();
    for (const option of optionRows) {
      const key = Number(option.question_id);
      const existing = optionsByQuestion.get(key) || [];
      existing.push(option);
      optionsByQuestion.set(key, existing);
    }

    const answersByQuestion = new Map();
    for (const answer of answerRows || []) {
      const key = Number(answer.question_id);
      const existing = answersByQuestion.get(key) || [];
      let parsedValue = answer.value_json;
      if (typeof parsedValue === 'string') {
        try {
          parsedValue = JSON.parse(parsedValue);
        } catch (_err) {
          parsedValue = parsedValue;
        }
      }
      if (typeof parsedValue === 'string') {
        parsedValue = parsedValue.trim();
      }

      existing.push({
        answer_id: Number(answer.answer_id),
        participation_id: Number(answer.participation_id),
        user_id: Number(answer.user_id),
        respondent_name: answer.respondent_name || 'Unknown User',
        respondent_email: answer.respondent_email || '-',
        submitted_at: answer.submitted_at,
        value: parsedValue,
      });
      answersByQuestion.set(key, existing);
    }

    const questions = (questionRows || []).map((question) => {
      const questionConfig = parseJsonSafe(question.config, {});
      const options = (optionsByQuestion.get(Number(question.question_id)) || []).map((option, index) => {
        const normalizedOption = normalizeChoiceOption(option, index);
        return {
          id: Number(option.question_option_id),
          label: normalizedOption.label,
          value: normalizedOption.value,
          limit: normalizedOption.limit,
          selectedCount: normalizedOption.selectedCount,
          sortOrder: Number(option.sort_order || 0),
        };
      });
      const submissions = answersByQuestion.get(Number(question.question_id)) || [];
      const type = mapQuestionTypeToFrontend(question.question_type, questionConfig);

      let distribution = [];
      let average = null;
      let matrixAggregation = [];
      if (type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown' || type === 'limited_dropdown' || type === 'priority_select' || type === 'multi_level_selection') {
        const counts = new Map(options.map((option) => [String(option.value || option.label), 0]));
        for (const submission of submissions) {
          const values = Array.isArray(submission.value) ? submission.value : [submission.value];
          for (const value of values.filter(Boolean)) {
            counts.set(String(value), (counts.get(String(value)) || 0) + 1);
          }
        }
        distribution = Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
      } else if (type === 'rating') {
        const scaleMin = Number(questionConfig.scaleMin || 1);
        const scaleMax = Number(questionConfig.scaleMax || 5);
        const counts = new Map();
        for (let value = scaleMin; value <= scaleMax; value += 1) {
          counts.set(String(value), 0);
        }
        for (const submission of submissions) {
          const key = String(submission.value);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        distribution = Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
        const numericRatings = submissions
          .map((submission) => Number(submission.value))
          .filter((value) => Number.isFinite(value));
        if (numericRatings.length) {
          average = Number((numericRatings.reduce((sum, value) => sum + value, 0) / numericRatings.length).toFixed(2));
        }
      } else if (type === 'matrix') {
        const rows = Array.isArray(questionConfig.rows) ? questionConfig.rows : [];
        const columns = Array.isArray(questionConfig.columns) ? questionConfig.columns : [];
        const aggregate = new Map();

        for (const row of rows) {
          const rowKey = String(row && typeof row === 'object' ? row.id || row.text || '' : row || '');
          aggregate.set(rowKey, {
            rowId: rowKey,
            rowLabel: String(row && typeof row === 'object' ? row.text || row.id || '' : row || ''),
            values: Object.fromEntries(columns.map((column) => {
              const colKey = String(column && typeof column === 'object' ? column.id || column.text || '' : column || '');
              return [colKey, 0];
            })),
          });
        }

        for (const submission of submissions) {
          const matrixValue = submission.value && typeof submission.value === 'object' ? submission.value : {};
          for (const [rowId, colValue] of Object.entries(matrixValue)) {
            const rowEntry = aggregate.get(String(rowId)) || {
              rowId: String(rowId),
              rowLabel: String(rowId),
              values: {},
            };
            const colKey = String(colValue);
            rowEntry.values[colKey] = (Number(rowEntry.values[colKey]) || 0) + 1;
            aggregate.set(String(rowId), rowEntry);
          }
        }

        matrixAggregation = Array.from(aggregate.values());
      }

      return {
        id: Number(question.question_id),
        text: question.question_text,
        type,
        required: Boolean(question.is_required),
        sortOrder: Number(question.sort_order || 0),
        options,
        scaleMin: Number(questionConfig.scaleMin || 1),
        scaleMax: Number(questionConfig.scaleMax || 5),
        selectionRules: normalizeSelectionRules(questionConfig.selectionRules, {
          maxPrimary: questionConfig.maxPrimary || (type === 'priority_select' ? 3 : 0),
          maxSecondary: questionConfig.maxSecondary || (type === 'multi_level_selection' ? 2 : 0),
          preventDuplicate: ['priority_select', 'multi_level_selection'].includes(type),
        }),
        maxRank: Number(questionConfig.maxRank || (type === 'priority_select' ? 3 : 0)) || 0,
        displayLogic: normalizeDisplayLogic(questionConfig.displayLogic),
        submissionCount: submissions.length,
        distribution,
        average,
        matrixAggregation,
        submissions,
      };
    });

    return res.json({
      ...survey,
      config: parseJsonSafe(survey.config, {}),
      questions,
      submissions: (participantRows || []).map((row) => ({
        participation_id: Number(row.participation_id),
        user_id: Number(row.user_id),
        status: row.status,
        submitted_at: row.submitted_at,
        respondent_name: row.name || 'Unknown User',
        respondent_email: row.email || '-',
      })),
      total_submissions: Number((participantRows || []).filter((row) => row.status === 'SUBMITTED').length),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch survey report' });
  }
};

exports.getSurveyResponses = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const search = String(req.query.search || '').trim();
    const snapshot = await getSurveyResponseSnapshot(surveyId, search);
    if (!snapshot.survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    return res.json({
      survey_id: Number(snapshot.survey.survey_id),
      title: snapshot.survey.title,
      total: snapshot.responses.length,
      responses: snapshot.responses.map((response) => ({
        participation_id: response.participation_id,
        user_id: response.user_id,
        status: response.status,
        submitted_at: response.submitted_at,
        respondent_name: response.respondent_name,
        respondent_email: response.respondent_email,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch survey responses' });
  }
};

exports.getSurveyResponseById = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const participationId = Number(req.params.participationId);
    const snapshot = await getSurveyResponseSnapshot(surveyId);
    if (!snapshot.survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const response = snapshot.responses.find((item) => item.participation_id === participationId);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    const answers = snapshot.questions.map((question) => ({
      question_id: question.id,
      question_text: question.text,
      question_type: question.type,
      value: response.answerMap[String(question.id)] ?? null,
    }));

    return res.json({
      participation_id: response.participation_id,
      respondent_name: response.respondent_name,
      respondent_email: response.respondent_email,
      status: response.status,
      submitted_at: response.submitted_at,
      answers,
      group_answers: response.groupAnswers,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch response detail' });
  }
};

exports.deleteSurveyResponse = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res, transaction))) {
      return;
    }

    const participationId = Number(req.params.participationId);

    const [rows] = await db.sequelize.query(
      `SELECT sp.participation_id
       FROM survey_participation sp
       INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
       WHERE sr.survey_id = :surveyId AND sp.participation_id = :participationId
       LIMIT 1`,
      { replacements: { surveyId, participationId }, transaction }
    );

    if (!rows || !rows[0]) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Response not found' });
    }

    await db.sequelize.query(
      'DELETE FROM survey_answers WHERE participation_id = :participationId',
      { replacements: { participationId }, transaction }
    );
    await db.sequelize.query(
      'DELETE FROM survey_participation WHERE participation_id = :participationId',
      { replacements: { participationId }, transaction }
    );

    await transaction.commit();
    return res.json({ message: 'Response deleted successfully' });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message || 'Failed to delete response' });
  }
};

exports.exportSurveyResponses = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res))) {
      return;
    }

    const format = String(req.query.format || 'csv').toLowerCase();
    const snapshot = await getSurveyResponseSnapshot(surveyId, String(req.query.search || ''));
    if (!snapshot.survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const headers = [
      'participation_id',
      'respondent_name',
      'respondent_email',
      'status',
      'submitted_at',
      ...snapshot.questions.map((question) => `Q${question.id}: ${question.text} `),
      'group_answers_json',
    ];

    const rows = snapshot.responses.map((response) => {
      const base = {
        participation_id: response.participation_id,
        respondent_name: response.respondent_name,
        respondent_email: response.respondent_email,
        status: response.status,
        submitted_at: response.submitted_at ? new Date(response.submitted_at).toISOString() : '',
      };
      for (const question of snapshot.questions) {
        base[`Q${question.id}: ${question.text} `] = answerValueToText(response.answerMap[String(question.id)]);
      }
      base.group_answers_json = JSON.stringify(response.groupAnswers || {});
      return base;
    });

    const filenameBase = `survey - ${surveyId} -responses`;
    if (format === 'xlsx' || format === 'excel') {
      const xmlRows = [
        `< Row > ${headers.map((header) => `<Cell><Data ss:Type="String">${String(header).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`).join('')}</Row > `,
        ...rows.map((row) => `< Row > ${headers.map((header) => `<Cell><Data ss:Type="String">${String(row[header] ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`).join('')}</Row > `),
      ].join('');

      const workbook = `<? xml version = "1.0" ?> <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Responses"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename = "${filenameBase}.xls"`);
      return res.send(workbook);
    }

    const csv = [
      headers.map((header) => csvEscape(header)).join(','),
      ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename = "${filenameBase}.csv"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to export survey responses' });
  }
};

exports.runPriorityAllocation = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const surveyId = Number(req.params.id);
    if (!(await ensureSurveyManageAccess(req, surveyId, res, transaction))) {
      return;
    }

    const [surveyRows] = await db.sequelize.query(
      'SELECT survey_id, title FROM surveys WHERE survey_id = :surveyId LIMIT 1',
      { replacements: { surveyId }, transaction }
    );
    if (!surveyRows || !surveyRows[0]) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Survey not found' });
    }

    const requestedQuestionId = Number(req.body?.questionId);
    const [questionRows] = await db.sequelize.query(
      `SELECT question_id, config
       FROM survey_questions
       WHERE survey_id = :surveyId
       ORDER BY sort_order ASC, question_id ASC`,
      { replacements: { surveyId }, transaction }
    );

    const priorityQuestion = (questionRows || []).find((row) => {
      if (requestedQuestionId && Number(row.question_id) !== requestedQuestionId) return false;
      const cfg = parseJsonSafe(row.config, {});
      const answerType = String(cfg.answerType || '').toLowerCase();
      return answerType === 'priority_select';
    });

    if (!priorityQuestion) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No priority_select question found for allocation' });
    }

    const questionId = Number(priorityQuestion.question_id);

    const [optionRows] = await db.sequelize.query(
      `SELECT question_option_id, option_text, value, meta
       FROM survey_question_options
       WHERE question_id = :questionId
       ORDER BY sort_order ASC, question_option_id ASC`,
      { replacements: { questionId }, transaction }
    );

    if (!optionRows || !optionRows.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Priority question has no options configured' });
    }

    const optionStateByValue = new Map();
    for (const option of optionRows) {
      const normalizedOption = normalizeChoiceOption(option);
      const key = String(normalizedOption.value || normalizedOption.label).trim().toLowerCase();
      optionStateByValue.set(key, {
        option,
        label: normalizedOption.label,
        value: normalizedOption.value,
        limit: normalizedOption.limit,
        selectedCount: normalizedOption.selectedCount,
      });
    }

    const [participantRows] = await db.sequelize.query(
      `SELECT sp.participation_id, sp.user_id, sp.meta, u.score
       FROM survey_participation sp
       INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
       LEFT JOIN users u ON u.user_id = sp.user_id
       WHERE sr.survey_id = :surveyId
         AND sp.status = 'SUBMITTED'`,
      { replacements: { surveyId }, transaction }
    );

    const participationIds = (participantRows || []).map((row) => Number(row.participation_id)).filter((id) => Number.isInteger(id) && id > 0);
    if (!participationIds.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No submitted participants available for allocation' });
    }

    const [answerRows] = await db.sequelize.query(
      `SELECT participation_id, value_json
       FROM survey_answers
       WHERE question_id = :questionId
         AND participation_id IN (:participationIds)`,
      { replacements: { questionId, participationIds }, transaction }
    );

    const answerByParticipation = new Map();
    for (const row of answerRows || []) {
      answerByParticipation.set(Number(row.participation_id), parseAnswerValue(row.value_json));
    }

    const candidates = (participantRows || [])
      .map((row) => ({
        participationId: Number(row.participation_id),
        userId: Number(row.user_id),
        score: Number(row.score || 0),
        choices: Array.isArray(answerByParticipation.get(Number(row.participation_id)))
          ? answerByParticipation.get(Number(row.participation_id)).map((entry) => String(entry).trim()).filter(Boolean)
          : [],
      }))
      .filter((entry) => entry.choices.length > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.participationId - b.participationId;
      });

    const assignments = [];
    const incrementByOptionId = new Map();

    for (const candidate of candidates) {
      let assigned = null;

      for (const rawChoice of candidate.choices) {
        const key = String(rawChoice).trim().toLowerCase();
        const optionState = optionStateByValue.get(key)
          || Array.from(optionStateByValue.values()).find((entry) => String(entry.label || '').trim().toLowerCase() === key);
        if (!optionState) continue;

        const limit = optionState.limit;
        const remaining = limit == null ? Number.POSITIVE_INFINITY : Math.max(0, limit - optionState.selectedCount);
        if (remaining <= 0) continue;

        optionState.selectedCount += 1;
        assigned = {
          participationId: candidate.participationId,
          userId: candidate.userId,
          score: candidate.score,
          optionId: Number(optionState.option.question_option_id),
          optionLabel: optionState.label,
          optionValue: optionState.value,
        };
        incrementByOptionId.set(assigned.optionId, (incrementByOptionId.get(assigned.optionId) || 0) + 1);
        break;
      }

      assignments.push(assigned || {
        participationId: candidate.participationId,
        userId: candidate.userId,
        score: candidate.score,
        optionId: null,
        optionLabel: null,
        optionValue: null,
      });
    }

    for (const option of optionRows) {
      const normalizedOption = normalizeChoiceOption(option);
      const optionId = Number(option.question_option_id);
      const increment = incrementByOptionId.get(optionId) || 0;
      if (!increment) continue;

      const nextMeta = {
        ...parseMetaObject(option.meta, {}),
        limit: normalizedOption.limit,
        selectedCount: normalizedOption.selectedCount + increment,
      };

      await db.sequelize.query(
        `UPDATE survey_question_options
         SET meta = :meta, updated_at = NOW()
         WHERE question_option_id = :optionId`,
        {
          replacements: {
            optionId,
            meta: JSON.stringify(nextMeta),
          },
          transaction,
        }
      );
    }

    for (const assignment of assignments) {
      if (!assignment || !assignment.participationId) continue;
      const [metaRows] = await db.sequelize.query(
        'SELECT meta FROM survey_participation WHERE participation_id = :participationId LIMIT 1',
        { replacements: { participationId: assignment.participationId }, transaction }
      );
      const currentMeta = metaRows && metaRows[0] ? parseJsonSafe(metaRows[0].meta, {}) : {};
      currentMeta.priorityAllocation = {
        question_id: questionId,
        option_id: assignment.optionId,
        option_label: assignment.optionLabel,
        option_value: assignment.optionValue,
        allocated_at: new Date().toISOString(),
      };

      await db.sequelize.query(
        'UPDATE survey_participation SET meta = :meta WHERE participation_id = :participationId',
        {
          replacements: {
            participationId: assignment.participationId,
            meta: JSON.stringify(currentMeta),
          },
          transaction,
        }
      );
    }

    await transaction.commit();
    return res.json({
      survey_id: surveyId,
      question_id: questionId,
      total_candidates: candidates.length,
      total_assigned: assignments.filter((entry) => entry.optionId != null).length,
      assignments,
    });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message || 'Failed to run priority allocation' });
  }
};

exports.submitSurvey = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const surveyId = Number(req.params.id);
    const answersInput = req.body?.answers;
    const answers = Array.isArray(answersInput)
      ? answersInput
      : Object.entries(answersInput || {}).map(([questionId, value]) => ({
        question_id: Number(questionId),
        value,
      }));

    if (!answers.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'At least one answer is required' });
    }

    const [surveyRows] = await db.sequelize.query(
      'SELECT survey_id, status, config FROM surveys WHERE survey_id = :surveyId LIMIT 1',
      { replacements: { surveyId }, transaction }
    );

    const survey = surveyRows && surveyRows[0] ? surveyRows[0] : null;
    if (!survey) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (isStudentRole(req) && !hasManagePermission(req) && survey.status !== 'PUBLISHED') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Survey is not open for submission' });
    }

    const [userRows] = await db.sequelize.query(
      'SELECT user_id, attributes FROM users WHERE user_id = :userId LIMIT 1',
      { replacements: { userId: req.userId }, transaction }
    );
    const currentUser = userRows && userRows[0] ? userRows[0] : null;
    const userAttributes = parseJsonSafe(currentUser?.attributes, {});
    const isCoreMember = Boolean(
      userAttributes.isCoreMember
      || userAttributes.is_core_member
      || currentUser?.is_core_member
      || currentUser?.isCoreMember
    );
    if (isCoreMember) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Core committee members should not apply again' });
    }

    const surveyConfig = parseJsonSafe(survey.config, {});
    if (surveyConfig.otpRequired) {
      const submittedOtp = String(req.body?.otp || '').trim();
      const expectedOtp = String(surveyConfig.otpCode || '').trim();
      const otpExpiresAt = surveyConfig.otpExpiresAt ? new Date(surveyConfig.otpExpiresAt) : null;
      const isExpired = !otpExpiresAt || Number.isNaN(otpExpiresAt.getTime()) || otpExpiresAt.getTime() < Date.now();

      if (!submittedOtp) {
        await transaction.rollback();
        return res.status(400).json({ error: 'OTP is required to submit this survey' });
      }

      if (!expectedOtp || isExpired || submittedOtp !== expectedOtp) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    }

    // Validate group answers
    const groups = Array.isArray(surveyConfig.groups) ? surveyConfig.groups : [];
    for (const group of groups) {
      const groupId = String(group.id || '');
      if (!groupId) continue;

      const groupAnswer = answersInput && Object.prototype.hasOwnProperty.call(answersInput, groupId)
        ? answersInput[groupId]
        : null;
      const memberArray = Array.isArray(groupAnswer) ? groupAnswer : [];

      const minCount = Math.max(Number(group.minCount) || 0, 0);
      const maxCount = Math.min(Number(group.maxCount) || 100, 100);

      if (memberArray.length < minCount) {
        await transaction.rollback();
        return res.status(400).json({
          error: `${group.label} requires at least ${minCount} member(s).You have ${memberArray.length}.`,
        });
      }
      if (memberArray.length > maxCount) {
        await transaction.rollback();
        return res.status(400).json({
          error: `${group.label} allows at most ${maxCount} member(s).You have ${memberArray.length}.`,
        });
      }

      // Validate required fields per member
      const groupQuestions = Array.isArray(group.questions) ? group.questions : [];
      for (let memberIdx = 0; memberIdx < memberArray.length; memberIdx += 1) {
        const member = memberArray[memberIdx];
        if (!member || typeof member !== 'object') continue;

        for (const question of groupQuestions) {
          if (!question.required) continue;
          const qId = String(question.id || '');
          const memberValue = member[qId];
          if (memberValue === null || memberValue === undefined || memberValue === '' || (Array.isArray(memberValue) && memberValue.length === 0)) {
            await transaction.rollback();
            return res.status(400).json({
              error: `${group.label} - Item ${memberIdx + 1}: ${question.text} is required.`,
            });
          }
        }
      }
    }

    const [releaseRows] = await db.sequelize.query(
      `SELECT release_id
       FROM survey_releases
       WHERE survey_id = :surveyId
       ORDER BY created_at DESC
       LIMIT 1`,
      { replacements: { surveyId }, transaction }
    );
    const releaseId = releaseRows && releaseRows[0] ? Number(releaseRows[0].release_id) : null;
    if (!releaseId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Survey has no published release' });
    }

    const [participationRows] = await db.sequelize.query(
      `SELECT participation_id, status
       FROM survey_participation
       WHERE release_id = :releaseId AND user_id = :userId
       ORDER BY created_at DESC
       LIMIT 1`,
      {
        replacements: { releaseId, userId: req.userId },
        transaction,
      }
    );

    let participationId = participationRows && participationRows[0] ? Number(participationRows[0].participation_id) : null;
    const existingParticipationStatus = participationRows && participationRows[0] ? String(participationRows[0].status || '').toUpperCase() : '';

    if (participationId && existingParticipationStatus === 'SUBMITTED') {
      await transaction.rollback();
      return res.status(409).json({ error: 'You have already submitted this survey' });
    }

    const maxResponses = surveyConfig.maxResponses == null ? null : Number(surveyConfig.maxResponses);
    if (!participationId && Number.isFinite(maxResponses) && maxResponses > 0) {
      const [quotaRows] = await db.sequelize.query(
        `SELECT COUNT(1) AS total
         FROM survey_participation sp
         INNER JOIN survey_releases sr ON sr.release_id = sp.release_id
         WHERE sr.survey_id = :surveyId
           AND sp.status = 'SUBMITTED'`,
        { replacements: { surveyId }, transaction }
      );
      const submittedCount = Number(quotaRows && quotaRows[0] ? quotaRows[0].total : 0);
      if (submittedCount >= maxResponses) {
        await transaction.rollback();
        return res.status(409).json({ error: 'Response limit reached for this survey' });
      }
    }

    const groupAnswers = {};
    const questionAnswers = [];

    for (const answer of answers) {
      const questionId = Number(answer.question_id);
      if (Number.isInteger(questionId) && questionId > 0) {
        questionAnswers.push(answer);
      } else {
        const groupId = String(answer.question_id || '');
        if (groupId) {
          groupAnswers[groupId] = answer.value;
        }
      }
    }

    const [questionRows] = await db.sequelize.query(
      `SELECT question_id, question_type, config
       FROM survey_questions
       WHERE survey_id = :surveyId
       ORDER BY sort_order ASC, question_id ASC`,
      { replacements: { surveyId }, transaction }
    );

    const questionConfigById = new Map();
    const questionTypeById = new Map();
    for (const row of questionRows || []) {
      const questionId = Number(row.question_id);
      const questionConfig = parseJsonSafe(row.config, {});
      questionConfigById.set(questionId, questionConfig);
      questionTypeById.set(questionId, mapQuestionTypeToFrontend(row.question_type, questionConfig));
    }

    const questionIdsForOptions = Array.from(questionConfigById.keys());
    let optionRows = [];
    if (questionIdsForOptions.length) {
      const [rows] = await db.sequelize.query(
        `SELECT question_option_id, question_id, option_text, value, sort_order, meta
         FROM survey_question_options
         WHERE question_id IN(:questionIds)
         ORDER BY sort_order ASC, question_option_id ASC`,
        { replacements: { questionIds: questionIdsForOptions }, transaction }
      );
      optionRows = rows || [];
    }

    const optionsByQuestion = new Map();
    for (const option of optionRows || []) {
      const questionId = Number(option.question_id);
      const existing = optionsByQuestion.get(questionId) || [];
      existing.push(option);
      optionsByQuestion.set(questionId, existing);
    }

    const optionUpdatePlan = [];
    for (const answer of questionAnswers) {
      const questionId = Number(answer.question_id);
      const questionType = questionTypeById.get(questionId);
      if (!isChoiceQuestionType(questionType, questionConfigById.get(questionId))) {
        continue;
      }

      const selectedValues = extractSelectionValues(questionType, answer.value);
      const uniqueValues = Array.from(new Set(selectedValues.map((value) => String(value).trim()).filter(Boolean)));
      const questionConfig = questionConfigById.get(questionId) || {};
      const selectionRules = normalizeSelectionRules(questionConfig.selectionRules, {
        maxPrimary: questionConfig.maxPrimary || (questionType === 'priority_select' ? 3 : 0),
        maxSecondary: questionConfig.maxSecondary || (questionType === 'multi_level_selection' ? 2 : 0),
        maxSpecial: questionConfig.maxSpecial || 0,
        preventDuplicate: ['priority_select', 'multi_level_selection'].includes(questionType),
      });

      if (selectionRules.preventDuplicate && uniqueValues.length !== selectedValues.length) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Duplicate selections are not allowed for this question' });
      }

      const availableOptions = optionsByQuestion.get(questionId) || [];
      for (const selectedValue of uniqueValues) {
        const option = findMatchingOption(availableOptions, selectedValue);
        if (!option) {
          await transaction.rollback();
          return res.status(400).json({ error: `Invalid option selected for question ${questionId}` });
        }

        const meta = parseMetaObject(option.meta, {});
        const limit = meta.limit == null || meta.limit === '' ? null : Math.max(0, Number(meta.limit) || 0);
        const selectedCount = Math.max(0, Number(meta.selectedCount || meta.selected_count || 0));

        if (limit === 0) {
          await transaction.rollback();
          return res.status(409).json({ error: `Option ${option.option_text} is no longer available` });
        }

        if (limit != null && selectedCount >= limit) {
          await transaction.rollback();
          return res.status(409).json({ error: `Option ${option.option_text} is full` });
        }

        optionUpdatePlan.push({
          questionId,
          selectedValue,
          optionId: Number(option.question_option_id),
          currentCount: selectedCount,
          limit,
          meta,
        });
      }
    }

    if (!participationId) {
      const reachedQuota = await findReachedCategoryQuota({
        surveyId,
        userId: req.userId,
        surveyConfig,
        transaction,
      });

      if (reachedQuota) {
        await transaction.rollback();
        return res.status(409).json({
          error: `Response limit reached for your category(${reachedQuota.label})`,
          quota: reachedQuota,
        });
      }
    }

    if (!participationId) {
      participationId = await nextId('survey_participation', 'participation_id', transaction);
      await db.sequelize.query(
        `INSERT INTO survey_participation(participation_id, release_id, user_id, status, created_at, updated_at, started_at, meta)
  VALUES(:participationId, :releaseId, :userId, 'STARTED', NOW(), NOW(), NOW(), :meta)`,
        {
          replacements: {
            participationId,
            releaseId,
            userId: req.userId,
            meta: JSON.stringify({}),
          },
          transaction,
        }
      );
    }

    await db.sequelize.query(
      'DELETE FROM survey_answers WHERE participation_id = :participationId',
      { replacements: { participationId }, transaction }
    );

    for (const plan of optionUpdatePlan) {
      const nextMeta = {
        ...plan.meta,
        selectedCount: plan.currentCount + 1,
      };

      const [updateResult] = await db.sequelize.query(
        `UPDATE survey_question_options
         SET meta = :meta, updated_at = NOW()
         WHERE question_option_id = :optionId`,
        {
          replacements: {
            optionId: plan.optionId,
            meta: JSON.stringify(nextMeta),
          },
          transaction,
        }
      );

      if (!updateResult || updateResult.affectedRows === 0) {
        await transaction.rollback();
        return res.status(409).json({ error: `Unable to reserve seat for option ${plan.selectedValue}` });
      }
    }

    // Store question answers
    let nextAnswerId = await nextId('survey_answers', 'answer_id', transaction);
    for (const answer of questionAnswers) {
      const questionId = Number(answer.question_id);

      await db.sequelize.query(
        `INSERT INTO survey_answers(answer_id, participation_id, question_id, value_json, created_at, updated_at)
  VALUES(:answerId, :participationId, :questionId, :valueJson, NOW(), NOW())`,
        {
          replacements: {
            answerId: nextAnswerId,
            participationId,
            questionId,
            valueJson: JSON.stringify(answer.value),
          },
          transaction,
        }
      );
      nextAnswerId += 1;
    }

    // Store group answers in meta
    if (Object.keys(groupAnswers).length > 0) {
      const [currentMeta] = await db.sequelize.query(
        'SELECT meta FROM survey_participation WHERE participation_id = :participationId LIMIT 1',
        { replacements: { participationId }, transaction }
      );
      const existingMeta = currentMeta && currentMeta[0] ? parseJsonSafe(currentMeta[0].meta, {}) : {};
      const updatedMeta = { ...existingMeta, groupAnswers };

      await db.sequelize.query(
        'UPDATE survey_participation SET meta = :meta WHERE participation_id = :participationId',
        { replacements: { participationId, meta: JSON.stringify(updatedMeta) }, transaction }
      );
    }

    await db.sequelize.query(
      `UPDATE survey_participation
       SET status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW()
       WHERE participation_id = :participationId`,
      { replacements: { participationId }, transaction }
    );

    const [legacyRows] = await db.sequelize.query(
      `SELECT participant_id
       FROM survey_participants
       WHERE survey_id = :surveyId AND user_id = :userId
       ORDER BY created_at DESC
       LIMIT 1`,
      {
        replacements: { surveyId, userId: req.userId },
        transaction,
      }
    );

    if (legacyRows && legacyRows[0]) {
      await db.sequelize.query(
        `UPDATE survey_participants
         SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW(), meta = :meta
         WHERE participant_id = :participantId`,
        {
          replacements: {
            participantId: Number(legacyRows[0].participant_id),
            meta: JSON.stringify({ release_id: releaseId }),
          },
          transaction,
        }
      );
    } else {
      const legacyParticipantId = await nextId('survey_participants', 'participant_id', transaction);
      await db.sequelize.query(
        `INSERT INTO survey_participants(participant_id, survey_id, user_id, external_ref, status, invited_at, completed_at, meta, created_at, updated_at)
  VALUES(:participantId, :surveyId, :userId, NULL, 'COMPLETED', NOW(), NOW(), :meta, NOW(), NOW())`,
        {
          replacements: {
            participantId: legacyParticipantId,
            surveyId,
            userId: req.userId,
            meta: JSON.stringify({ release_id: releaseId }),
          },
          transaction,
        }
      );
    }

    await transaction.commit();
    return res.json({ message: 'Survey submitted successfully', survey_id: surveyId, participation_id: participationId });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message || 'Failed to submit survey' });
  }
};


