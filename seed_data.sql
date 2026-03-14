-- Seed Data for Survey Database
-- This file contains sample data that matches the actual database schema

USE `survey_db`;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
INSERT INTO `users` (`user_id`, `name`, `email`, `created_at`, `updated_at`) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@survey.com', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'John Smith', 'john.smith@survey.com', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Jane Doe', 'jane.doe@survey.com', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Bob Wilson', 'bob.wilson@survey.com', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Alice Brown', 'alice.brown@survey.com', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'Charlie Davis', 'charlie.davis@survey.com', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'Diana Evans', 'diana.evans@survey.com', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'Edward Frank', 'edward.frank@survey.com', NOW(), NOW());

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
INSERT INTO `roles` (`role_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ADMIN', 'Administrator with full access', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'USER', 'Regular user with basic access', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'MANAGER', 'Manager with approval rights', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'SUPERVISOR', 'Supervisor with limited admin rights', NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'VIEWER', 'Read-only access', NOW(), NOW());

-- ============================================================================
-- USER_ROLES TABLE (composite primary key)
-- ============================================================================
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW()),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW()),
('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW()),
('66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('77777777-7777-7777-7777-777777777777', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW());

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================
INSERT INTO `permissions` (`permission_id`, `code`, `description`, `created_at`, `updated_at`) VALUES
('p1111111-1111-1111-1111-111111111111', 'SURVEY_CREATE', 'Create new surveys', NOW(), NOW()),
('p2222222-2222-2222-2222-222222222222', 'SURVEY_EDIT', 'Edit existing surveys', NOW(), NOW()),
('p3333333-3333-3333-3333-333333333333', 'SURVEY_DELETE', 'Delete surveys', NOW(), NOW()),
('p4444444-4444-4444-4444-444444444444', 'SURVEY_VIEW', 'View surveys', NOW(), NOW()),
('p5555555-5555-5555-5555-555555555555', 'SURVEY_PUBLISH', 'Publish surveys', NOW(), NOW()),
('p6666666-6666-6666-6666-666666666666', 'RESPONDENT_ADD', 'Add respondents', NOW(), NOW()),
('p7777777-7777-7777-7777-777777777777', 'RESPONDENT_VIEW', 'View respondents', NOW(), NOW()),
('p8888888-8888-8888-8888-888888888888', 'RESPONDENT_EDIT', 'Edit respondent data', NOW(), NOW()),
('p9999999-9999-9999-9999-999999999999', 'REPORT_VIEW', 'View reports', NOW(), NOW()),
('paaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'REPORT_EXPORT', 'Export reports', NOW(), NOW()),
('pbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'USER_MANAGE', 'Manage users', NOW(), NOW()),
('pccccccc-cccc-cccc-cccc-cccccccccccc', 'APPROVE', 'Approve items', NOW(), NOW());

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================
INSERT INTO `groups` (`group_id`, `name`, `type`, `attributes`, `created_at`, `updated_at`) VALUES
('g1111111-1111-1111-1111-111111111111', 'Marketing Team', 'DEPARTMENT', '{}', NOW(), NOW()),
('g2222222-2222-2222-2222-222222222222', 'Product Team', 'DEPARTMENT', '{}', NOW(), NOW()),
('g3333333-3333-3333-3333-333333333333', 'Engineering', 'DEPARTMENT', '{}', NOW(), NOW()),
('g4444444-4444-4444-4444-444444444444', 'Customer Support', 'DEPARTMENT', '{}', NOW(), NOW());

-- ============================================================================
-- GROUP_MEMBERS TABLE
-- ============================================================================
INSERT INTO `group_members` (`group_id`, `user_id`, `joined_at`) VALUES
('g1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW()),
('g1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', NOW()),
('g2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NOW());

-- ============================================================================
-- ENUMS TABLE
-- ============================================================================
INSERT INTO `enums` (`name`, `value`) VALUES
('survey_type', 'PICK_N'),
('survey_type', 'PRIORITY'),
('survey_type', 'WORKFLOW_RELAY'),
('survey_type', 'CALENDAR_SLOT'),
('survey_type', 'ACTION_PLAN'),
('survey_type', 'VERIFICATION'),
('survey_type', 'AUTH'),
('survey_status', 'DRAFT'),
('survey_status', 'PUBLISHED'),
('survey_status', 'ARCHIVED');

-- ============================================================================
-- SURVEYS TABLE
-- ============================================================================
INSERT INTO `surveys` (`survey_id`, `code`, `title`, `type`, `version`, `status`, `config`, `created_by`, `created_at`, `updated_at`) VALUES
('s1111111-1111-1111-1111-111111111111', 'CUST-SAT-2026', 'Customer Satisfaction Survey 2026', 'PICK_N', 1, 'PUBLISHED', '{"title": "Customer Satisfaction Survey"}', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
('s2222222-2222-2222-2222-222222222222', 'EMP-ENG-2026', 'Employee Engagement Survey', 'PRIORITY', 1, 'DRAFT', '{"title": "Employee Engagement"}', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
('s3333333-3333-3333-3333-333333333333', 'PROD-FB-2026', 'Product Feedback Survey', 'PICK_N', 2, 'PUBLISHED', '{"title": "Product Feedback"}', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),
('s4444444-4444-4444-4444-444444444444', 'MKT-EVT-2026', 'Marketing Event Registration', 'CALENDAR_SLOT', 1, 'PUBLISHED', '{"title": "Event Registration"}', '22222222-2222-2222-2222-222222222222', NOW(), NOW());

-- ============================================================================
-- SURVEY_QUESTIONS TABLE
-- ============================================================================
INSERT INTO `survey_questions` (`question_id`, `survey_id`, `question_type`, `question_text`, `is_required`, `sort_order`, `config`, `created_at`, `updated_at`) VALUES
('q1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'SINGLE', 'How satisfied are you with our service?', 1, 1, '{"allow_other": true}', NOW(), NOW()),
('q2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'TEXT', 'What could we improve?', 0, 2, '{"max_length": 500}', NOW(), NOW()),
('q5555555-5555-5555-5555-555555555555', 's3333333-3333-3333-3333-333333333333', 'SINGLE', 'How easy is our product to use?', 1, 1, '{}', NOW(), NOW());

-- ============================================================================
-- SURVEY_OPTIONS TABLE
-- ============================================================================
INSERT INTO `survey_options` (`option_id`, `survey_id`, `code`, `label`, `description`, `sort_order`, `is_active`, `option_meta`, `created_at`, `updated_at`) VALUES
('o1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'VERY_SATISFIED', 'Very Satisfied', 'I am very satisfied', 1, 1, '{}', NOW(), NOW()),
('o2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'SATISFIED', 'Satisfied', 'I am satisfied', 2, 1, '{}', NOW(), NOW()),
('o3333333-3333-3333-3333-333333333333', 's1111111-1111-1111-1111-111111111111', 'NEUTRAL', 'Neutral', 'Neither satisfied nor dissatisfied', 3, 1, '{}', NOW(), NOW());

-- ============================================================================
-- SURVEY_RELEASES TABLE
-- ============================================================================
INSERT INTO `survey_releases` (`release_id`, `survey_id`, `name`, `phase`, `is_frozen`, `release_config`, `created_by`, `created_at`, `updated_at`) VALUES
('r1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'Q1 Release', 1, 0, '{}', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
('r3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333', 'Beta Release', 1, 1, '{}', '33333333-3333-3333-3333-333333333333', NOW(), NOW());

-- ============================================================================
-- SURVEY_PARTICIPANTS TABLE
-- ============================================================================
INSERT INTO `survey_participants` (`participant_id`, `survey_id`, `user_id`, `external_ref`, `status`, `invited_at`, `meta`, `created_at`, `updated_at`) VALUES
('sp111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'EXT-001', 'COMPLETED', NOW(), '{"source": "email"}', NOW(), NOW()),
('sp222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'EXT-002', 'INVITED', NOW(), '{"source": "email"}', NOW(), NOW());

-- ============================================================================
-- APPROVAL_WORKFLOWS TABLE
-- ============================================================================
INSERT INTO `approval_workflows` (`approval_workflow_id`, `entity_type`, `entity_id`, `requested_by`, `status`, `comments`, `requested_at`) VALUES
('aw111111-1111-1111-1111-111111111111', 'SURVEY', 's2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'PENDING', 'Waiting for approval', NOW());

-- ============================================================================
-- AUTH_TOKENS TABLE
-- ============================================================================
INSERT INTO `auth_tokens` (`auth_token_id`, `user_id`, `token_hash`, `token_type`, `expires_at`, `created_at`, `updated_at`) VALUES
('at111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'token_hash_123', 'ACCESS', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW());

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
INSERT INTO `audit_logs` (`audit_log_id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `new_value`, `created_at`) VALUES
('al111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'SURVEY', 's1111111-1111-1111-1111-111111111111', 'CREATE', '{"title": "Customer Satisfaction Survey"}', NOW());
