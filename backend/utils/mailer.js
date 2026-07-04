const nodemailer = require('nodemailer');

/**
 * Robust mail sender helper that supports Resend HTTPS API (default if key present)
 * and falls back to standard SMTP if not.
 */
const sendEmail = async ({ to, subject, html, text }) => {
    if (process.env.RESEND_API_KEY) {
        // Resend onboarding requires 'onboarding@resend.dev' if domain is not configured.
        // If domain is configured, SMTP_FROM should be set.
        let from = process.env.SMTP_FROM || 'onboarding@resend.dev';
        if (from.includes('<') && from.includes('>')) {
            // Extract email address for Resend compatibility
            const match = from.match(/<([^>]+)>/);
            if (match) {
                from = match[1];
            }
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from,
                to,
                subject,
                html,
                text
            })
        });

        const resData = await response.json();
        if (!response.ok) {
            throw new Error(resData.message || 'Resend API error');
        }
        return resData;
    } else {
        // Fallback to SMTP
        const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        if (!hasSMTP) {
            throw new Error('Neither Resend API Key nor SMTP configurations are set.');
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: String(process.env.SMTP_PORT || '').trim() === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        return await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Smart Quiz Admin" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text
        });
    }
};

module.exports = { sendEmail };
