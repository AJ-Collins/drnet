const nodemailer = require('nodemailer');

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailNotificationService = {
    sendEmail: async (recipient, taskTitle) => {
        const mailOptions = {
            from: '"DR.Net Labs - Reminder" <your-email@gmail.com>',
            to: recipient,
            subject: `Reminders - HR- Assistant: ${taskTitle}`,
            html: `
                <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #0d9488;">Task Reminder</h2>
                    <p>This is a reminder regarding the operation task: <strong>${taskTitle}</strong>.</p>
                    <p>Please log in to <a href="https://drnet.co.ke/login">Dr.Net Labs</a> portal for details.</p>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <small style="color: #64748b;">Automated mail. Do not reply</small>
                </div>
            `
        };
        return await transporter.sendMail(mailOptions);
    }
};

module.exports = mailNotificationService;