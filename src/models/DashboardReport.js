const db = require("../config/db");
const dayjs = require("dayjs");

/**
 * Helper: pad a number to 2 digits
 */
const pad = (n) => n.toString().padStart(2, "0");

/**
 * Convert a JS Date to a MySQL DATETIME string.
 */
const toSql = (date) => {
    const d = dayjs(date);
    return `${d.year()}-${pad(d.month() + 1)}-${pad(d.date())} ${pad(d.hour())}:${pad(d.minute())}:${pad(d.second())}`;
};

/**
 * Resolve date boundaries from query params.
 *
 * Supported shapes (mirrors AnalyticReport):
 *   period=current             → current calendar month
 *   period=last                → previous calendar month
 *   period=custom + year+month → that specific month
 *   period=custom + date_from + date_to → exact range
 *
 * Returns { periodStart, periodEnd, month, year, periodLabel }
 */
function resolvePeriod(query = {}) {
    const { period = "current", year, month, date_from, date_to } = query;

    let start, end, label;

    if (period === "last") {
        const ref = dayjs().subtract(1, "month");
        start = ref.startOf("month");
        end   = ref.endOf("month");
        label = ref.format("MMMM YYYY");
    } else if (period === "custom") {
        if (date_from && date_to) {
            start = dayjs(date_from).startOf("day");
            end   = dayjs(date_to).endOf("day");
            label = `${dayjs(date_from).format("DD MMM YYYY")} – ${dayjs(date_to).format("DD MMM YYYY")}`;
        } else if (year && month) {
            const ref = dayjs(`${year}-${pad(Number(month))}-01`);
            start = ref.startOf("month");
            end   = ref.endOf("month");
            label = ref.format("MMMM YYYY");
        } else {
            // Fallback to current
            start = dayjs().startOf("month");
            end   = dayjs().endOf("month");
            label = dayjs().format("MMMM YYYY");
        }
    } else {
        // current (default)
        start = dayjs().startOf("month");
        end   = dayjs().endOf("month");
        label = dayjs().format("MMMM YYYY");
    }

    return {
        periodStart: toSql(start.toDate()),
        periodEnd:   toSql(end.toDate()),
        month:       start.month() + 1,
        year:        start.year(),
        label,
    };
}

