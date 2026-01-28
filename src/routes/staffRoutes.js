const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const StaffSalary = require('../models/StaffSalary');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Get All Staff
router.get('/', async (req, res) => {
    try {
        const staff = await Staff.findAll();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Staff
router.post('/', async (req, res) => {
    try {
        const data = {
            ...req.body,
            employee_id: req.body.id_number
        };
        delete data.id_number;

        const result = await Staff.create(data);
        res.status(201).json({ message: "Staff created", id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Staff
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = {
            ...req.body,
            employee_id: req.body.id_number
        };
        delete data.id_number;

        const result = await Staff.update(id, data); 
        res.json({ message: "Staff updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Staff
router.delete('/:id', async (req, res) => {
    try {
        await Staff.delete(req.params.id);
        res.json({ message: "Staff deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GEt roles
router.get('/roles', async (req, res) => {
    try {
        const roles = await Staff.getRoles();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Staff
// GET: Fetch Finance Dashboard Data
router.get('/finance/my-finance', async (req, res) => {
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
router.get('/finance/payslip/:id', async (req, res) => {
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