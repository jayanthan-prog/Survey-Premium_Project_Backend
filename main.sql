/*
SQLyog Community v13.3.0 (64 bit)
MySQL - 11.4.5-MariaDB-1 : Database - survey_db
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`survey_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `survey_db`;

/*Table structure for table `SequelizeMeta` */

DROP TABLE IF EXISTS `SequelizeMeta`;

CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

/*Table structure for table `action_plan_items` */

DROP TABLE IF EXISTS `action_plan_items`;

CREATE TABLE `action_plan_items` (
  `item_id` char(36) NOT NULL DEFAULT uuid(),
  `plan_id` char(36) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `window_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`window_rules`)),
  `dependency_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dependency_rules`)),
  `required` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `idx_action_plan_items_plan_id` (`plan_id`),
  CONSTRAINT `action_plan_items_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `action_plans` (`action_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `action_plans` */

DROP TABLE IF EXISTS `action_plans`;

CREATE TABLE `action_plans` (
  `action_plan_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `participant_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'PENDING',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`action_plan_id`),
  KEY `participant_id` (`participant_id`),
  KEY `idx_action_plans_survey_participant` (`survey_id`,`participant_id`),
  CONSTRAINT `action_plans_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `action_plans_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `survey_participants` (`participant_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `approval_actions` */

DROP TABLE IF EXISTS `approval_actions`;

CREATE TABLE `approval_actions` (
  `approval_action_id` char(36) NOT NULL DEFAULT uuid(),
  `approval_item_id` char(36) NOT NULL,
  `step_order` int(11) NOT NULL,
  `acted_by_user_id` char(36) DEFAULT NULL,
  `action` varchar(30) NOT NULL,
  `comment` text DEFAULT NULL,
  `acted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`approval_action_id`),
  KEY `idx_approval_actions_item` (`approval_item_id`),
  KEY `idx_approval_actions_user` (`acted_by_user_id`,`acted_at`),
  CONSTRAINT `approval_actions_ibfk_1` FOREIGN KEY (`approval_item_id`) REFERENCES `approval_items` (`approval_item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `approval_actions_ibfk_2` FOREIGN KEY (`acted_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `approval_items` */

DROP TABLE IF EXISTS `approval_items`;

CREATE TABLE `approval_items` (
  `approval_item_id` char(36) NOT NULL DEFAULT uuid(),
  `approval_workflow_id` char(36) NOT NULL,
  `approval_step_id` char(36) DEFAULT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `decided_by` char(36) DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`approval_item_id`),
  KEY `approval_step_id` (`approval_step_id`),
  KEY `decided_by` (`decided_by`),
  KEY `idx_approval_items_workflow` (`approval_workflow_id`),
  KEY `idx_approval_items_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `approval_items_ibfk_1` FOREIGN KEY (`approval_workflow_id`) REFERENCES `approval_workflows` (`approval_workflow_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `approval_items_ibfk_2` FOREIGN KEY (`approval_step_id`) REFERENCES `approval_steps` (`approval_step_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `approval_items_ibfk_3` FOREIGN KEY (`decided_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `approval_steps` */

DROP TABLE IF EXISTS `approval_steps`;

CREATE TABLE `approval_steps` (
  `approval_step_id` char(36) NOT NULL DEFAULT uuid(),
  `approval_workflow_id` char(36) NOT NULL,
  `step_order` int(11) NOT NULL,
  `approver_user_id` char(36) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `acted_at` datetime DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`approval_step_id`),
  UNIQUE KEY `uniq_workflow_step_order` (`approval_workflow_id`,`step_order`),
  KEY `idx_approval_step_approver` (`approver_user_id`),
  CONSTRAINT `approval_steps_ibfk_1` FOREIGN KEY (`approval_workflow_id`) REFERENCES `approval_workflows` (`approval_workflow_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `approval_steps_ibfk_2` FOREIGN KEY (`approver_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `approval_workflows` */

DROP TABLE IF EXISTS `approval_workflows`;

CREATE TABLE `approval_workflows` (
  `approval_workflow_id` char(36) NOT NULL DEFAULT uuid(),
  `entity_type` varchar(50) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `requested_by` char(36) NOT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `comments` text DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`approval_workflow_id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_approval_entity` (`entity_type`,`entity_id`),
  KEY `idx_approval_status` (`status`),
  CONSTRAINT `approval_workflows_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `approval_workflows_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `audit_events` */

DROP TABLE IF EXISTS `audit_events`;

CREATE TABLE `audit_events` (
  `event_id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) DEFAULT NULL,
  `survey_id` char(36) DEFAULT NULL,
  `action_plan_id` char(36) DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `event_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_details`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`event_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_survey` (`survey_id`),
  KEY `idx_audit_action_plan` (`action_plan_id`),
  CONSTRAINT `audit_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_events_ibfk_2` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_events_ibfk_3` FOREIGN KEY (`action_plan_id`) REFERENCES `action_plans` (`action_plan_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `audit_logs` */

DROP TABLE IF EXISTS `audit_logs`;

CREATE TABLE `audit_logs` (
  `audit_log_id` char(36) NOT NULL DEFAULT uuid(),
  `actor_user_id` char(36) DEFAULT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_log_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_actor` (`actor_user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `auth_tokens` */

DROP TABLE IF EXISTS `auth_tokens`;

CREATE TABLE `auth_tokens` (
  `auth_token_id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) NOT NULL,
  `token` varchar(512) NOT NULL,
  `token_type` varchar(30) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`auth_token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_auth_tokens_user_type` (`user_id`,`token_type`),
  CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `calendar_slots` */

DROP TABLE IF EXISTS `calendar_slots`;

CREATE TABLE `calendar_slots` (
  `calendar_slot_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`calendar_slot_id`),
  KEY `idx_calendar_slots_survey` (`survey_id`),
  CONSTRAINT `calendar_slots_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `enums` */

DROP TABLE IF EXISTS `enums`;

CREATE TABLE `enums` (
  `name` varchar(50) NOT NULL,
  `value` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `group_members` */

DROP TABLE IF EXISTS `group_members`;

CREATE TABLE `group_members` (
  `group_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `joined_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`group_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `groups` */

DROP TABLE IF EXISTS `groups`;

CREATE TABLE `groups` (
  `group_id` char(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `option_capacity` */

DROP TABLE IF EXISTS `option_capacity`;

CREATE TABLE `option_capacity` (
  `capacity_id` char(36) NOT NULL DEFAULT uuid(),
  `release_id` char(36) NOT NULL,
  `option_id` char(36) NOT NULL,
  `capacity_total` int(11) DEFAULT NULL,
  `waitlist_enabled` tinyint(1) DEFAULT 1,
  `hold_seconds` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`capacity_id`),
  UNIQUE KEY `uniq_capacity_release_option` (`release_id`,`option_id`),
  KEY `option_id` (`option_id`),
  CONSTRAINT `option_capacity_ibfk_1` FOREIGN KEY (`release_id`) REFERENCES `survey_releases` (`release_id`) ON DELETE CASCADE,
  CONSTRAINT `option_capacity_ibfk_2` FOREIGN KEY (`option_id`) REFERENCES `survey_options` (`option_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `option_quota_buckets` */

DROP TABLE IF EXISTS `option_quota_buckets`;

CREATE TABLE `option_quota_buckets` (
  `quota_id` char(36) NOT NULL DEFAULT uuid(),
  `capacity_id` char(36) NOT NULL,
  `bucket_key` varchar(100) DEFAULT NULL,
  `bucket_value` varchar(100) DEFAULT NULL,
  `quota_limit` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`quota_id`),
  UNIQUE KEY `uniq_quota_bucket` (`capacity_id`,`bucket_key`,`bucket_value`),
  CONSTRAINT `option_quota_buckets_ibfk_1` FOREIGN KEY (`capacity_id`) REFERENCES `option_capacity` (`capacity_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `permissions` */

DROP TABLE IF EXISTS `permissions`;

CREATE TABLE `permissions` (
  `permission_id` char(36) NOT NULL DEFAULT uuid(),
  `code` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

/*Table structure for table `relay_instances` */

DROP TABLE IF EXISTS `relay_instances`;

CREATE TABLE `relay_instances` (
  `relay_instance_id` char(36) NOT NULL DEFAULT uuid(),
  `relay_workflow_id` char(36) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `started_at` datetime DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`relay_instance_id`),
  KEY `idx_relay_instances_workflow` (`relay_workflow_id`),
  CONSTRAINT `relay_instances_ibfk_1` FOREIGN KEY (`relay_workflow_id`) REFERENCES `relay_workflows` (`relay_workflow_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `relay_stage_actions` */

DROP TABLE IF EXISTS `relay_stage_actions`;

CREATE TABLE `relay_stage_actions` (
  `relay_stage_action_id` char(36) NOT NULL DEFAULT uuid(),
  `relay_stage_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`relay_stage_action_id`),
  KEY `idx_relay_stage_actions_stage` (`relay_stage_id`),
  CONSTRAINT `relay_stage_actions_ibfk_1` FOREIGN KEY (`relay_stage_id`) REFERENCES `relay_stages` (`relay_stage_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `relay_stages` */

DROP TABLE IF EXISTS `relay_stages`;

CREATE TABLE `relay_stages` (
  `relay_stage_id` char(36) NOT NULL DEFAULT uuid(),
  `relay_workflow_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`relay_stage_id`),
  KEY `relay_workflow_id` (`relay_workflow_id`),
  CONSTRAINT `relay_stages_ibfk_1` FOREIGN KEY (`relay_workflow_id`) REFERENCES `relay_workflows` (`relay_workflow_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `relay_workflows` */

DROP TABLE IF EXISTS `relay_workflows`;

CREATE TABLE `relay_workflows` (
  `relay_workflow_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `description` text DEFAULT NULL,
  PRIMARY KEY (`relay_workflow_id`),
  KEY `survey_id` (`survey_id`),
  CONSTRAINT `relay_workflows_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `role_permissions` */

DROP TABLE IF EXISTS `role_permissions`;

CREATE TABLE `role_permissions` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_role_permission` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `role_id` char(36) NOT NULL DEFAULT uuid(),
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

/*Table structure for table `slot_bookings` */

DROP TABLE IF EXISTS `slot_bookings`;

CREATE TABLE `slot_bookings` (
  `slot_booking_id` char(36) NOT NULL DEFAULT uuid(),
  `calendar_slot_id` char(36) NOT NULL,
  `participant_id` char(36) NOT NULL,
  `booked_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`slot_booking_id`),
  KEY `participant_id` (`participant_id`),
  KEY `idx_slot_bookings_calendar_participant` (`calendar_slot_id`,`participant_id`),
  CONSTRAINT `slot_bookings_ibfk_1` FOREIGN KEY (`calendar_slot_id`) REFERENCES `calendar_slots` (`calendar_slot_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `slot_bookings_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `survey_participants` (`participant_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_answer_selections` */

DROP TABLE IF EXISTS `survey_answer_selections`;

CREATE TABLE `survey_answer_selections` (
  `selection_id` char(36) NOT NULL DEFAULT uuid(),
  `answer_id` char(36) NOT NULL,
  `question_option_id` char(36) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`selection_id`),
  KEY `idx_answer_selections_answer` (`answer_id`),
  KEY `idx_answer_selections_option` (`question_option_id`),
  CONSTRAINT `survey_answer_selections_ibfk_1` FOREIGN KEY (`answer_id`) REFERENCES `survey_answers` (`answer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `survey_answer_selections_ibfk_2` FOREIGN KEY (`question_option_id`) REFERENCES `survey_question_options` (`question_option_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_answers` */

DROP TABLE IF EXISTS `survey_answers`;

CREATE TABLE `survey_answers` (
  `answer_id` char(36) NOT NULL DEFAULT uuid(),
  `participation_id` char(36) NOT NULL,
  `field_key` varchar(100) NOT NULL,
  `value_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`value_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`answer_id`),
  KEY `idx_answers_participation` (`participation_id`),
  KEY `idx_answers_field` (`field_key`),
  CONSTRAINT `fk_answers_participation` FOREIGN KEY (`participation_id`) REFERENCES `survey_participation` (`participation_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_options` */

DROP TABLE IF EXISTS `survey_options`;

CREATE TABLE `survey_options` (
  `option_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `parent_option_id` char(36) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `option_meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_meta`)),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `survey_options_survey_id_code` (`survey_id`,`code`),
  KEY `idx_survey_options_order` (`survey_id`,`sort_order`),
  KEY `idx_survey_options_parent` (`parent_option_id`),
  CONSTRAINT `survey_options_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE,
  CONSTRAINT `survey_options_ibfk_2` FOREIGN KEY (`parent_option_id`) REFERENCES `survey_options` (`option_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_participants` */

DROP TABLE IF EXISTS `survey_participants`;

CREATE TABLE `survey_participants` (
  `participant_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `external_ref` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'INVITED',
  `invited_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`meta`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`participant_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_participant_user` (`survey_id`,`user_id`),
  CONSTRAINT `survey_participants_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `survey_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_participation` */

DROP TABLE IF EXISTS `survey_participation`;

CREATE TABLE `survey_participation` (
  `participation_id` char(36) NOT NULL DEFAULT uuid(),
  `release_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `status` varchar(30) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`participation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_question_options` */

DROP TABLE IF EXISTS `survey_question_options`;

CREATE TABLE `survey_question_options` (
  `question_option_id` char(36) NOT NULL DEFAULT uuid(),
  `question_id` char(36) NOT NULL,
  `option_text` varchar(255) NOT NULL,
  `value` varchar(100) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`meta`)),
  PRIMARY KEY (`question_option_id`),
  KEY `idx_question_options_order` (`question_id`,`sort_order`),
  CONSTRAINT `fk_question_options_question` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_questions` */

DROP TABLE IF EXISTS `survey_questions`;

CREATE TABLE `survey_questions` (
  `question_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `question_type` varchar(30) NOT NULL,
  `question_text` text NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`question_id`),
  KEY `idx_questions_order` (`survey_id`,`sort_order`),
  CONSTRAINT `fk_questions_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_release_audience` */

DROP TABLE IF EXISTS `survey_release_audience`;

CREATE TABLE `survey_release_audience` (
  `release_audience_id` char(36) NOT NULL DEFAULT uuid(),
  `release_id` char(36) NOT NULL,
  `audience_type` varchar(20) NOT NULL,
  `ref_id` char(36) DEFAULT NULL,
  `filter_expr` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filter_expr`)),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`release_audience_id`),
  KEY `idx_release_audience` (`release_id`),
  KEY `idx_release_audience_type` (`audience_type`,`ref_id`),
  CONSTRAINT `survey_release_audience_ibfk_1` FOREIGN KEY (`release_id`) REFERENCES `survey_releases` (`release_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_releases` */

DROP TABLE IF EXISTS `survey_releases`;

CREATE TABLE `survey_releases` (
  `release_id` char(36) NOT NULL DEFAULT uuid(),
  `survey_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phase` int(11) DEFAULT NULL,
  `opens_at` datetime DEFAULT NULL,
  `closes_at` datetime DEFAULT NULL,
  `is_frozen` tinyint(1) DEFAULT 0,
  `release_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`release_config`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`release_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_survey_releases_time` (`survey_id`,`opens_at`),
  KEY `idx_survey_releases_frozen` (`is_frozen`),
  CONSTRAINT `survey_releases_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `survey_releases_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `survey_sessions` */

DROP TABLE IF EXISTS `survey_sessions`;

CREATE TABLE `survey_sessions` (
  `session_id` char(36) NOT NULL DEFAULT uuid(),
  `participant_id` char(36) NOT NULL,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_activity_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`session_data`)),
  PRIMARY KEY (`session_id`),
  KEY `idx_session_participant` (`participant_id`),
  CONSTRAINT `fk_sessions_participant` FOREIGN KEY (`participant_id`) REFERENCES `survey_participants` (`participant_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `surveys` */

DROP TABLE IF EXISTS `surveys`;

CREATE TABLE `surveys` (
  `survey_id` char(36) NOT NULL DEFAULT uuid(),
  `code` varchar(255) NOT NULL,
  `title` text NOT NULL,
  `type` enum('PICK_N','PRIORITY','WORKFLOW_RELAY','CALENDAR_SLOT','ACTION_PLAN','VERIFICATION','AUTH') NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `dsl_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dsl_rules`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`survey_id`),
  UNIQUE KEY `code` (`code`),
  KEY `created_by` (`created_by`),
  KEY `idx_surveys_type_status` (`type`,`status`),
  CONSTRAINT `surveys_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `user_roles` */

DROP TABLE IF EXISTS `user_roles`;

CREATE TABLE `user_roles` (
  `user_role_id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) NOT NULL,
  `role` varchar(50) NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `uniq_user_role` (`user_id`,`role`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','FROZEN') DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
