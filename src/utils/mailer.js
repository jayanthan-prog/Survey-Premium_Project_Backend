'use strict';

const nodemailer = require('nodemailer');

let transporter;

function toBool(value) {
    return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function getTransporter() {
    if (transporter) return transporter;

    const smtpUrl = process.env.SMTP_URL;
    if (smtpUrl) {
        transporter = nodemailer.createTransport(smtpUrl);
        return transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    if (!host || !Number.isFinite(port)) return null;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: toBool(process.env.SMTP_SECURE),
        auth: user ? { user, pass: pass || '' } : undefined,
    });

    return transporter;
}

function getSender() {
    return process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@survey.local';
}

async function sendMail({ to, subject, text, html }) {
    const mailer = getTransporter();
    if (!mailer) {
        return { sent: false, reason: 'MAIL_NOT_CONFIGURED' };
    }

    try {
        const info = await mailer.sendMail({
            from: getSender(),
            to,
            subject,
            text,
            html,
        });

        return {
            sent: true,
            messageId: info && info.messageId ? info.messageId : null,
        };
    } catch (error) {
        return {
            sent: false,
            reason: 'MAIL_SEND_FAILED',
            error: error && error.message ? error.message : 'Unknown email send failure',
        };
    }
}

module.exports = {
    sendMail,
};
