const db = require("../config/db");

class Booking {
    // Fetch all bookings with package details
    static async findAll() {
        const [rows] = await db.query(`
            SELECT b.*, p.name as package_name 
            FROM bookings b
            LEFT JOIN packages p ON b.packageId = p.id
            ORDER BY b.created_at DESC
        `);
        return rows;
    }

    // Update only the status (Used by the inline dropdown)
    static async updateStatus(id, status) {
        const [result] = await db.query(
            "UPDATE bookings SET status = ? WHERE id = ?",
            [status, id]
        );
        return result;
    }

    // Delete a booking
    static async delete(id) {
        const [result] = await db.query("DELETE FROM bookings WHERE id = ?", [id]);
        return result;
    }

    // Find specific booking (needed for SMS dispatch context)
    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM bookings WHERE id = ?", [id]);
        return rows[0];
    }
}

module.exports = Booking;