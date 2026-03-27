'use strict';

const db = require('../models');
const { sendSurveyDeadlineEmailReminder } = require('./surveyNotificationService');

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const SLOT_WINDOW_MS = 20 * 60 * 1000;

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
        subject: String(source.subject || '').trim(),
        body: String(source.body || '').trim(),
    };
}

function toDateOnlyKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function buildDeadlineSlots(closesAt) {
    const deadline = new Date(closesAt);
    if (Number.isNaN(deadline.getTime())) return [];

    const morning = new Date(deadline);
    morning.setHours(9, 0, 0, 0);

    const afternoon = new Date(deadline);
    afternoon.setHours(13, 0, 0, 0);

    const evening = new Date(deadline.getTime() - 60 * 60 * 1000);

    return [
        { key: 'morning', at: morning, label: 'Morning reminder' },
        { key: 'afternoon', at: afternoon, label: 'Afternoon reminder' },
        { key: 'evening', at: evening, label: 'Final reminder before deadline' },
    ].filter((slot) => slot.at.getTime() < deadline.getTime());
}

function shouldSendNow(now, slotTime) {
    const diff = now.getTime() - slotTime.getTime();
    return diff >= 0 && diff <= SLOT_WINDOW_MS;
}

async function markSlotSent(releaseId, releaseConfig, dateKey, slotKey, status) {
    const nextConfig = {
        ...(releaseConfig || {}),
        deadlineReminderLog: {
            ...((releaseConfig && releaseConfig.deadlineReminderLog) || {}),
            [dateKey]: {
                ...(((releaseConfig && releaseConfig.deadlineReminderLog) || {})[dateKey] || {}),
                [slotKey]: {
                    sent_at: new Date().toISOString(),
                    ...status,
                },
            },
        },
    };

    await db.sequelize.query(
        'UPDATE survey_releases SET release_config = :releaseConfig, updated_at = NOW() WHERE release_id = :releaseId',
        {
            replacements: {
                releaseId,
                releaseConfig: JSON.stringify(nextConfig),
            },
        }
    );

    return nextConfig;
}

async function processDeadlineRemindersTick() {
    const now = new Date();

    const [releaseRows] = await db.sequelize.query(
        `SELECT sr.release_id, sr.survey_id, sr.name, sr.closes_at, sr.release_config, s.config AS survey_config
     FROM survey_releases sr
      INNER JOIN surveys s ON s.survey_id = sr.survey_id
     WHERE sr.closes_at IS NOT NULL
       AND (sr.is_frozen = 0 OR sr.is_frozen IS NULL)
       AND sr.closes_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
       AND sr.closes_at <= DATE_ADD(NOW(), INTERVAL 1 DAY)`
    );

    for (const release of releaseRows || []) {
        const closesAt = release.closes_at ? new Date(release.closes_at) : null;
        if (!closesAt || Number.isNaN(closesAt.getTime())) continue;

        const dateKey = toDateOnlyKey(closesAt);
        let releaseConfig = parseJsonSafe(release.release_config, {});
        const surveyConfig = parseJsonSafe(release.survey_config, {});
        const mailDraft = normalizeMailDraft(surveyConfig.mailDraft);
        const reminderLog = (releaseConfig.deadlineReminderLog || {})[dateKey] || {};

        for (const slot of buildDeadlineSlots(closesAt)) {
            if (reminderLog[slot.key] && reminderLog[slot.key].sent_at) continue;
            if (!shouldSendNow(now, slot.at)) continue;

            const message = mailDraft.body || `${slot.label}: please complete your pending survey before the deadline.`;
            try {
                const result = await sendSurveyDeadlineEmailReminder({
                    surveyId: Number(release.survey_id),
                    releaseId: Number(release.release_id),
                    customSubject: mailDraft.subject || null,
                    customMessage: message,
                });

                releaseConfig = await markSlotSent(release.release_id, releaseConfig, dateKey, slot.key, {
                    emails_sent: Number(result.emails_sent || 0),
                    emails_skipped: Number(result.emails_skipped || 0),
                });
            } catch (error) {
                releaseConfig = await markSlotSent(release.release_id, releaseConfig, dateKey, slot.key, {
                    error: error && error.message ? error.message : 'Reminder send failed',
                });
            }
        }
    }
}

function startDeadlineReminderScheduler() {
    if (String(process.env.ENABLE_DEADLINE_REMINDER_SCHEDULER || 'true').toLowerCase() === 'false') {
        return null;
    }

    const timer = setInterval(() => {
        processDeadlineRemindersTick().catch((err) => {
            console.error('[deadline-reminder-scheduler] tick failed', err && (err.stack || err.message || err));
        });
    }, CHECK_INTERVAL_MS);

    processDeadlineRemindersTick().catch((err) => {
        console.error('[deadline-reminder-scheduler] initial tick failed', err && (err.stack || err.message || err));
    });

    return timer;
}

module.exports = {
    startDeadlineReminderScheduler,
};
