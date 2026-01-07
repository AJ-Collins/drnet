const db = require("../config/db");

const HrBooking = {
  create: async (data) => {
    const sql = `INSERT INTO hrbookings 
      (name, phone, email, location, packageId, notes, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const [result] = await db.query(sql, [
      data.name, data.phone, data.email, data.location, 
      data.packageId, data.notes, data.date
    ]);
    return { id: result.insertId, ...data };
  },

  findAll: async () => {
    const sql = `
      SELECT 
        b.*, 
        p.name AS packageName, 
        p.price AS price,
        p.speed AS speed
      FROM hrbookings b
      INNER JOIN packages p ON b.packageId = p.id
      ORDER BY b.id DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  update: async (id, data) => {
    const sql = `UPDATE hrbookings SET 
      name=?, phone=?, email=?, location=?, packageId=?, notes=?, date=? 
      WHERE id=?`;
    
    await db.query(sql, [
      data.name, data.phone, data.email, data.location, 
      data.packageId, data.notes, data.date, id
    ]);
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM hrbookings WHERE id = ?", [id]);
    return true;
  }
};

module.exports = HrBooking;