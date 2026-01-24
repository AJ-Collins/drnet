const express = require('express');
const router = express.Router();
const DashboardCare = require('../models/CareDashboard');

// Middleware to get staff ID from session/request
const getStaffId = (req) => {
    // Adjust based on your authentication system
    return req.user?.id || req.staffId || 505; // Default to 505 for testing
};

// 1. Get comprehensive dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const staffId = getStaffId(req);
        const data = await DashboardCare.getDashboardData(staffId);
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error("Dashboard route error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to load dashboard data"
        });
    }
});

// 2. Get tickets data only
router.get('/dashboard/tickets', async (req, res) => {
    try {
        const data = await DashboardCare.getTicketsData();
        res.json(data);
    } catch (error) {
        console.error("Tickets data error:", error);
        res.status(500).json({
            error: "Failed to load tickets data"
        });
    }
});

// 3. Get clients data only
router.get('/dashboard/clients', async (req, res) => {
    try {
        const data = await DashboardCare.getClientsData();
        res.json(data);
    } catch (error) {
        console.error("Clients data error:", error);
        res.status(500).json({
            error: "Failed to load clients data"
        });
    }
});

// 4. Get tasks data only
router.get('/dashboard/tasks', async (req, res) => {
    try {
        const staffId = getStaffId(req);
        const data = await DashboardCare.getTasksData(staffId);
        res.json(data);
    } catch (error) {
        console.error("Tasks data error:", error);
        res.status(500).json({
            error: "Failed to load tasks data"
        });
    }
});

// 5. Get performance data only
router.get('/dashboard/performance', async (req, res) => {
    try {
        const staffId = getStaffId(req);
        const data = await DashboardCare.getPerformanceData(staffId);
        res.json(data);
    } catch (error) {
        console.error("Performance data error:", error);
        res.status(500).json({
            error: "Failed to load performance data"
        });
    }
});

// 6. Get schedule data only
router.get('/dashboard/schedule', async (req, res) => {
    try {
        const staffId = getStaffId(req);
        const data = await DashboardCare.getScheduleData(staffId);
        res.json(data);
    } catch (error) {
        console.error("Schedule data error:", error);
        res.status(500).json({
            error: "Failed to load schedule data"
        });
    }
});

// 7. Get chart data
router.get('/dashboard/chart', async (req, res) => {
    try {
        const staffId = getStaffId(req);
        const period = req.query.period || '7';
        
        const data = await DashboardCare.getChartData(staffId, period);
        res.json(data);
    } catch (error) {
        console.error("Chart data error:", error);
        res.status(500).json({
            error: "Failed to load chart data"
        });
    }
});

// 8. Quick stats endpoint (for header/widgets)
router.get('/dashboard/quick-stats', async (req, res) => {
    try {
        const staffId = getStaffId(req);
        
        const [tickets, tasks, performance] = await Promise.all([
            DashboardCare.getTicketsData(),
            DashboardCare.getTasksData(staffId),
            DashboardCare.getPerformanceData(staffId)
        ]);
        
        res.json({
            tickets: tickets.total,
            openTickets: tickets.open,
            assignedTasks: tasks.total,
            completedTasks: tasks.completed,
            efficiency: performance.efficiency,
            performanceStatus: performance.status
        });
    } catch (error) {
        console.error("Quick stats error:", error);
        res.status(500).json({
            error: "Failed to load quick stats"
        });
    }
});

module.exports = router;