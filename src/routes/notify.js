const express = require('express');
const router = express.Router();
const mailNotificationService = require('../services/mailNotificationService');
const whatsappNotificationService = require('../services/whatsappNotitificationService');
const db = require('../config/db'); 
const Folders = require('../models/Folders');
const docNotificationService = require('../services/docNotiticationService');
const path = require('path');
const projectNotificationService = require('../services/projectNotificationService');

router.post('/notify', async (req, res) => {
    const { taskId, channel, recipient } = req.body;

    try {
        // 1. Get Task details from DB for the message body
        const [rows] = await db.query('SELECT title FROM tasks WHERE id = ?', [taskId]);
        if (rows.length === 0) return res.status(404).json({ message: "Task not found" });
        
        const taskTitle = rows[0].title;

        // 2. Dispatch based on channel
        if (channel === 'email') {
            await mailNotificationService.sendEmail(recipient, taskTitle);
        } else if (channel === 'whatsapp') {
            await whatsappNotificationService.sendWhatsApp(recipient, taskTitle);
        }

        // 3. Log the reminder as a comment in the system automatically
        const logText = `Sent ${channel} reminder to ${recipient}`;
        await db.query(
            'INSERT INTO comments (task_id, text, time_sent) VALUES (?, ?, NOW())', 
            [taskId, logText]
        );

        res.json({ success: true, message: "Reminder dispatched and logged." });
    } catch (error) {
        console.error("Notify Route Error:", error);
        res.status(500).json({ message: error.message });
    }
});

//Documents reports
router.post('/doc/notify', async (req, res) => {
    try {
        const {
            recipient,
            message = '',
            attachments = [],
            channel,
            context_document_id 
        } = req.body;

        // Validation
        if (!recipient || !message) {
            return res.status(400).json({
                error: 'Recipient and message are required'
            });
        }

        if (channel !== 'email') {
            return res.status(400).json({
                error: 'Only email channel is currently supported'
            });
        }

        const additionalDocIds = Array.isArray(attachments) ? attachments.map(String) : [];

        let allDocIds = [...additionalDocIds];

        let mainDoc = null;
        if (context_document_id !== undefined && context_document_id !== null) {
            const mainDocId = String(context_document_id);
            if (!allDocIds.includes(mainDocId)) {
                allDocIds.push(mainDocId);
            }
        }

        if (allDocIds.length === 0) {
            await docNotificationService.sendEmail(
                recipient,
                'No Document Attached',
                0,
                message,
                [],
                'HR'
            );

            return res.json({
                success: true,
                message: 'Text-only reminder email sent successfully',
                note: 'No documents were attached'
            });
        }

        const validIds = allDocIds.filter(id => id !== undefined && id !== null && id !== '');
        const fetchPromises = validIds.map(id => Folders.getDocumentById(id));
        const docs = await Promise.all(fetchPromises);
        const validDocs = docs.filter(doc => doc !== null);

        if (validDocs.length === 0) {
            return res.status(404).json({ error: 'No valid documents found' });
        }

        if (context_document_id) {
            mainDoc = validDocs.find(doc => String(doc.id) === String(context_document_id));
        }
        if (!mainDoc && validDocs.length > 0) {
            mainDoc = validDocs[0];
        }

        const uploadsDir = path.join(process.cwd(), 'uploads');

        const emailAttachments = validDocs
            .filter(doc => doc.file_path && typeof doc.file_path === 'string')
            .map(doc => ({
                filename: doc.name || `document_${doc.id}.pdf`,
                path: path.join(uploadsDir, doc.file_path.trim()),
                contentType: 'application/pdf'
            }));

        const totalAttachments = emailAttachments.length;

        await docNotificationService.sendEmail(
            recipient,
            mainDoc?.name || 'Document Reminder',
            totalAttachments,
            message,
            emailAttachments,
            'HR'
        );

        res.status(200).json({
            success: true,
            message: 'Reminder email sent successfully',
            recipient,
            main_document: mainDoc?.name || 'N/A',
            total_attachments: totalAttachments
        });

    } catch (error) {
        console.error('Error in /doc/notify:', error);
        res.status(500).json({
            error: 'Failed to send reminder email',
            details: error.message
        });
    }
});

router.post('/proj/notify', async (req, res) => {
    const { channel, recipient, message, context } = req.body;

    try {
        if (!recipient || !message) {
            return res.status(400).json({ error: "Recipient and message are required." });
        }
        let projectData = {};
        
        if (context && context.data) {
            projectData = context.data;
        } else {
            projectData = req.body; 
        }

        if (channel === 'email') {
            await projectNotificationService.sendProjectEmail(recipient, message, projectData);
        } 
        else if (channel === 'whatsapp') {
            await projectNotificationService.sendProjectWhatsApp(recipient, message, projectData);
        
        }
        else {
            return res.status(400).json({ error: "Invalid channel selected." });
        }

        // Log to DB
        // await db.query('INSERT INTO logs (action, recipient, time) VALUES (?, ?, NOW())', ['Project Dispatch', recipient]);

        res.status(200).json({ 
            success: true, 
            message: `Project update dispatched via ${channel}` 
        });

    } catch (error) {
        console.error("Project Notify Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send notification", 
            error: error.message 
        });
    }
});

module.exports = router;