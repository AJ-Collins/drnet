const express = require('express');
const router = express.Router();
const StaffSalary = require('../models/StaffSalary');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET: Fetch Finance Dashboard Data
router.get('/my-finance', async (req, res) => {
    try {
        const staffId = req.session.user.id;
        
        const [salaryDetails, payslips] = await Promise.all([
            StaffSalary.getJobDetails(staffId),
            StaffSalary.getPayslipHistory(staffId)
        ]);

        res.json({
            success: true,
            salary: salaryDetails || {},
            payslips: payslips || []
        });
    } catch (error) {
        console.error("Finance Load Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// GET: Download/View specific Payslip
router.get('/payslip/:id', async (req, res) => {
    try {
        const staffId = req.session.user.id;
        const payslipId = req.params.id;

        const payslip = await StaffSalary.getPayslipById(payslipId, staffId);
        
        if (!payslip) {
            return res.status(404).json({ error: "Payslip not found" });
        }

        res.json({ success: true, payslip });
    } catch (error) {
        console.error("Payslip Fetch Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;