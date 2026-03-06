const db = require("../config/db");
const dayjs = require("dayjs");

const toSqlDatetime = (date) => dayjs(date).format("YYYY-MM-DD HH:mm:ss");

/**
 * Resolve period boundaries from query params.
 *
 * Supported combinations:
 *   period=current
 *   period=last
 *   period=custom  +  year=YYYY & month=M
 *   period=custom  +  date_from=YYYY-MM-DD & date_to=YYYY-MM-DD
 *
 * Returns: { start: Dayjs, end: Dayjs, label: string }
 */
function resolvePeriod({ period = "current", year, month, date_from, date_to }) {
    if (period === "last") {
        const base = dayjs().subtract(1, "month");
        return {
            start: base.startOf("month"),
            end:   base.endOf("month"),
            label: base.format("MMMM YYYY"),
        };
    }

    if (period === "custom") {
        if (date_from && date_to) {
            const start = dayjs(date_from).startOf("day");
            const end   = dayjs(date_to).endOf("day");
            if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
                throw new Error("Invalid date_from / date_to values");
            }
            return {
                start,
                end,
                label: `${start.format("DD MMM YYYY")} – ${end.format("DD MMM YYYY")}`,
            };
        }

        if (year && month) {
            const base = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
            if (!base.isValid()) throw new Error("Invalid year/month values");
            return {
                start: base.startOf("month"),
                end:   base.endOf("month"),
                label: base.format("MMMM YYYY"),
            };
        }

        throw new Error(
            "Custom period requires either (year + month) or (date_from + date_to)"
        );
    }

    // Default: current month
    const base = dayjs();
    return {
        start: base.startOf("month"),
        end:   base.endOf("month"),
        label: base.format("MMMM YYYY"),
    };
}

