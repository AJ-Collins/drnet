const express = require('express');
const router = express.Router();
const HrProject = require('../models/HrProjects');
const Task = require('../models/HrTasks');
const Folders = require('../models/Folders');
const db = require('../config/db');


// Stats
router.get('/stats-summary', async (req, res) => {
    try {
        // 1. Get all projects
        const projects = await HrProject.getAllProjects();

        // 2. Get all tasks
        const allTasks = await Task.getAll();

        // 3. Get pending requests
        const pendingRequests = await HrProject.getAllRequests();

        // 4. Get resources (optional for future use)
        // const resources = await HrProject.getResources();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculations
        const activeProjects = projects.filter(p => p.progress < 100).length;

        const overdueTasks = allTasks.filter(t => {
            if (t.status === 'completed') return false;
            const due = t.dueDate ? new Date(t.dueDate) : null;
            return due && due < today;
        }).length;

        const atRiskProjects = projects.filter(p => {
            const spentRatio = p.spent / p.budget;
            const progressRatio = p.progress / 100;
            // At risk if: spent > 80% but progress < 60% OR over budget
            return (p.spent > p.budget) || (spentRatio > 0.8 && progressRatio < 0.6);
        });

        const totalAtRiskAmount = atRiskProjects.reduce((sum, p) => {
            return sum + Math.max(0, p.spent - p.budget);
        }, 0);

        res.json({
            pendingRequests: pendingRequests.length,
            activeProjects,
            overdueTasks,
            atRiskAmount: totalAtRiskAmount,
            atRiskProjects: atRiskProjects.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 1. Today's task summary by priority + overdue flag
router.get('/daily-summary', async (req, res) => {
    try {
        const allTasks = await Task.getAll();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const summary = { urgent: 0, high: 0, medium: 0, low: 0 };
        let hasOverdue = false;

        allTasks.forEach(t => {
            if (t.status === 'completed') return;

            const due = t.dueDate ? new Date(t.dueDate) : null;
            if (due && due < today) hasOverdue = true;

            if (t.priority === 'Urgent') summary.urgent++;
            else if (t.priority === 'High') summary.high++;
            else if (t.priority === 'Medium') summary.medium++;
            else if (t.priority === 'Low') summary.low++;
        });

        res.json({ summary, hasOverdue, tasks: allTasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Recent documents (latest 10)
router.get('/documents/recent', async (req, res) => {
    try {
        const docs = await Folders.getAllDocs();
        const recent = docs
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
            .map(d => ({
                id: d.id,
                name: d.name,
                category: d.category || 'general',
                created_at: d.created_at,
                isManual: d.isManual
            }));
        res.json({ documents: recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Active projects (progress, budget, logistics)
router.get('/projects/active', async (req, res) => {
    try {
        const projects = await HrProject.getAllProjects();
        const active = projects.filter(p => p.progress < 100); // simple active filter
        res.json({ projects: active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Project progress history for chart (last 12 months average)
router.get('/projects/progress-trend/:period', async (req, res) => {
    try {
        const period = req.params.period; // monthly | quarterly
        const projects = await HrProject.getAllProjects();

        // Simple mock history - in real app you would store historical snapshots
        // Here we generate plausible trend based on current progress
        const now = new Date();
        const data = [];

        if (period === 'monthly') {
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = date.toLocaleString('default', { month: 'short' });
                const avg = Math.min(100, Math.round((i + 1) * 8.3)); // rising trend
                data.push({ label: monthName, avg });
            }
        } else { // quarterly
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            quarters.forEach((q, i) => {
                data.push({ label: q, avg: 25 + i * 25 });
            });
        }

        res.json({ trend: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;