const DashboardReport = {
    /**
     * Generate a dashboard stats report scoped to the given period.
     * @param {object} query  - Express req.query shape
     */
    generate: async (query = {}) => {
        try {
            const { periodStart, periodEnd, month, year, label } = resolvePeriod(query);
            const nowTs = toSql(new Date());

            // ── Revenue & Expenditure (period-scoped) ──────────────────────
            const [[subRevRow]]  = await db.query(`
                SELECT COALESCE(SUM(p.price), 0) AS total
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.created_at BETWEEN ? AND ?
            `, [periodStart, periodEnd]);

            const [[salesRevRow]] = await db.query(`
                SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales
                WHERE sold_date BETWEEN ? AND ?
                  AND payment_status IN ('paid', 'partial')
            `, [periodStart, periodEnd]);

            const [[hrExpRow]] = await db.query(`
                SELECT COALESCE(SUM(amount), 0) AS total FROM hrexpenses
                WHERE expense_date BETWEEN ? AND ?
            `, [periodStart, periodEnd]);

            const [[expRow]] = await db.query(`
                SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
                WHERE expense_date BETWEEN ? AND ?
            `, [periodStart, periodEnd]);

            // ── Payroll (static — salary table is current, not historical) ─
            const [[salariesRow]] = await db.query(
                `SELECT COALESCE(SUM(basic_salary), 0) AS total FROM staff_salaries`
            );

            // ── Projected revenue: subscriptions overlapping end of period ─
            const nextMonthStart = toSql(dayjs(periodEnd).add(1, "day").startOf("month").toDate());
            const nextMonthEnd   = toSql(dayjs(periodEnd).add(1, "day").endOf("month").toDate());

            const [[projRow]] = await db.query(`
                SELECT COALESCE(SUM(p.price), 0) AS total
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.start_date <= ? AND us.expiry_date > ?
                  AND (
                      (YEAR(us.start_date) = YEAR(?) AND MONTH(us.start_date) = MONTH(?))
                      OR (YEAR(us.expiry_date) = YEAR(?) AND MONTH(us.expiry_date) = MONTH(?))
                      OR (us.start_date < ? AND us.expiry_date > ?)
                  )
            `, [nextMonthEnd, nextMonthStart,
                nextMonthEnd, nextMonthEnd,
                nextMonthEnd, nextMonthEnd,
                nextMonthStart, nextMonthEnd]);

            // ── User / subscription state as-of period end ─────────────────
            // (these are current state counts; truly historical point-in-time
            //  would require audit-log tables which don't exist yet, so we
            //  scope what we can to the period and leave live counts for the rest)
            const [[totalUsersRow]] = await db.query(`SELECT COUNT(*) AS count FROM users`);

            const [[activeSubsRow]] = await db.query(`
                SELECT COUNT(DISTINCT user_id) AS count FROM user_subscriptions
                WHERE expiry_date > ?
            `, [nowTs]);

            const [[overdueRow]] = await db.query(`
                SELECT COUNT(DISTINCT user_id) AS count FROM user_subscriptions
                WHERE TIMESTAMPDIFF(DAY, ?, expiry_date) <= 5 AND expiry_date > ?
            `, [nowTs, nowTs]);

            const [[newClientsRow]] = await db.query(`
                SELECT COUNT(*) AS count FROM users
                WHERE created_at BETWEEN ? AND ? AND is_active = TRUE
            `, [periodStart, periodEnd]);

            // ── Operational counts (period-scoped where possible) ──────────
            const [[pendingBookingsRow]] = await db.query(
                `SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'`
            );

            const [[pendingTicketsRow]] = await db.query(`
                SELECT COUNT(*) AS count FROM support_tickets
                WHERE status IN ('open', 'pending') AND is_archived = FALSE
            `);

            const [[pendingTasksRow]] = await db.query(`
                SELECT COUNT(*) AS count FROM assignments
                WHERE status IN ('pending', 'seen')
            `);

            const [[staffOnDutyRow]] = await db.query(`
                SELECT COUNT(DISTINCT staff_id) AS count FROM staff_attendance
                WHERE DATE(attendance_date) = DATE(?) AND status = 'present'
            `, [nowTs]);

            // ── Renewals due next 7 days ────────────────────────────────────
            const sevenOut = toSql(dayjs().add(7, "day").toDate());
            const [[renewalsRow]] = await db.query(`
                SELECT COUNT(*) AS count FROM user_subscriptions
                WHERE status = 'active' AND expiry_date BETWEEN ? AND ?
            `, [nowTs, sevenOut]);

            // ── Inventory (always current snapshot) ────────────────────────
            const [[invTotalRow]]    = await db.query(`SELECT COUNT(*) AS total_items, COALESCE(SUM(unit_price), 0) AS total_value FROM items`);
            const [[invInStockRow]]  = await db.query(`SELECT COUNT(*) AS count FROM items WHERE status = 'in-stock'`);
            const [[invLowRow]]      = await db.query(`SELECT COUNT(*) AS count FROM items WHERE status = 'low-stock'`);
            const [[invOutRow]]      = await db.query(`SELECT COUNT(*) AS count FROM items WHERE status = 'out-stock'`);

            // ── monthly_expenses from expenses table (period-scoped) ────────
            const monthlyExpenses = Number(expRow.total || 0);

            // ── Derived ────────────────────────────────────────────────────
            const subRev   = Number(subRevRow.total  || 0);
            const salesRev = Number(salesRevRow.total || 0);
            const totalRev = subRev + salesRev;
            const hrExp    = Number(hrExpRow.total    || 0);
            const salaries = Number(salariesRow.total || 0);

            return {
                meta: {
                    period_label: label,
                    period_start: periodStart,
                    period_end:   periodEnd,
                    generated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                },
                financial: {
                    monthly_subscription_revenue: subRev,
                    monthly_sales_revenue:        salesRev,
                    monthly_revenue:              totalRev,
                    monthly_expenditure:          hrExp,
                    staff_salaries_payable:       salaries,
                    projected_revenue:            Number(projRow.total || 0),
                    total_users:                  totalUsersRow.count,
                    active_subscriptions:         activeSubsRow.count,
                    overdue_users:                overdueRow.count,
                    new_clients_period:           newClientsRow.count,
                    pending_bookings:             pendingBookingsRow.count,
                    pending_tickets:              pendingTicketsRow.count,
                    pending_tasks:                pendingTasksRow.count,
                    staff_on_duty:                staffOnDutyRow.count,
                    in_stock_count:               invInStockRow.count,
                },
                metrics: {
                    monthly_expenses: monthlyExpenses,
                    renewals_due:     renewalsRow.count,
                },
                inventory: {
                    total_items:     invTotalRow.total_items,
                    inventory_value: invTotalRow.total_value,
                    low_stock:       invLowRow.count,
                    out_of_stock:    invOutRow.count,
                },
            };
        } catch (error) {
            console.error("DashboardReport generation error:", error);
            throw error;
        }
    },
};

module.exports = DashboardReport;
