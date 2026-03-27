'use strict';

const db = require('../models');
const { sendMail } = require('./mailer');
const { resolveUserRoles } = require('./authRoles');

function parseJsonSafe(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (_err) {
        return fallback;
    }
}

function formatDeadline(deadline) {
    if (!deadline) return 'the upcoming deadline';
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return 'the upcoming deadline';
    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function buildReminderMailPayload({ user, release, body, deadlineText, portalUrl }) {
    const subject = 'Reminder: Complete survey before deadline';
    const text = [
        `Hello ${user.name || 'User'},`,
        '',
        `You have a pending survey: ${release.survey_title}`,
        `Release: ${release.name}`,
        `Deadline: ${deadlineText}`,
        '',
        body,
        '',
        `Open portal: ${portalUrl}`,
    ].join('\n');

    const html = `
            <p>Hello ${user.name || 'User'},</p>
            <p>You have a pending survey: <strong>${release.survey_title}</strong>.</p>
            <p><strong>Release:</strong> ${release.name}<br/>
            <strong>Deadline:</strong> ${deadlineText}</p>
            <p>${body}</p>
            <p><a href="${portalUrl}">Open Survey Portal</a></p>
        `;

    return { subject, text, html };
}

async function resolveActiveUsersByIds(userIds = []) {
    const normalized = Array.from(new Set(
        (Array.isArray(userIds) ? userIds : [])
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
    ));

    if (!normalized.length) return [];

    const [userRows] = await db.sequelize.query(
        `SELECT user_id, name, email
         FROM users
         WHERE user_id IN (:userIds)
           AND (is_active = 1 OR is_active IS NULL)
         ORDER BY user_id ASC`,
        { replacements: { userIds: normalized } }
    );

    return userRows || [];
}

async function resolveResponsibleApproverIds(candidateIds = []) {
    const normalized = Array.from(new Set(
        (Array.isArray(candidateIds) ? candidateIds : [])
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
    ));

    if (!normalized.length) return [];

    const approverIds = [];
    for (const userId of normalized) {
        const roles = await resolveUserRoles(userId);
        if (Array.isArray(roles) && (roles.includes('APPROVER') || roles.includes('ADMIN'))) {
            approverIds.push(userId);
        }
    }

    return approverIds;
}

async function resolveTargetUsersForRelease(surveyId, releaseId) {
    const [releaseRows] = await db.sequelize.query(
        `SELECT
            sr.release_id,
            sr.name,
            sr.closes_at,
            sr.created_by AS release_created_by,
            s.title AS survey_title,
            s.config AS survey_config,
            s.created_by AS survey_created_by
     FROM survey_releases sr
     INNER JOIN surveys s ON s.survey_id = sr.survey_id
     WHERE sr.release_id = :releaseId AND sr.survey_id = :surveyId
     LIMIT 1`,
        { replacements: { surveyId, releaseId } }
    );

    const release = releaseRows && releaseRows[0] ? releaseRows[0] : null;
    if (!release) {
        const err = new Error('Release not found for this survey');
        err.statusCode = 404;
        throw err;
    }

    const [audienceRows] = await db.sequelize.query(
        `SELECT audience_type, ref_id
     FROM survey_release_audience
     WHERE release_id = :releaseId`,
        { replacements: { releaseId } }
    );

    const groupIds = [];
    const explicitUserIds = [];

    for (const row of audienceRows || []) {
        const refId = Number(row.ref_id);
        if (!Number.isInteger(refId) || refId <= 0) continue;

        if (String(row.audience_type || '').toUpperCase() === 'GROUP') {
            groupIds.push(refId);
        } else if (String(row.audience_type || '').toUpperCase() === 'USER') {
            explicitUserIds.push(refId);
        }
    }

    const targetUserIds = new Set();

    if (groupIds.length) {
        const [groupUserRows] = await db.sequelize.query(
            `SELECT DISTINCT gm.user_id
       FROM group_members gm
       INNER JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id IN (:groupIds)
         AND (u.is_active = 1 OR u.is_active IS NULL)`,
            { replacements: { groupIds } }
        );

        for (const row of groupUserRows || []) {
            const userId = Number(row.user_id);
            if (Number.isInteger(userId) && userId > 0) targetUserIds.add(userId);
        }
    }

    for (const userId of explicitUserIds) {
        targetUserIds.add(userId);
    }

    if (!targetUserIds.size) {
        const surveyConfig = parseJsonSafe(release.survey_config, {});
        const fallbackGroupIds = Array.isArray(surveyConfig.targetGroupIds)
            ? surveyConfig.targetGroupIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
            : [];
        const fallbackUserIds = Array.isArray(surveyConfig.targetUserIds)
            ? surveyConfig.targetUserIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
            : [];

        if (fallbackGroupIds.length) {
            const [groupUserRows] = await db.sequelize.query(
                `SELECT DISTINCT gm.user_id
         FROM group_members gm
         INNER JOIN users u ON u.user_id = gm.user_id
         WHERE gm.group_id IN (:groupIds)
           AND (u.is_active = 1 OR u.is_active IS NULL)`,
                { replacements: { groupIds: fallbackGroupIds } }
            );

            for (const row of groupUserRows || []) {
                const userId = Number(row.user_id);
                if (Number.isInteger(userId) && userId > 0) targetUserIds.add(userId);
            }
        }

        for (const userId of fallbackUserIds) {
            targetUserIds.add(userId);
        }
    }

    const approverIds = await resolveResponsibleApproverIds([
        release.survey_created_by,
        release.release_created_by,
    ]);
    for (const approverId of approverIds) {
        targetUserIds.add(approverId);
    }

    if (!targetUserIds.size) {
        return {
            release,
            users: [],
        };
    }

    const userRows = await resolveActiveUsersByIds(Array.from(targetUserIds));

    return {
        release,
        users: userRows || [],
    };
}

async function resolveUsersByTargeting({ targetGroupIds, targetUserIds }) {
    const groupIds = Array.isArray(targetGroupIds)
        ? targetGroupIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
        : [];
    const explicitUserIds = Array.isArray(targetUserIds)
        ? targetUserIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
        : [];

    const resolvedUserIds = new Set();

    if (groupIds.length) {
        const [groupUserRows] = await db.sequelize.query(
            `SELECT DISTINCT gm.user_id
       FROM group_members gm
       INNER JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id IN (:groupIds)
         AND (u.is_active = 1 OR u.is_active IS NULL)`,
            { replacements: { groupIds } }
        );

        for (const row of groupUserRows || []) {
            const userId = Number(row.user_id);
            if (Number.isInteger(userId) && userId > 0) {
                resolvedUserIds.add(userId);
            }
        }
    }

    for (const userId of explicitUserIds) {
        resolvedUserIds.add(userId);
    }

    if (!resolvedUserIds.size) {
        return [];
    }

    return resolveActiveUsersByIds(Array.from(resolvedUserIds));
}

async function sendSurveyDeadlineReminder({ surveyId, releaseId, actorUserId, customMessage }) {
    const { release, users } = await resolveTargetUsersForRelease(surveyId, releaseId);

    if (!users.length) {
        return {
            release_id: releaseId,
            survey_id: surveyId,
            recipients: 0,
            portal_notifications_created: 0,
            emails_sent: 0,
            emails_skipped: 0,
            message: 'No target users found for this release',
        };
    }

    const deadlineText = formatDeadline(release.closes_at);
    const title = `Survey reminder: ${release.survey_title}`;
    const body = customMessage || `Please complete "${release.survey_title}" before ${deadlineText}.`;

    let portalNotificationsCreated = 0;
    try {
        await db.UserNotification.bulkCreate(
            users.map((user) => ({
                user_id: user.user_id,
                notification_type: 'SURVEY_DEADLINE_REMINDER',
                title,
                message: body,
                is_read: false,
                read_at: null,
                meta: {
                    survey_id: surveyId,
                    release_id: releaseId,
                    release_name: release.name,
                    closes_at: release.closes_at,
                    created_by: actorUserId || null,
                },
                created_at: new Date(),
                updated_at: new Date(),
            }))
        );
        portalNotificationsCreated = users.length;
    } catch (error) {
        // Continue sending email even if portal notifications table is not ready.
        portalNotificationsCreated = 0;
        console.error('[surveyNotificationService] portal notification insert failed', error && (error.message || error));
    }

    const portalUrl = `${process.env.PORTAL_BASE_URL || 'http://localhost:5173'}/student/surveys`;
    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const user of users) {
        if (!user.email) {
            emailsSkipped += 1;
            continue;
        }

        const { subject, text, html } = buildReminderMailPayload({
            user,
            release,
            body,
            deadlineText,
            portalUrl,
        });

        const result = await sendMail({
            to: user.email,
            subject,
            text,
            html,
        });

        if (result.sent) {
            emailsSent += 1;
        } else {
            emailsSkipped += 1;
        }
    }

    return {
        release_id: releaseId,
        survey_id: surveyId,
        recipients: users.length,
        portal_notifications_created: portalNotificationsCreated,
        emails_sent: emailsSent,
        emails_skipped: emailsSkipped,
        deadline: release.closes_at,
    };
}

