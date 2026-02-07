const db = require("../config/db");

const SupervisorDashboard = {
    getStats: async () => {
        try {
            // 1. Total Active Staff
            const [staffRes] = await db.query(
                "SELECT COUNT(*) as count FROM staff WHERE is_active = 1"
            );

            // 2. Pending Bookings
            const [bookingRes] = await db.query(
                "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'"
            );

            // 3. New Clients Onboarded Today
            const today = new Date().toISOString().split('T')[0];
            const [onboardRes] = await db.query(
                "SELECT COUNT(*) as count FROM client_onboard WHERE DATE(created_at) = ?", 
                [today]
            );

            // 4. Open Support Tickets
            const [ticketRes] = await db.query(
                "SELECT COUNT(*) as count FROM support_tickets WHERE status != 'resolved' AND status != 'closed'"
            );

            // Optional: Get Recent Activities for a feed
            const [activities] = await db.query(`
                (SELECT 'New Booking' as type, name as detail, created_at FROM bookings ORDER BY created_at DESC LIMIT 3)
                UNION
                (SELECT 'Client Onboarded' as type, CONCAT(first_name, ' ', second_name) as detail, created_at FROM client_onboard ORDER BY created_at DESC LIMIT 3)
                ORDER BY created_at DESC LIMIT 5
            `);

            return {
                activeStaff: staffRes[0].count,
                pendingBookings: bookingRes[0].count,
                newClientsToday: onboardRes[0].count,
                openTickets: ticketRes[0].count || 0,
                recentActivity: activities
            };
        } catch (error) {
            console.error("Dashboard Stats Error:", error);
            throw error;
        }
    }
};

module.exports = SupervisorDashboard;