const db = require("../config/db");

const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const SubscriptionManager = {    

    // 1. Get Dashboard Data (Subscriptions + Dropdown options)
    async getDashboardData() {
        // Fetch active/all subscriptions with user & package details
        const [subscriptions] = await db.execute(`
            SELECT 
                us.id, us.user_id, us.package_id, us.start_date, us.expiry_date, us.status,
                u.first_name, u.second_name, u.phone, u.image,
                p.name as package_name, p.speed, p.price
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN packages p ON us.package_id = p.id
            ORDER BY us.expiry_date ASC
        `);

        // Fetch users who need a new subscription (not active)
        const [users] = await db.execute(`
            SELECT id, first_name, second_name, phone, location 
            FROM users 
            WHERE is_active = TRUE
        `);

        const [packages] = await db.execute("SELECT * FROM packages");

        return { subscriptions, users, packages };
    },

    // 2. Get Payment History for a specific User
    async getUserPayments(userId) {
        const [rows] = await db.execute(`
            SELECT * FROM payments 
            WHERE user_id = ? 
            ORDER BY payment_date DESC
        `, [userId]);
        return rows;
    },

    // 3. Create New Subscription
    async createSubscription(data) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get Package Details
            const [pkg] = await connection.execute("SELECT validity_days, price FROM packages WHERE id = ?", [data.package_id]);
            const validity = pkg[0].validity_days || 30;
            const price = pkg[0].price;

            const now = new Date();
            const startDate = data.start_date ? new Date(data.start_date) : now;
            const expiry = new Date(startDate);
            expiry.setDate(startDate.getDate() + validity);

            // A. Insert Subscription
            const [subResult] = await connection.execute(
                `INSERT INTO user_subscriptions (user_id, package_id, start_date, expiry_date, status, created_at) 
                 VALUES (?, ?, ?, ?, 'active', ?)`,
                [data.user_id, data.package_id, toSqlDatetime(startDate), toSqlDatetime(expiry), toSqlDatetime(now)]
            );

            // B. Record Payment
            const paymentDate = new Date();
            await connection.execute(
                `INSERT INTO payments (user_id, subscription_id, amount, status, payment_method, payment_date) 
                 VALUES (?, ?, ?, 'paid', ?, ?)`,
                [data.user_id, subResult.insertId, price, data.payment_method || 'cash', toSqlDatetime(paymentDate)]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async updateSubscription(id, data) {
        const [pkg] = await db.execute("SELECT validity_days FROM packages WHERE id = ?", [data.package_id]);
        if (!pkg.length) throw new Error("Package not found");

        const validity = pkg[0].validity_days || 30;
        const startDate = data.start_date ? new Date(data.start_date) : new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setDate(startDate.getDate() + validity);

        const [result] = await db.execute(`
            UPDATE user_subscriptions 
            SET package_id = ?, 
                start_date = ?, 
                expiry_date = ?, 
                status = ?
            WHERE id = ?
        `, [
            data.package_id, 
            toSqlDatetime(startDate), 
            toSqlDatetime(expiryDate), 
            data.status || 'active', 
            id
        ]);
        return result.affectedRows > 0;
    },

    // 4. Renew / Upgrade Subscription
    async renewSubscription(id, data) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [currentSub] = await connection.execute(`
                SELECT us.user_id, us.package_id, us.expiry_date, p.price as old_price 
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.id = ?
            `, [id]);

            if (currentSub.length === 0) throw new Error("Subscription not found");
            
            const subRecord = currentSub[0];
            const now = new Date();
            const currentExpiry = new Date(subRecord.expiry_date);

            const [newPkg] = await connection.execute("SELECT validity_days, price FROM packages WHERE id = ?", [data.package_id]);
            if (newPkg.length === 0) throw new Error("New package not found");
            
            const validity = newPkg[0].validity_days || 30;
            const newPrice = newPkg[0].price;

            // 3. LOGIC: Set new start date to existing expiry (if in future), otherwise set to NOW
            // This prevents "losing days" when renewing early.
            let newStartDate = currentExpiry > now ? currentExpiry : now;
            
            // 4. Calculate new expiry date
            let newExpiryDate = new Date(newStartDate.getTime());
            newExpiryDate.setDate(newStartDate.getDate() + validity);

            // A. Record Renewal History
            await connection.execute(`
                INSERT INTO renewals (subscription_id, user_id, old_subscription_id, amount, old_amount, renewal_date)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [id, subRecord.user_id, id, newPrice, subRecord.old_price, toSqlDatetime(now)]);

            // B. Record Payment
            await connection.execute(`
                INSERT INTO payments (user_id, subscription_id, amount, status, payment_method, payment_date)
                VALUES (?, ?, ?, 'paid', ?, ?)
            `, [subRecord.user_id, id, newPrice, data.payment_method || 'cash', toSqlDatetime(now)]);

            // C. Update Subscription with the calculated timeline
            await connection.execute(`
                UPDATE user_subscriptions 
                SET package_id = ?, 
                    start_date = ?, 
                    expiry_date = ?, 
                    status = 'active',
                    created_at = ?
                WHERE id = ?
            `, [data.package_id, toSqlDatetime(newStartDate), toSqlDatetime(newExpiryDate), toSqlDatetime(now), id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // 5. Delete Subscription
    async deleteSubscription(id) {
        return await db.execute("DELETE FROM user_subscriptions WHERE id = ?", [id]);
    },

    getSubscriptionMetrics: async (nowTimestamp) => {
        try {
            const dateObj = new Date(nowTimestamp);

            const [activeRows] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as count
                FROM user_subscriptions
                WHERE expiry_date > ?
            `, [toSqlDatetime(dateObj)]);

            const [activeRevenueRows] = await db.query(`
                SELECT COALESCE(SUM(p.price), 0) as total 
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.expiry_date > ?
            `, [toSqlDatetime(dateObj)]);
            
            const [monthlyRevenueRows] = await db.query(`
                SELECT COALESCE(SUM(p.price), 0) as total
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE YEAR(us.created_at) = YEAR(?)
                AND MONTH(us.created_at) = MONTH(?)
            `, [toSqlDatetime(dateObj), toSqlDatetime(dateObj)]);

            return {
                activeCount: activeRows[0].count,
                totalRevenue: activeRevenueRows[0].total,
                monthlyRevenue: monthlyRevenueRows[0].total
            };
        } catch (error) {
            console.error("Metric retrieval error:", error);
            throw error;
        }
    },

    async extendExpiry(id, newExpiryDate) {
        const dateObj = new Date(newExpiryDate);
        
        const query = `
            UPDATE user_subscriptions 
            SET expiry_date = ?, 
                status = 'active' 
            WHERE id = ?
        `;
        
        return await db.execute(query, [toSqlDatetime(dateObj), id]);
    }
};


module.exports = SubscriptionManager;