const db = require("../config/db");

const Item = {
  create: async (data) => {
    const {
      name,
      serial,
      category,
      totalQty,
      status = "available",
      brand,
      price,
      added_by,
      description,
    } = data;

    const [result] = await db.query(
      `INSERT INTO items 
      (name, serial_number, category, quantity, status, brand, unit_price, added_by, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        serial,
        category,
        totalQty,
        status,
        brand,
        price,
        added_by,
        description,
      ]
    );

    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        i.*,
        CONCAT(s.first_name, ' ', s.second_name) AS added_by
      FROM items i
      LEFT JOIN staff s ON i.added_by = s.id
    `);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `
      SELECT 
        i.*,
        CONCAT(s.first_name, ' ', s.second_name) AS added_by
      FROM items i
      LEFT JOIN staff s ON i.added_by = s.id
      WHERE i.id=?
    `,
      [id]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const mapping = {
      serial: "serial_number",
      totalQty: "quantity",
      price: "unit_price",
    };

    const fields = [];
    const values = [];

    for (const key in data) {
      const column = mapping[key] || key; // use mapped name if exists
      fields.push(`${column}=?`);
      values.push(data[key]);
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE items SET ${fields.join(",")} WHERE id=?`,
      values
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM items WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Item;
