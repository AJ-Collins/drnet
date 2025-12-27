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

exports.sendProjectEmail = async (recipient, customMessage, projectData) => {
    
    const formatMoney = (amount) => `Ksh ${Number(amount).toLocaleString()}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #0d9488; padding: 20px; color: white;">
                <h2 style="margin: 0;">Project Dispatch: ${projectData.name}</h2>
            </div>
            
            <div style="padding: 20px; background-color: #f8fafc;">
                <p style="font-size: 16px; color: #334155;"><strong>Message:</strong><br>${customMessage} For more details visit <a href="https://drnet.co.ke/login">Dr.Net Labs</a></p>
                
                <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;">
                
                <h3 style="color: #0f172a;">Project Snapshot</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Budget Status:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${formatMoney(projectData.spent)} / ${formatMoney(projectData.budget)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Progress:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${projectData.progress}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Deadline:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${projectData.deadline}</td>
                    </tr>
                </table>

                <h3 style="color: #0f172a; margin-top: 20px;">Logistics Status</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: #fff; border: 1px solid #e2e8f0;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px;">Transport</td>
                        <td style="padding: 10px; font-weight: bold; color: #0d9488;">${projectData.logistics?.transport || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px;">Accommodation</td>
                        <td style="padding: 10px; font-weight: bold; color: #0d9488;">${projectData.logistics?.accommodation || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;">Delivery Stage</td>
                        <td style="padding: 10px; font-weight: bold; color: #0d9488;">${projectData.logistics?.deliveryStatus || 'N/A'}</td>
                    </tr>
                </table>
            </div>
            
            <div style="padding: 15px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                This is an automated reminder from DR.Net Labs • Do not reply directly
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: `Project Update: ${projectData.name}`,
        html: htmlContent
    };

    return await transporter.sendMail(mailOptions);
};

// --- WHATSAPP HANDLER ---
exports.sendProjectWhatsApp = async (recipient, customMessage, projectData) => {
    // Note: You need a provider like Twilio, Meta Cloud API, or a local WhatsApp bot session
    // This is a generic implementation logic.
    
    const textBody = 
`*PROJECT UPDATE: ${projectData.name}*
------------------
${customMessage}
------------------
*STATS:*
Progress: ${projectData.progress}%
Spent: Ksh ${projectData.spent}
Deadline: ${projectData.deadline}

*LOGISTICS:*
Transport: ${projectData.logistics?.transport}
Accom: ${projectData.logistics?.accommodation}
Status: ${projectData.logistics?.deliveryStatus}
`;

    // Assuming you have a specific whatsapp sender function already in your other service
    // If not, you would use Twilio client here. 
    // For now, I will return the textBody so the controller can pass it to your existing generic sender
    // OR we implement a basic console log if no provider is configured yet.
    
    console.log(`[WHATSAPP MOCK] To: ${recipient} | Body: ${textBody}`);
    
    // If you have the whatsappNotificationService, you can import and use it here:
    // const whatsappService = require('./whatsappNotificationService');
    // await whatsappService.sendMessage(recipient, textBody);
    
    return true; 
};