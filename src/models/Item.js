const db = require("../config/db");

const Item = {
  // CREATE multiple units (one query for efficiency)
  createBulk: async (data) => {
    const { name, category, brand, unit_price, added_by, serial_numbers } = data;
    const values = serial_numbers.map(sn => [
      name, sn, category, brand, unit_price || 0, 'in-stock', added_by
    ]);

    const [result] = await db.query(
      `INSERT INTO items (name, serial_number, category, brand, unit_price, status, added_by) VALUES ?`,
      [values]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`
      SELECT i.*, CONCAT(s.first_name, ' ', s.second_name) AS added_by_name
      FROM items i
      LEFT JOIN staff s ON i.added_by = s.id
      ORDER BY i.name ASC, i.created_at DESC
    `);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM items WHERE id = ?`, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    const allowed = ['name', 'serial_number', 'category', 'brand', 'unit_price'];
    const fields = [];
    const values = [];

    for (const key in data) {
      if (allowed.includes(key)) {
        fields.push(`${key}=?`);
        values.push(data[key]);
      }
    }
    values.push(id);
    return await db.query(`UPDATE items SET ${fields.join(", ")} WHERE id=?`, values);
  },

  delete: async (id) => {
    return await db.query(`DELETE FROM items WHERE id=?`, [id]);
  }
};

module.exports = Item;