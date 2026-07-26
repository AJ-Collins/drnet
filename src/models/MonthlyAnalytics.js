const db = require("../config/db");
const dayjs = require("dayjs");

const toSqlDatetime = (d) => dayjs(d).format("YYYY-MM-DD HH:mm:ss");

/**
 * Pulls live figures for a single calendar month from the source tables.
 * This is the "system says" half of each computed_ field.
 */
async function computeSystemValuesForMonth(year, month) {
    const monthStart = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).startOf("month");
    const monthEnd   = monthStart.endOf("month");
    const periodStart = toSqlDatetime(monthStart.toDate());
    const periodEnd   = toSqlDatetime(monthEnd.toDate());
    const monthStartDate = monthStart.format("YYYY-MM-DD");

    const [
        [subRev],
        [salesRev],
        [hrexp],
        [salaries],
        [newSubs],
        [newClients],
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
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM hrexpenses
            WHERE expense_date BETWEEN DATE(?) AND DATE(?)
        `, [periodStart, periodEnd]),

        db.query(`
            SELECT COALESCE(SUM(ss.net_salary), 0) AS total
            FROM staff_salaries ss
            WHERE ss.effective_from <= LAST_DAY(?)
              AND (ss.effective_to IS NULL OR ss.effective_to >= ?)
        `, [monthStartDate, monthStartDate]),

        db.query(`
            SELECT COUNT(*) AS count
            FROM user_subscriptions
            WHERE created_at BETWEEN ? AND ?
        `, [periodStart, periodEnd]),

        db.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE created_at BETWEEN ? AND ?
              AND is_active = TRUE
        `, [periodStart, periodEnd]),
    ]);

    return {
        subscription_revenue:    Number(subRev[0]?.total    || 0),
        sales_revenue:           Number(salesRev[0]?.total  || 0),
        hrexpenses:              Number(hrexp[0]?.total      || 0),
        staff_salaries:          Number(salaries[0]?.total  || 0),
        new_subscriptions_count: Number(newSubs[0]?.count   || 0),
        new_clients_count:       Number(newClients[0]?.count || 0),
    };
}

