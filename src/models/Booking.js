const db = require("../config/db");

const Booking = {
  create: async (data) => {
    let {
      name,
      phone,
      email,
      location,
      exact_location,
      package: pkg,
      extra_notes,
      installation_date,
      status,
    } = data;

    installation_date = installation_date || null;
    status = status || "pending";
    extra_notes = extra_notes || null;
    exact_location = exact_location || null;
    pkg = pkg || null;

    const [result] = await db.query(
      `INSERT INTO bookings
      (name, phone, email, location, exact_location, package, extra_notes, installation_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email, location, exact_location, pkg, extra_notes, installation_date, status]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM bookings ORDER BY created_at DESC`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM bookings WHERE id=?`, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    if (data.installation_date === "") data.installation_date = null;
    if (data.status === "") data.status = "pending";

    const fields = Object.keys(data).map((key) => `${key}=?`).join(", ");
    const values = [...Object.values(data), id];
    const [result] = await db.query(`UPDATE bookings SET ${fields} WHERE id=?`, values);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM bookings WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Booking;
