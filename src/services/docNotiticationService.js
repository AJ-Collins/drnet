const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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
    /**
     * Send a document review reminder email with attachments
     * @param {string} recipient 
     * @param {string} mainDocumentName
     * @param {number} totalAttachments 
     * @param {string} message 
     * @param {Array} attachments
     * @param {string} [senderName='HR']
     */
    sendEmail: async (recipient, mainDocumentName, totalAttachments = 1, message = '', attachments = [], senderName = 'HR') => {
        const hasAdditionalAttachments = totalAttachments > 1;
        
        const emailMessage = message || `Please review the attached document: "${mainDocumentName}"`;

        const logoPath = path.join(process.cwd(), 'frontend', 'assets', 'images', 'logo_image_1.jpg');
        
        const mailOptions = {
            from: '"DR.Net Labs - Report" <info@drnet.co.ke>',
            to: recipient,
            subject: 'Report Review',
            html: `
                <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px;">
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
                        <!-- Logo -->
                        <div style="text-align: center; margin-bottom: 24px;">
                            <img src="cid:company-logo@drnet" alt="DR.Net Labs Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
                        </div>
                        
                        <h2 style="color: #0d9488; font-size: 20px; margin-top: 0;">Reports Review</h2>
                        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                            Dear Sir/Madam,
                        </p>
                        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                            ${emailMessage}
                        </p>
                        ${hasAdditionalAttachments ? `
                        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                            <strong>Main Document:</strong> ${mainDocumentName}<br>
                            <strong>Total Attachments:</strong> ${totalAttachments}
                        </p>` : ''}
                        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                            Best regards,<br>
                            <strong>${senderName}</strong>
                        </p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                        <p style="color: #64748b; font-size: 12px; text-align: center;">
                            This is an automated reminder from DR.Net Labs • Do not reply directly to this email
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'logo.jpg',
                    path: logoPath,
                    cid: 'company-logo@drnet'
                },
                ...attachments
            ]
        };

        return await transporter.sendMail(mailOptions);
    }
};

module.exports = mailNotificationService;