const MonthlyAnalytics = {
    computeSystemValuesForMonth,

    /**
     * Fetch the stored row for a month, creating it (with fresh system
     * figures, zero adjustments) if it doesn't exist yet.
     */
    async getOrCreateForMonth(year, month) {
        const [existing] = await db.query(
            `SELECT * FROM monthly_analytics WHERE year = ? AND month = ?`,
            [year, month]
        );
        if (existing.length) return existing[0];

        const c = await computeSystemValuesForMonth(year, month);
        await db.query(`
            INSERT IGNORE INTO monthly_analytics
                (year, month,
                 computed_subscription_revenue, computed_sales_revenue,
                 computed_hrexpenses, computed_staff_salaries,
                 computed_new_clients_count, computed_new_subscriptions_count,
                 last_computed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            year, month,
            c.subscription_revenue, c.sales_revenue,
            c.hrexpenses, c.staff_salaries,
            c.new_clients_count, c.new_subscriptions_count,
        ]);

        const [[row]] = await db.query(
            `SELECT * FROM monthly_analytics WHERE year = ? AND month = ?`,
            [year, month]
        );
        return row;
    },

    /**
     * Refresh the computed_* columns from live data without touching
     * any admin adjustment. Use when late transactions land for a past
     * month and the admin wants the system side re-synced.
     */
    async recompute(year, month) {
        const c = await computeSystemValuesForMonth(year, month);
        await db.query(`
            UPDATE monthly_analytics SET
                computed_subscription_revenue = ?,
                computed_sales_revenue        = ?,
                computed_hrexpenses           = ?,
                computed_staff_salaries       = ?,
                computed_new_clients_count    = ?,
                computed_new_subscriptions_count = ?,
                last_computed_at              = NOW()
            WHERE year = ? AND month = ?
        `, [
            c.subscription_revenue, c.sales_revenue,
            c.hrexpenses, c.staff_salaries,
            c.new_clients_count, c.new_subscriptions_count,
            year, month,
        ]);
        return this.getOrCreateForMonth(year, month);
    },

    /**
     * Admin edits: deltas for the computed fields, direct values for the
     * manual-only fields (hotspot_revenue, hotspot_subscriptions_count).
     *
     * @param {number} year
     * @param {number} month
     * @param {object} opts
     * @param {object} [opts.adjustments]                - keyed by field name, value is the delta
     * @param {number} [opts.hotspot_revenue]
     * @param {number} [opts.hotspot_subscriptions_count]
     * @param {string} [opts.notes]
     * @param {number} [opts.updated_by]
     * @param {boolean} [opts.is_locked]
     */
    async updateAdjustments(year, month, {
        adjustments = {},
        hotspot_revenue,
        hotspot_subscriptions_count,
        revenue_injection,
        notes,
        updated_by,
        is_locked,
    } = {}) {
        await this.getOrCreateForMonth(year, month); // ensure row exists

        const adjustmentColumnMap = {
            subscription_revenue:    "adjustment_subscription_revenue",
            sales_revenue:           "adjustment_sales_revenue",
            hrexpenses:              "adjustment_hrexpenses",
            staff_salaries:          "adjustment_staff_salaries",
            new_clients_count:       "adjustment_new_clients_count",
            new_subscriptions_count: "adjustment_new_subscriptions_count",
        };

        const setClauses = [];
        const values = [];

        for (const [key, column] of Object.entries(adjustmentColumnMap)) {
            if (adjustments[key] !== undefined) {
                setClauses.push(`${column} = ?`);
                values.push(adjustments[key]);
            }
        }
        if (hotspot_revenue !== undefined) {
            setClauses.push("hotspot_revenue = ?");
            values.push(hotspot_revenue);
        }
        if (hotspot_subscriptions_count !== undefined) {
            setClauses.push("hotspot_subscriptions_count = ?");
            values.push(hotspot_subscriptions_count);
        }
        if (revenue_injection !== undefined) {
            setClauses.push("revenue_injection = ?");
            values.push(revenue_injection);
        }
        if (notes !== undefined) {
            setClauses.push("notes = ?");
            values.push(notes);
        }
        if (updated_by !== undefined) {
            setClauses.push("updated_by = ?");
            values.push(updated_by);
        }
        if (is_locked !== undefined) {
            setClauses.push("is_locked = ?");
            values.push(is_locked ? 1 : 0);
        }

        if (!setClauses.length) return this.getOrCreateForMonth(year, month);

        values.push(year, month);
        await db.query(
            `UPDATE monthly_analytics SET ${setClauses.join(", ")} WHERE year = ? AND month = ?`,
            values
        );

        return this.getOrCreateForMonth(year, month);
    },

    /**
     * All months from (startYear, startMonth) to (endYear, endMonth) inclusive,
     * creating any missing rows along the way.
     */
    async getRange(startYear, startMonth, endYear, endMonth) {
        const months = [];
        let cursor = dayjs(`${startYear}-${String(startMonth).padStart(2, "0")}-01`);
        const last  = dayjs(`${endYear}-${String(endMonth).padStart(2, "0")}-01`);

        while (cursor.isBefore(last) || cursor.isSame(last, "month")) {
            months.push({ year: cursor.year(), month: cursor.month() + 1 });
            cursor = cursor.add(1, "month");
        }

        return Promise.all(months.map(({ year, month }) => this.getOrCreateForMonth(year, month)));
    },

    async findEarliestDataMonth() {
        const [rows] = await db.query(`
            SELECT MIN(d) AS earliest FROM (
                SELECT MIN(created_at)    AS d FROM user_subscriptions
                UNION ALL
                SELECT MIN(sold_date)     AS d FROM sales
                UNION ALL
                SELECT MIN(expense_date)  AS d FROM hrexpenses
                UNION ALL
                SELECT MIN(effective_from) AS d FROM staff_salaries
                UNION ALL
                SELECT MIN(created_at)    AS d FROM users
            ) all_dates
        `);
        const earliest = rows[0]?.earliest;
        if (!earliest) return null; // no data anywhere yet
        const d = dayjs(earliest);
        return { year: d.year(), month: d.month() + 1 };
    },

    async backfillAll({ startYear, startMonth, endYear, endMonth } = {}) {
        let start = startYear && startMonth
            ? { year: startYear, month: startMonth }
            : await this.findEarliestDataMonth();

        if (!start) return { created: 0, months: [] };

        let end = endYear && endMonth
            ? { year: endYear, month: endMonth }
            : { year: dayjs().year(), month: dayjs().month() + 1 }; // current month

        const results = await this.getRange(start.year, start.month, end.year, end.month);
        return {
            created: results.length,
            months: results.map(r => `${r.year}-${String(r.month).padStart(2, "0")}`),
        };
    },
};

module.exports = MonthlyAnalytics;
