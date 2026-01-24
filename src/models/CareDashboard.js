const db = require("../config/db");
const dayjs = require("dayjs");

/**
 * Helper to convert JS Date objects to MySQL DATETIME strings
 */
const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const DashboardCare = {
    // 1. TICKETS DATA
    getTicketsData: async () => {
        try {
            const now = new Date();
            const todayStart = toSqlDatetime(dayjs().startOf('day').toDate());
            
            // Total active tickets (not archived)
            const [totalTickets] = await db.query(`
                SELECT COUNT(*) as total
                FROM support_tickets 
                WHERE is_archived = FALSE
            `);
            
            // Resolved tickets today
            const [resolvedToday] = await db.query(`
                SELECT COUNT(*) as resolved
                FROM support_tickets 
                WHERE status = 'resolved'
                AND DATE(updated_at) = DATE(?)
                AND is_archived = FALSE
            `, [now]);
            
            // Open/awaiting action tickets
            const [openTickets] = await db.query(`
                SELECT COUNT(*) as open
                FROM support_tickets 
                WHERE status IN ('open', 'pending')
                AND is_archived = FALSE
            `);
            
            // Calculate resolution rate
            const total = totalTickets[0]?.total || 0;
            const resolved = resolvedToday[0]?.resolved || 0;
            const open = openTickets[0]?.open || 0;
            const resolutionRate = total > 0 ? Math.round(((total - open) / total) * 100) : 0;
            
            return {
                total: total,
                resolved: resolved,
                open: open,
                resolutionRate: resolutionRate
            };
        } catch (error) {
            console.error("Tickets data error:", error);
            throw error;
        }
    },
    
    // 2. CLIENTS DATA
    getClientsData: async () => {
        try {
            const now = new Date();
            const nowTimestamp = toSqlDatetime(now);
            
            // Total clients (users)
            const [totalClients] = await db.query(`
                SELECT COUNT(*) as total
                FROM users
            `);
            
            // Active clients (with valid subscription)
            const [activeClients] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as active
                FROM user_subscriptions
                WHERE expiry_date > ?
            `, [nowTimestamp]);
            
            // Overdue clients (expiring in next 5 days)
            const [overdueClients] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as overdue
                FROM user_subscriptions
                WHERE expiry_date > ?
                AND TIMESTAMPDIFF(DAY, ?, expiry_date) <= 5
            `, [nowTimestamp, nowTimestamp]);
            
            // Expired clients
            const [expiredClients] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as expired
                FROM user_subscriptions
                WHERE expiry_date <= ?
            `, [nowTimestamp]);
            
            // Inactive clients (no active subscription)
            const [inactiveClients] = await db.query(`
                SELECT COUNT(u.id) as inactive
                FROM users u
                LEFT JOIN user_subscriptions s ON u.id = s.user_id 
                    AND s.expiry_date > ?
                WHERE s.id IS NULL
            `, [nowTimestamp]);
            
            return {
                total: totalClients[0]?.total || 0,
                active: activeClients[0]?.active || 0,
                overdue: overdueClients[0]?.overdue || 0,
                expired: expiredClients[0]?.expired || 0,
                inactive: inactiveClients[0]?.inactive || 0
            };
        } catch (error) {
            console.error("Clients data error:", error);
            throw error;
        }
    },
    
    // 3. TASKS DATA (Assignments)
    getTasksData: async (staffId = null) => {
        try {
            let totalQuery = `SELECT COUNT(*) as total FROM assignments`;
            let completedQuery = `SELECT COUNT(*) as completed FROM assignments WHERE status = 'completed'`;
            
            if (staffId) {
                totalQuery += ` WHERE staff_id = ?`;
                completedQuery += ` AND staff_id = ?`;
            }
            
            const [totalTasks] = await db.query(totalQuery, staffId ? [staffId] : []);
            const [completedTasks] = await db.query(completedQuery, staffId ? [staffId] : []);
            
            const total = totalTasks[0]?.total || 0;
            const completed = completedTasks[0]?.completed || 0;
            const pending = total - completed;
            const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return {
                total: total,
                completed: completed,
                pending: pending,
                efficiency: efficiency
            };
        } catch (error) {
            console.error("Tasks data error:", error);
            throw error;
        }
    },
    
    // 4. PERFORMANCE DATA (Staff Attendance & Efficiency)
    getPerformanceData: async (staffId) => {
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            
            // Get attendance for current month
            const [attendance] = await db.query(`
                SELECT 
                    COUNT(*) as total_days,
                    SUM(CASE WHEN status = 'present' AND time_in IS NOT NULL THEN 1 ELSE 0 END) as present_days,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
                FROM staff_attendance 
                WHERE staff_id = ?
                AND MONTH(attendance_date) = ?
                AND YEAR(attendance_date) = ?
            `, [staffId, currentMonth, currentYear]);
            
            // Get task efficiency
            const [efficiencyData] = await db.query(`
                SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
                FROM assignments 
                WHERE staff_id = ?
                AND MONTH(assigned_at) = ?
                AND YEAR(assigned_at) = ?
            `, [staffId, currentMonth, currentYear]);
            
            const totalTasks = efficiencyData[0]?.total_tasks || 0;
            const completedTasks = efficiencyData[0]?.completed_tasks || 0;
            const taskEfficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
            
            // Determine performance status
            let status = 'Good';
            if (taskEfficiency >= 90) status = 'Excellent';
            else if (taskEfficiency >= 80) status = 'Very Good';
            else if (taskEfficiency >= 70) status = 'Good';
            else if (taskEfficiency >= 60) status = 'Fair';
            else status = 'Needs Improvement';
            
            return {
                efficiency: taskEfficiency,
                status: status,
                attendance: {
                    present: attendance[0]?.present_days || 0,
                    late: attendance[0]?.late_days || 0,
                    absent: attendance[0]?.absent_days || 0,
                    total: attendance[0]?.total_days || 0
                }
            };
        } catch (error) {
            console.error("Performance data error:", error);
            throw error;
        }
    },
    
    // 5. SCHEDULE DATA (Upcoming tasks/assignments)
    getScheduleData: async (staffId) => {
        try {
            const now = new Date();
            const today = toSqlDatetime(dayjs().startOf('day').toDate());
            const sevenDaysLater = toSqlDatetime(dayjs().add(7, 'day').endOf('day').toDate());
            
            // Get upcoming assignments
            const [upcomingAssignments] = await db.query(`
                SELECT 
                    a.id,
                    a.assignment_ticket_id as ticket_number,
                    a.subject,
                    a.assignment_note as description,
                    a.status,
                    a.assigned_at,
                    DATE(a.assigned_at) as assignment_date,
                    t.ticket_number as related_ticket
                FROM assignments a
                LEFT JOIN support_tickets t ON a.assignment_ticket_id = t.ticket_number
                WHERE a.staff_id = ?
                AND a.status != 'completed'
                AND a.assigned_at >= ?
                AND a.assigned_at <= ?
                ORDER BY a.assigned_at ASC
                LIMIT 5
            `, [staffId, today, sevenDaysLater]);
            
            // Format the schedule data
            const schedule = upcomingAssignments.map(assignment => {
                const date = new Date(assignment.assigned_at);
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                return {
                    id: assignment.id,
                    title: assignment.subject,
                    description: assignment.description,
                    day: days[date.getDay()],
                    date: date.getDate(),
                    month: months[date.getMonth()],
                    time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    status: assignment.status,
                    ticket_number: assignment.related_ticket
                };
            });
            
            return schedule;
        } catch (error) {
            console.error("Schedule data error:", error);
            throw error;
        }
    },
    
    // 6. CHART DATA (Weekly/Monthly Efficiency)
    getChartData: async (staffId, period = '7') => {
        try {
            const days = parseInt(period);
            const startDate = toSqlDatetime(dayjs().subtract(days - 1, 'day').startOf('day').toDate());
            
            const [chartData] = await db.query(`
                SELECT 
                    DATE(a.assigned_at) as date,
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
                FROM assignments a
                WHERE a.staff_id = ?
                AND a.assigned_at >= ?
                GROUP BY DATE(a.assigned_at)
                ORDER BY DATE(a.assigned_at) ASC
            `, [staffId, startDate]);
            
            // Extract just the efficiency percentages
            const efficiencyData = chartData.map(item => {
                return item.total_tasks > 0 ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0;
            });
            
            return efficiencyData;
            
        } catch (error) {
            console.error("Chart data error:", error);
            throw error;
        }
    },
    
    // 7. COMPREHENSIVE DASHBOARD DATA (All in one)
    getDashboardData: async (staffId) => {
        try {
            const [tickets, clients, tasks, performance, schedule] = await Promise.all([
                DashboardCare.getTicketsData(),
                DashboardCare.getClientsData(),
                DashboardCare.getTasksData(staffId),
                DashboardCare.getPerformanceData(staffId),
                DashboardCare.getScheduleData(staffId)
            ]);
            
            return {
                tickets,
                clients,
                tasks,
                performance,
                schedule
            };
        } catch (error) {
            console.error("Dashboard data error:", error);
            throw error;
        }
    }
};

module.exports = DashboardCare;