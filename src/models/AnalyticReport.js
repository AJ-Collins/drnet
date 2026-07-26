const db = require("../config/db");
const dayjs = require("dayjs");
const MonthlyAnalytics = require("./MonthlyAnalytics");

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
     * Generate analytics report data for the requested period.
     *
     * Data is sourced from monthly_analytics rows (computed + adjustments),
     * so admin corrections persist across reloads and live table changes
     * only affect the computed_ columns (via recompute).
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

        // Collect every calendar month touched by the requested period
        const monthsSpanned = [];
        let cursor = start.startOf("month");
        const lastMonth = end.startOf("month");
        while (cursor.isBefore(lastMonth) || cursor.isSame(lastMonth, "month")) {
            monthsSpanned.push({ year: cursor.year(), month: cursor.month() + 1 });
            cursor = cursor.add(1, "month");
        }

        // Fetch (or create) the stored analytics row for each month.
        // getOrCreateForMonth seeds missing rows with live system data automatically.
        const rows = await Promise.all(
            monthsSpanned.map(({ year, month }) =>
                MonthlyAnalytics.getOrCreateForMonth(year, month)
            )
        );

        // Helper: sum computed + adjustment across all rows for a pair of columns
        const sumField = (computedCol, adjustmentCol) =>
            rows.reduce(
                (acc, r) => acc + Number(r[computedCol] || 0) + Number(r[adjustmentCol] || 0),
                0
            );

        const subRevTotal    = sumField("computed_subscription_revenue", "adjustment_subscription_revenue");
        const salesRevTotal  = sumField("computed_sales_revenue",        "adjustment_sales_revenue");
        const hotspotRevenue = rows.reduce((acc, r) => acc + Number(r.hotspot_revenue || 0), 0);
        const totalRevenue   = subRevTotal + salesRevTotal + hotspotRevenue;

        const hrexpenses       = sumField("computed_hrexpenses",    "adjustment_hrexpenses");
        const salaries         = sumField("computed_staff_salaries", "adjustment_staff_salaries");
        const totalExpenditure = hrexpenses + salaries;

        const netProfit    = totalRevenue - totalExpenditure;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const newClientsCount = rows.reduce(
            (acc, r) =>
                acc + Number(r.computed_new_clients_count || 0) + Number(r.adjustment_new_clients_count || 0),
            0
        );
        const newSubscriptionsCount = rows.reduce(
            (acc, r) =>
                acc +
                Number(r.computed_new_subscriptions_count || 0) +
                Number(r.adjustment_new_subscriptions_count || 0),
            0
        );
        const hotspotSubscriptionsCount = rows.reduce(
            (acc, r) => acc + Number(r.hotspot_subscriptions_count || 0),
            0
        );
        const revenueInjection = rows.reduce(
            (acc, r) => acc + Number(r.revenue_injection || 0),
            0
        );

        return {
            meta: {
                period_label:     label,
                period_start:     start.format("YYYY-MM-DD"),
                period_end:       end.format("YYYY-MM-DD"),
                generated_at:     dayjs().format("YYYY-MM-DD HH:mm:ss"),
                months_included:  monthsSpanned.map(
                    (m) => `${m.year}-${String(m.month).padStart(2, "0")}`
                ),
            },

            financial: {
                total_revenue:          totalRevenue,
                subscription_revenue:   subRevTotal,
                sales_revenue:          salesRevTotal,
                hotspot_revenue:        hotspotRevenue,
                monthly_expenditure:    hrexpenses,
                staff_salaries_payable: salaries,
                total_expenditure:      totalExpenditure,
                net_profit:             netProfit,
                profit_margin_pct:      parseFloat(profitMargin.toFixed(1)),
                revenue_injection:      revenueInjection,
            },

            clients: {
                new_clients_count:           newClientsCount,
                new_subscriptions_count:     newSubscriptionsCount,
                hotspot_subscriptions_count: hotspotSubscriptionsCount,
            },
        };
    },
};

module.exports = AnalyticsReport;