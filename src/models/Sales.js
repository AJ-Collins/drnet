const db = require("../config/db");
const dayjs = require("dayjs");

/**
 * Helper to convert JS Date objects to MySQL DATETIME strings
 * Format: YYYY-MM-DD HH:mm:ss
 */
const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

class Sale {
    // Fetch all sales ordered by date
    static async findAll() {
        const [rows] = await db.query(`
            SELECT s.*, i.serial_number 
            FROM sales s
            LEFT JOIN items i ON s.item_id = i.id
            ORDER BY s.sold_date DESC
        `);
        return rows;
    }

    // Create a new sale
    static async create(data) {
        const { 
            item_id, item_name, customer_name, customer_contact, 
            quantity, unit_price, payment_status, payment_method, 
            sold_date, notes 
        } = data;

        const total_amount = quantity * unit_price;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const [result] = await connection.query(`
                INSERT INTO sales 
                (item_id, item_name, customer_name, customer_contact, quantity, unit_price, total_amount, payment_status, payment_method, sold_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [item_id || null, item_name, customer_name, customer_contact, quantity, unit_price, total_amount, payment_status, payment_method, sold_date || new Date(), notes]);

            if (item_id) {
                await connection.query(
                    "UPDATE items SET status = 'out-stock' WHERE id = ?",
                    [item_id]
                );
            }

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, data) {
        const { 
            customer_name, customer_contact, quantity, unit_price, 
            payment_status, payment_method, sold_date, notes 
        } = data;

        const total_amount = quantity * unit_price;

        const [result] = await db.query(`
            UPDATE sales SET
            customer_name=?, customer_contact=?, quantity=?, unit_price=?, 
            total_amount=?, payment_status=?, payment_method=?, sold_date=?, notes=?
            WHERE id=?
        `, [customer_name, customer_contact, quantity, unit_price, total_amount, payment_status, payment_method, sold_date, notes, id]);

        return result;
    }

    static async delete(id) {
        const [result] = await db.query("DELETE FROM sales WHERE id = ?", [id]);
        return result;
    }
}

module.exports = Sale;