const db = require("../config/db");

class Booking {
    // CREATE a new booking
    static async create(data) {
        const { name, phone, email, location, exact_location, packageId, extra_notes } = data;
        const [result] = await db.query(
            `INSERT INTO bookings (name, phone, email, location, exact_location, packageId, extra_notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, phone, email, location, exact_location, packageId, extra_notes]
        );
        return result.insertId;
    }

    // READ all bookings
    static async findAll() {
        const [rows] = await db.query(`
            SELECT b.*, p.name as package_name, p.price as package_price
            FROM bookings b
            LEFT JOIN packages p ON b.packageId = p.id
            ORDER BY b.created_at DESC
        `);
        return rows;
    }

    // Find specific booking by ID
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT b.*, p.name as package_name 
             FROM bookings b
             LEFT JOIN packages p ON b.packageId = p.id
             WHERE b.id = ?`, 
            [id]
        );
        return rows[0];
    }

    // Update Status
    static async updateStatus(id, status) {
        const [result] = await db.query(
            "UPDATE bookings SET status = ? WHERE id = ?",
            [status, id]
        );
        return result;
    }

    // Remove a booking
    static async delete(id) {
        const [result] = await db.query("DELETE FROM bookings WHERE id = ?", [id]);
        return result;
    }
}

module.exports = Booking;