async function sendSurveyDeadlineEmailReminder({ surveyId, releaseId, customMessage }) {
    const { release, users } = await resolveTargetUsersForRelease(surveyId, releaseId);
    const deadlineText = formatDeadline(release.closes_at);
    const body = customMessage || `Please complete "${release.survey_title}" before ${deadlineText}.`;
    const portalUrl = `${process.env.PORTAL_BASE_URL || 'http://localhost:5173'}/student/surveys`;

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const user of users) {
        if (!user.email) {
            emailsSkipped += 1;
            continue;
        }

        const { subject, text, html } = buildReminderMailPayload({
            user,
            release,
            body,
            deadlineText,
            portalUrl,
        });

        const result = await sendMail({
            to: user.email,
            subject,
            text,
            html,
        });

        if (result.sent) {
            emailsSent += 1;
        } else {
            emailsSkipped += 1;
        }
    }

    return {
        release_id: releaseId,
        survey_id: surveyId,
        recipients: users.length,
        emails_sent: emailsSent,
        emails_skipped: emailsSkipped,
        deadline: release.closes_at,
    };
}

async function sendSurveyCreationNotification({ surveyId, surveyTitle, actorUserId, targetGroupIds, targetUserIds }) {
    const users = await resolveUsersByTargeting({ targetGroupIds, targetUserIds });

    const [surveyRows] = await db.sequelize.query(
        'SELECT created_by FROM surveys WHERE survey_id = :surveyId LIMIT 1',
        { replacements: { surveyId } }
    );
    const surveyOwnerId = surveyRows && surveyRows[0] ? Number(surveyRows[0].created_by) : null;

    const responsibleApproverIds = await resolveResponsibleApproverIds([
        actorUserId,
        surveyOwnerId,
    ]);
    const approverUsers = await resolveActiveUsersByIds(responsibleApproverIds);

    const dedupMap = new Map();
    for (const user of [...users, ...approverUsers]) {
        if (!user || !Number.isInteger(Number(user.user_id))) continue;
        dedupMap.set(Number(user.user_id), user);
    }
    const recipients = Array.from(dedupMap.values());

    if (!recipients.length) {
        return {
            survey_id: surveyId,
            recipients: 0,
            portal_notifications_created: 0,
            emails_sent: 0,
            emails_skipped: 0,
            message: 'No target users found for this survey',
        };
    }

    const title = `New survey assigned: ${surveyTitle}`;
    const body = `A new survey \"${surveyTitle}\" has been created for you. Please check the portal and submit your response.`;

    let portalNotificationsCreated = 0;
    try {
        await db.UserNotification.bulkCreate(
            recipients.map((user) => ({
                user_id: user.user_id,
                notification_type: 'SURVEY_CREATED',
                title,
                message: body,
                is_read: false,
                read_at: null,
                meta: {
                    survey_id: surveyId,
                    created_by: actorUserId || null,
                    source: 'survey_creation',
                },
                created_at: new Date(),
                updated_at: new Date(),
            }))
        );
        portalNotificationsCreated = recipients.length;
    } catch (error) {
        portalNotificationsCreated = 0;
        console.error('[surveyNotificationService] survey creation portal notification insert failed', error && (error.message || error));
    }

    const portalUrl = `${process.env.PORTAL_BASE_URL || 'http://localhost:5173'}/student/surveys`;
    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const user of recipients) {
        if (!user.email) {
            emailsSkipped += 1;
            continue;
        }

        const subject = `New survey assigned: ${surveyTitle}`;
        const text = [
            `Hello ${user.name || 'User'},`,
            '',
            `A new survey has been assigned to you: ${surveyTitle}`,
            'Please submit your response from the portal.',
            '',
            `Open portal: ${portalUrl}`,
        ].join('\n');

        const html = `
            <p>Hello ${user.name || 'User'},</p>
            <p>A new survey has been assigned to you: <strong>${surveyTitle}</strong>.</p>
            <p>Please submit your response from the portal.</p>
            <p><a href="${portalUrl}">Open Survey Portal</a></p>
        `;

        const result = await sendMail({
            to: user.email,
            subject,
            text,
            html,
        });

        if (result.sent) {
            emailsSent += 1;
        } else {
            emailsSkipped += 1;
        }
    }

    return {
        survey_id: surveyId,
        recipients: recipients.length,
        portal_notifications_created: portalNotificationsCreated,
        emails_sent: emailsSent,
        emails_skipped: emailsSkipped,
    };
}

module.exports = {
    sendSurveyDeadlineReminder,
    sendSurveyDeadlineEmailReminder,
    sendSurveyCreationNotification,
};
