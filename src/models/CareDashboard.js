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
            let assignmentsTotalQuery = `SELECT COUNT(*) as total FROM assignments`;
            let assignmentsCompletedQuery = `SELECT COUNT(*) as completed FROM assignments WHERE status = 'completed'`;
            
            let ticketAssignmentsTotalQuery = `SELECT COUNT(*) as total FROM ticket_assignments`;
            let ticketAssignmentsCompletedQuery = `SELECT COUNT(*) as completed FROM ticket_assignments WHERE status = 'completed'`;
            
            if (staffId) {
                assignmentsTotalQuery += ` WHERE staff_id = ?`;
                assignmentsCompletedQuery += ` AND staff_id = ?`;
                ticketAssignmentsTotalQuery += ` WHERE staff_id = ?`;
                ticketAssignmentsCompletedQuery += ` AND staff_id = ?`;
            }
            
            const [
                [assignmentsTotal],
                [assignmentsCompleted],
                [ticketAssignmentsTotal],
                [ticketAssignmentsCompleted]
            ] = await Promise.all([
                db.query(assignmentsTotalQuery, staffId ? [staffId] : []),
                db.query(assignmentsCompletedQuery, staffId ? [staffId] : []),
                db.query(ticketAssignmentsTotalQuery, staffId ? [staffId] : []),
                db.query(ticketAssignmentsCompletedQuery, staffId ? [staffId] : [])
            ]);
            
            const total = (assignmentsTotal[0]?.total || 0) + (ticketAssignmentsTotal[0]?.total || 0);
            const completed = (assignmentsCompleted[0]?.completed || 0) + (ticketAssignmentsCompleted[0]?.completed || 0);
            const pending = total - completed;
            const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return {
                total: total,
                completed: completed,
                pending: pending,
                efficiency: efficiency,
                breakdown: {
                    general_tasks: {
                        total: assignmentsTotal[0]?.total || 0,
                        completed: assignmentsCompleted[0]?.completed || 0,
                        pending: (assignmentsTotal[0]?.total || 0) - (assignmentsCompleted[0]?.completed || 0)
                    },
                    ticket_assignments: {
                        total: ticketAssignmentsTotal[0]?.total || 0,
                        completed: ticketAssignmentsCompleted[0]?.completed || 0,
                        pending: (ticketAssignmentsTotal[0]?.total || 0) - (ticketAssignmentsCompleted[0]?.completed || 0)
                    }
                }
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
            
            // Get task efficiency from BOTH tables
            const [efficiencyData] = await db.query(`
                SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
                FROM (
                    SELECT assigned_at, status, staff_id 
                    FROM assignments 
                    WHERE staff_id = ?
                    AND MONTH(assigned_at) = ?
                    AND YEAR(assigned_at) = ?
                    
                    UNION ALL
                    
                    SELECT assigned_at, status, staff_id 
                    FROM ticket_assignments 
                    WHERE staff_id = ?
                    AND MONTH(assigned_at) = ?
                    AND YEAR(assigned_at) = ?
                ) as combined_tasks
            `, [staffId, currentMonth, currentYear, staffId, currentMonth, currentYear]);
            
            const totalTasks = efficiencyData[0]?.total_tasks || 0;
            const completedTasks = efficiencyData[0]?.completed_tasks || 0;
            const taskEfficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
            
            // Determine performance status based on both attendance and efficiency
            let status = 'Good';
            
            // Calculate attendance score
            const totalDays = attendance[0]?.total_days || 0;
            const presentDays = attendance[0]?.present_days || 0;
            const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
            
            // Combined score (60% task efficiency, 40% attendance)
            const combinedScore = (taskEfficiency * 0.6) + (attendanceRate * 0.4);
            
            // Determine status based on combined score
            if (combinedScore >= 95) status = 'Excellent';
            else if (combinedScore >= 85) status = 'Very Good';
            else if (combinedScore >= 75) status = 'Good';
            else if (combinedScore >= 65) status = 'Fair';
            else status = 'Needs Improvement';
            
            return {
                efficiency: taskEfficiency,
                attendanceRate: attendanceRate,
                combinedScore: Math.round(combinedScore),
                status: status,
                attendance: {
                    present: attendance[0]?.present_days || 0,
                    late: attendance[0]?.late_days || 0,
                    absent: attendance[0]?.absent_days || 0,
                    total: attendance[0]?.total_days || 0
                },
                tasks: {
                    total: totalTasks,
                    completed: completedTasks,
                    pending: totalTasks - completedTasks
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
                    DATE(assigned_at) as date,
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
                FROM (
                    SELECT assigned_at, status FROM assignments 
                    WHERE staff_id = ? AND assigned_at >= ?
                    UNION ALL
                    SELECT assigned_at, status FROM ticket_assignments 
                    WHERE staff_id = ? AND assigned_at >= ?
                ) as combined_tasks
                GROUP BY DATE(assigned_at)
                ORDER BY DATE(assigned_at) ASC
            `, [staffId, startDate, staffId, startDate]);
            
            const efficiencyData = chartData.map(item => {
                return item.total_tasks > 0 ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0;
            });
            
            return efficiencyData;
            
        } catch (error) {
            console.error("Chart data error:", error);
            throw error;
        }
    },
    
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