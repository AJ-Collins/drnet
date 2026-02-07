const express = require('express');
const router = express.Router();
const Report = require('../models/ReportModel');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET ALL REPORTS 
router.get('/all-reports', async (req, res) => {
    try {
        const reports = await Report.getStaffReportsFeed();
        res.json({
            success: true,
            reports: reports
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// GET MY REPORTS (for staff)
router.get('/my/reports', async (req, res) => {
    try {
        const staff_id = req.session.user.id;
        const reports = await Report.getMyReports(staff_id);
        res.json({ 
            success: true, 
            reports: reports 
        });
    } catch (error) {
        console.error("My Reports Error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// SAVE STAFF REPORT
router.post('/staff', async (req, res) => {
    try {
        const staff_id = req.session.user.id;
        
        const today = new Date();
        const reportDate = req.body.report_date || 
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const result = await Report.saveStaffReport({
            staff_id,
            department: req.session.user.department,
            content: req.body.content,
            status: req.body.status || 'draft',
            report_date: reportDate
        });
        
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Save Staff Report Error:", error);
        res.status(500).json({ success: false, error: 'Failed to save staff report' });
    }
});

// DELETE STAFF REPORT - Staff can delete their own reports
router.delete('/staff/delete/:id', async (req, res) => {
    try {
        const staff_id = req.session.user.id;
        const report_id = req.params.id;
        
        const result = await Report.deleteStaffReport(report_id, staff_id);
        
        if (result.deleted) {
            res.json({ success: true, message: 'Report deleted successfully' });
        } else {
            res.status(403).json({ success: false, error: 'Not authorized to delete this report' });
        }
    } catch (error) {
        console.error("Delete Staff Report Error:", error);
        res.status(500).json({ success: false, error: 'Failed to delete report' });
    }
});

// GET GENERAL REPORT
router.get('/general', async (req, res) => {
    try {
        const reports = await Report.getAllGeneralReports();
        res.json({ 
            success: true, 
            reports: reports 
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// SAVE GENERAL REPORT (Supervisor)
router.post('/general', async (req, res) => {
    try {
        const supervisor_id = req.session.user.id;
        
        // Get report_date from request body or use today's date
        const today = new Date();
        const reportDate = req.body.report_date || 
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const result = await Report.saveGeneralReport({
            supervisor_id,
            report_date: reportDate,
            status: req.body.status || 'draft',
            ops_summary: req.body.ops_summary || null,
            ops_installs: req.body.ops_installs || 0,
            ops_pending: req.body.ops_pending || 0,
            staff_summary: req.body.staff_summary || null,
            support_summary: req.body.support_summary || null,
            is_urgent: req.body.is_urgent || 0,
            conclusion: req.body.conclusion || null
        });
        
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Save General Report Error:", error);
        res.status(500).json({ success: false, error: 'Failed to save general report' });
    }
});


// GET SINGLE GENERAL REPORT BY ID
router.get('/general/:id', async (req, res) => {
    try {
        const report = await Report.getGeneralReportById(req.params.id);
        
        if (report) {
            res.json({ success: true, report: report });
        } else {
            res.status(404).json({ success: false, error: 'Report not found' });
        }
    } catch (error) {
        console.error("Get General Report Error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// UPDATE GENERAL REPORT (Admin only)
router.put('/general/:id', async (req, res) => {
    try {
        const report_id = req.params.id;
        
        const result = await Report.updateGeneralReport(report_id, {
            ops_summary: req.body.ops_summary,
            ops_installs: req.body.ops_installs,
            ops_pending: req.body.ops_pending,
            staff_summary: req.body.staff_summary,
            support_summary: req.body.support_summary,
            is_urgent: req.body.is_urgent,
            conclusion: req.body.conclusion,
            status: req.body.status
        });
        
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Update General Report Error:", error);
        res.status(500).json({ success: false, error: 'Failed to update general report' });
    }
});

// DELETE GENERAL REPORT (Admin only)
router.delete('/general/:id', async (req, res) => {
    try {
        const report_id = req.params.id;
        
        const result = await Report.deleteGeneralReport(report_id);
        
        if (result.deleted) {
            res.json({ success: true, message: 'Report deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Report not found' });
        }
    } catch (error) {
        console.error("Delete General Report Error:", error);
        res.status(500).json({ success: false, error: 'Failed to delete report' });
    }
});

module.exports = router;