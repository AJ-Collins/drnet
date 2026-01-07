const nodemailer = require('nodemailer');

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
    sendEmail: async (recipient, subject, bodyContent) => {
        const mailOptions = {
            from: '"DR.Net Labs - HR Assistant" <info@drnet.co.ke>',
            to: recipient,
            subject: subject,
            html: `
                <div style="font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0d9488; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Executive Communication</h1>
                    </div>
                    <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
                        <div style="white-space: pre-wrap; font-size: 15px;">${bodyContent}</div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">
                            This is an official communication dispatched via DR.Net Labs HR Portal.
                        </p>
                        <a href="https://drnet.co.ke" style="color: #0d9488; text-decoration: none; font-size: 12px; font-weight: bold;">Visit Portal</a>
                    </div>
                </div>
            `
        };
        return await transporter.sendMail(mailOptions);
    }
};

module.exports = mailNotificationService;