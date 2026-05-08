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
    /**
     * Generate analytics report data for the requested period.
     *
     * @param {object} params
     * @param {string} params.period       - "current" | "last" | "custom"
     * @param {string} [params.year]       - YYYY  (custom month mode)
     * @param {string} [params.month]      - M     (custom month mode)
     * @param {string} [params.date_from]  - YYYY-MM-DD (custom range mode)
     * @param {string} [params.date_to]    - YYYY-MM-DD (custom range mode)
     *
     * @returns {Promise<object>} Structured report data
     */
    generate: async (params = {}) => {
        const { start, end, label } = resolvePeriod(params);

        const periodStart = toSqlDatetime(start.toDate());
        const periodEnd   = toSqlDatetime(end.toDate());
        
        const [
            [currentSubRev],
            [currentSalesRev],
            [monthlyExpenditure],
            [staffSalaries],
            [newSubscriptionsCount],
            [newClientsCount],
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
                SELECT COALESCE(SUM(ss.basic_salary), 0) AS total 
                FROM staff_salaries ss
                JOIN staff s ON ss.staff_id = s.id
                WHERE ss.effective_to IS NULL AND s.is_active = TRUE
            `),

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

        const subRevTotal   = Number(currentSubRev[0]?.total   || 0);
        const salesRevTotal = Number(currentSalesRev[0]?.total || 0);
        const totalRevenue  = subRevTotal + salesRevTotal;

        const hrexpenses   = Number(monthlyExpenditure[0]?.total || 0);
        const salaries     = Number(staffSalaries[0]?.total || 0);
        const totalExpenditure = hrexpenses + salaries;
        const netProfit    = totalRevenue - totalExpenditure;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            meta: {
                period_label:  label,
                period_start:  start.format("YYYY-MM-DD"),
                period_end:    end.format("YYYY-MM-DD"),
                generated_at:  dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },

            financial: {
                total_revenue:           totalRevenue,
                subscription_revenue:    subRevTotal,
                sales_revenue:           salesRevTotal,
                monthly_expenditure:     hrexpenses,
                staff_salaries_payable:  salaries,
                total_expenditure:       totalExpenditure,
                net_profit:              netProfit,
                profit_margin_pct:       parseFloat(profitMargin.toFixed(1)),
            },

            clients: {
                new_clients_count:      Number(newClientsCount[0]?.count || 0),
                new_subscriptions_count: Number(newSubscriptionsCount[0]?.count || 0),
            }
        };
    },
};

module.exports = AnalyticsReport;