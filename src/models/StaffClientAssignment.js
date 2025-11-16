const db = require("../config/db");

const TABLE = "assignments";

const StaffClientAssignment = {
  create: async (data) => {
    const fields = [
      "clientName",
      "clientContact",
      "serviceType",
      "priority",
      "scheduledDate",
      "estimatedDuration",
      "technicianId",
      "supervisorId",
      "description",
      "requiredEquipment",
      "status",
      "address",
    ];

    const values = fields.map((f) => {
      if (f === "status") return data[f] || "assigned";
      if (f === "address") return data.serviceAddress || data.address || null;
      return data[f] ?? null;
    });

    const placeholders = fields.map(() => "?").join(",");

    const [result] = await db.query(
      `INSERT INTO ${TABLE} (${fields.join(",")}) VALUES (${placeholders})`,
      values
    );

    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLE} ORDER BY scheduledDate DESC`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  findMyAssignments: async (userId) => {
    console.log("Finding assignments for technician userId:", userId);

    const [rows] = await db.query(
      `
      SELECT 
        a.id,
        a.clientName,
        a.clientContact,
        a.serviceType,
        a.priority,
        a.scheduledDate,
        a.estimatedDuration,
        a.description,
        a.requiredEquipment,
        a.status,
        a.address,
        a.completedAt,
        a.createdAt,
        CONCAT(t.first_name, ' ', t.second_name) AS technician_name,
        CONCAT(s.first_name, ' ', s.second_name) AS supervisor_name
      FROM assignments a
      LEFT JOIN staff t ON a.technicianId = t.id
      LEFT JOIN staff s ON a.supervisorId = s.id
      WHERE a.technicianId = ?
      ORDER BY a.scheduledDate ASC
      `,
      [userId]
    );

    console.log(`Query returned ${rows.length} assignments for technician ${userId}`);
    return rows;
  },

  update: async (id, data) => {
    if (data.serviceAddress) {
      data.address = data.serviceAddress;
      delete data.serviceAddress;
    }

    const entries = Object.entries(data).filter(([_, v]) => v !== undefined);

    if (entries.length === 0) return { affectedRows: 0 };

    const fields = entries.map(([key]) => `${key}=?`).join(",");
    const values = entries.map(([_, val]) => val);

    values.push(id);

    const [result] = await db.query(
      `UPDATE ${TABLE} SET ${fields} WHERE id = ?`,
      values
    );

    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return result;
  },
};

module.exports = StaffClientAssignment;
