const db = require("../config/db");

const RolePermission = {
  assign: async (role_id, permission_id) => {
    const [result] = await db.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      [role_id, permission_id]
    );
    return result;
  },

  remove: async (role_id, permission_id) => {
    const [result] = await db.query(
      `DELETE FROM role_permissions WHERE role_id=? AND permission_id=?`,
      [role_id, permission_id]
    );
    return result;
  },

  findAllByRole: async (role_id) => {
    const [rows] = await db.query(
      `SELECT * FROM role_permissions WHERE role_id=?`,
      [role_id]
    );
    return rows;
  },
};

module.exports = RolePermission;
