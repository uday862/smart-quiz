const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const testEmail = async () => {
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP Port:', process.env.SMTP_PORT);
    console.log('SMTP User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: String(process.env.SMTP_PORT || '').trim() === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: process.env.SMTP_FROM || `"Smart Quiz Admin" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        subject: 'Smart Quiz SMTP Connection Test',
        text: 'This email confirms that your Gmail App Password and SMTP connection are configured correctly!'
    };

    try {
        console.log('Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Test email sent successfully!');
        console.log('SMTP Response:', info.response);
        process.exit(0);
    } catch (error) {
        console.error('✗ Failed to send email:', error.message || error);
        process.exit(1);
    }
};

testEmail();