const AnalyticsReport = {

    /**
     * Generate analytics report data for the requested period and type.
     *
     * @param {object} params
     * @param {string} params.period       - "current" | "last" | "custom"
     * @param {string} [params.year]       - YYYY  (custom month mode)
     * @param {string} [params.month]      - M     (custom month mode)
     * @param {string} [params.date_from]  - YYYY-MM-DD (custom range mode)
     * @param {string} [params.date_to]    - YYYY-MM-DD (custom range mode)
     * @param {string} [params.report_type] - "full" | "financial" | "clients" | "operations"
     *
     * @returns {Promise<object>} Structured report data
     */
    generate: async (params = {}) => {
        const { report_type = "full" } = params;

        const { start, end, label } = resolvePeriod(params);

        const periodStart = toSqlDatetime(start.toDate());
        const periodEnd   = toSqlDatetime(end.toDate());
        const nowTs       = toSqlDatetime(new Date());
        const duration        = end.diff(start, "day") + 1;
        const prevEnd         = start.subtract(1, "day");
        const prevStart       = prevEnd.subtract(duration - 1, "day");
        const prevPeriodStart = toSqlDatetime(prevStart.toDate());
        const prevPeriodEnd   = toSqlDatetime(prevEnd.toDate());
        const [
            [currentSubRev],
            [currentSalesRev],
            [prevSubRev],
            [prevSalesRev],
            [monthlyExpenditure],
            [activeSubscriptions],
            [totalUsers],
            [inactiveUsers],
            [overdueUsers],
            [expiredUsers],
            [newClients],
            [totalBookings],
            [completedBookings],
            [pendingBookings],
            [pendingTickets],
            [resolvedTickets],
            [pendingTasks],
            [completedTasks],
            [inventoryValue],
            [inStockCount],
            [outStockCount],
            [staffSalaries],
            [staffOnDuty],
            [dailyRevenue],
            [packagePopularity],
            [recentInvoices],
            [topExpenseCategories],
            [salesBreakdown],
        ] = await Promise.all([

            db.query(`
                SELECT COALESCE(SUM(p.price), 0) AS total
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.created_at BETWEEN ? AND ?
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT COALESCE(SUM(total_amount), 0) AS total
                FROM sales
                WHERE sold_date BETWEEN ? AND ?
                  AND payment_status IN ('paid', 'partial')
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT COALESCE(SUM(p.price), 0) AS total
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.created_at BETWEEN ? AND ?
            `, [prevPeriodStart, prevPeriodEnd]),

            db.query(`
                SELECT COALESCE(SUM(total_amount), 0) AS total
                FROM sales
                WHERE sold_date BETWEEN ? AND ?
                  AND payment_status IN ('paid', 'partial')
            `, [prevPeriodStart, prevPeriodEnd]),

            db.query(`
                SELECT COALESCE(SUM(amount), 0) AS total
                FROM hrexpenses
                WHERE expense_date BETWEEN DATE(?) AND DATE(?)
            `, [periodStart, periodEnd]),


            db.query(`
                SELECT COUNT(DISTINCT user_id) AS count
                FROM user_subscriptions
                WHERE expiry_date > ?
            `, [nowTs]),

            db.query(`SELECT COUNT(*) AS count FROM users`),

            db.query(`
                SELECT COUNT(u.id) AS count
                FROM users u
                LEFT JOIN user_subscriptions s ON u.id = s.user_id
                WHERE s.id IS NULL
            `),

            db.query(`
                SELECT COUNT(DISTINCT user_id) AS count
                FROM user_subscriptions
                WHERE TIMESTAMPDIFF(DAY, ?, expiry_date) <= 5
                  AND expiry_date > ?
            `, [nowTs, nowTs]),

            db.query(`
                SELECT COUNT(DISTINCT user_id) AS count
                FROM user_subscriptions
                WHERE expiry_date <= ?
            `, [nowTs]),

            db.query(`
                SELECT COUNT(*) AS count
                FROM users
                WHERE created_at BETWEEN ? AND ?
                  AND is_active = TRUE
            `, [periodStart, periodEnd]),


            db.query(`
                SELECT COUNT(*) AS count FROM bookings
                WHERE created_at BETWEEN ? AND ?
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT COUNT(*) AS count FROM bookings
                WHERE status = 'completed'
                  AND created_at BETWEEN ? AND ?
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT COUNT(*) AS count FROM bookings
                WHERE status = 'pending'
            `),

            db.query(`
                SELECT COUNT(*) AS count FROM support_tickets
                WHERE status IN ('open', 'pending')
                  AND is_archived = FALSE
            `),

            db.query(`
                SELECT COUNT(*) AS count FROM support_tickets
                WHERE status = 'resolved'
                  AND updated_at BETWEEN ? AND ?
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT COUNT(*) AS count FROM assignments
                WHERE status IN ('pending', 'seen')
            `),

            db.query(`
                SELECT COUNT(*) AS count FROM assignments
                WHERE status = 'completed'
                  AND assigned_at BETWEEN ? AND ?
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT COALESCE(SUM(unit_price), 0) AS total
                FROM items WHERE status = 'in-stock'
            `),

            db.query(`SELECT COUNT(*) AS count FROM items WHERE status = 'in-stock'`),

            db.query(`SELECT COUNT(*) AS count FROM items WHERE status = 'out-stock'`),


            db.query(`SELECT COALESCE(SUM(basic_salary), 0) AS total FROM staff_salaries`),

            db.query(`
                SELECT COUNT(DISTINCT staff_id) AS count
                FROM staff_attendance
                WHERE DATE(attendance_date) = CURDATE()
                  AND status = 'present'
            `),

            db.query(`
                SELECT DATE_FORMAT(all_dates.d, '%d %b') AS day_label,
                       all_dates.d                        AS raw_date,
                       COALESCE(sub_rev, 0)               AS subscription_revenue,
                       COALESCE(sales_rev, 0)             AS sales_revenue,
                       COALESCE(sub_rev, 0) + COALESCE(sales_rev, 0) AS total_revenue
                FROM (
                    SELECT DISTINCT DATE(us.created_at) AS d
                    FROM user_subscriptions us
                    WHERE us.created_at BETWEEN ? AND ?
                    UNION
                    SELECT DISTINCT DATE(s.sold_date) AS d
                    FROM sales s
                    WHERE s.sold_date BETWEEN ? AND ?
                      AND s.payment_status IN ('paid', 'partial')
                ) all_dates
                LEFT JOIN (
                    SELECT DATE(us.created_at) AS d, SUM(p.price) AS sub_rev
                    FROM user_subscriptions us
                    JOIN packages p ON us.package_id = p.id
                    WHERE us.created_at BETWEEN ? AND ?
                    GROUP BY DATE(us.created_at)
                ) sub_data ON all_dates.d = sub_data.d
                LEFT JOIN (
                    SELECT DATE(sold_date) AS d, SUM(total_amount) AS sales_rev
                    FROM sales
                    WHERE sold_date BETWEEN ? AND ?
                      AND payment_status IN ('paid', 'partial')
                    GROUP BY DATE(sold_date)
                ) sales_data ON all_dates.d = sales_data.d
                ORDER BY all_dates.d ASC
            `, [
                periodStart, periodEnd,
                periodStart, periodEnd,
                periodStart, periodEnd,
                periodStart, periodEnd,
            ]),

            db.query(`
                SELECT p.name AS package_name, p.id AS package_id,
                       COUNT(us.id) AS subscription_count,
                       p.price, p.speed
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.expiry_date > ?
                GROUP BY p.id, p.name, p.price, p.speed
                ORDER BY subscription_count DESC
                LIMIT 5
            `, [nowTs]),

            db.query(`
                SELECT p.id,
                       CONCAT('INV-', DATE_FORMAT(p.payment_date, '%Y'), '-', LPAD(p.id, 4, '0')) AS invoice_id,
                       CONCAT(u.first_name, ' ', u.second_name) AS client_name,
                       p.amount, p.status,
                       DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date,
                       pa.name AS package_name
                FROM payments p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN user_subscriptions us ON p.subscription_id = us.id
                LEFT JOIN packages pa ON us.package_id = pa.id
                WHERE p.payment_date BETWEEN DATE(?) AND DATE(?)
                ORDER BY p.payment_date DESC
                LIMIT 10
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT category,
                       COUNT(*)     AS transaction_count,
                       SUM(amount)  AS total_amount
                FROM hrexpenses
                WHERE expense_date BETWEEN DATE(?) AND DATE(?)
                GROUP BY category
                ORDER BY total_amount DESC
                LIMIT 8
            `, [periodStart, periodEnd]),

            db.query(`
                SELECT i.category,
                       COUNT(s.id)          AS sales_count,
                       SUM(s.total_amount)  AS total_revenue
                FROM sales s
                LEFT JOIN items i ON s.item_id = i.id
                WHERE s.sold_date BETWEEN ? AND ?
                  AND s.payment_status IN ('paid', 'partial')
                GROUP BY i.category
                ORDER BY total_revenue DESC
                LIMIT 8
            `, [periodStart, periodEnd]),
        ]);

        const subRevTotal   = Number(currentSubRev[0]?.total   || 0);
        const salesRevTotal = Number(currentSalesRev[0]?.total || 0);
        const totalRevenue  = subRevTotal + salesRevTotal;

        const prevRevTotal = Number(prevSubRev[0]?.total || 0) + Number(prevSalesRev[0]?.total || 0);

        let revenueTrend = 0;
        if (prevRevTotal > 0) {
            revenueTrend = ((totalRevenue - prevRevTotal) / prevRevTotal) * 100;
        } else if (totalRevenue > 0) {
            revenueTrend = 100;
        }

        const expenses     = Number(monthlyExpenditure[0]?.total || 0);
        const netProfit    = totalRevenue - expenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            meta: {
                period_label:  label,
                period_start:  start.format("YYYY-MM-DD"),
                period_end:    end.format("YYYY-MM-DD"),
                report_type,
                generated_at:  dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },

            financial: (report_type === "full" || report_type === "financial") ? {
                total_revenue:           totalRevenue,
                subscription_revenue:    subRevTotal,
                sales_revenue:           salesRevTotal,
                prev_period_revenue:     prevRevTotal,
                revenue_trend_pct:       parseFloat(revenueTrend.toFixed(1)),
                monthly_expenditure:     expenses,
                net_profit:              netProfit,
                profit_margin_pct:       parseFloat(profitMargin.toFixed(1)),
                staff_salaries_payable:  Number(staffSalaries[0]?.total || 0),
                expense_breakdown:       topExpenseCategories,
            } : undefined,

            clients: (report_type === "full" || report_type === "clients") ? {
                total_users:          Number(totalUsers[0]?.count          || 0),
                active_subscriptions: Number(activeSubscriptions[0]?.count || 0),
                inactive_users:       Number(inactiveUsers[0]?.count       || 0),
                overdue_users:        Number(overdueUsers[0]?.count        || 0),
                expired_users:        Number(expiredUsers[0]?.count        || 0),
                new_clients_period:   Number(newClients[0]?.count          || 0),
                package_popularity:   packagePopularity,
                recent_invoices:      recentInvoices,
            } : undefined,

            operations: (report_type === "full" || report_type === "operations") ? {
                bookings_in_period:       Number(totalBookings[0]?.count      || 0),
                bookings_completed:       Number(completedBookings[0]?.count  || 0),
                pending_bookings:         Number(pendingBookings[0]?.count    || 0),
                pending_tickets:          Number(pendingTickets[0]?.count     || 0),
                resolved_tickets_period:  Number(resolvedTickets[0]?.count    || 0),
                pending_tasks:            Number(pendingTasks[0]?.count       || 0),
                completed_tasks_period:   Number(completedTasks[0]?.count     || 0),
                inventory_value:          Number(inventoryValue[0]?.total     || 0),
                in_stock_items:           Number(inStockCount[0]?.count       || 0),
                out_of_stock_items:       Number(outStockCount[0]?.count      || 0),
                staff_on_duty_today:      Number(staffOnDuty[0]?.count        || 0),
                sales_by_category:        salesBreakdown,
            } : undefined,

            charts: {
                daily_revenue:      dailyRevenue,
                package_popularity: packagePopularity,
            },
        };
    },
};

module.exports = AnalyticsReport;