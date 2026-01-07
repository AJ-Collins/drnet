const db = require("../config/db");

const HrPlanner = {
  findAll: async () => {
    const sql = `
      SELECT *
      FROM (
        SELECT 
          id,
          description AS item_desc,
          category AS type,
          duration,
          task_date AS event_date,
          status,
          'task' AS source
        FROM hrtasks
        
        UNION ALL
        
        SELECT 
          id,
          CONCAT('Installation: ', name) AS item_desc,
          'Booking' AS type,
          'N/A' AS duration,
          STR_TO_DATE(date, '%Y-%m-%d') AS event_date,
          status,
          'booking' AS source
        FROM hrbookings
        
        UNION ALL
        
        SELECT 
          id,
          CONCAT(category, ' – ', beneficiary) AS item_desc,
          category AS type,
          'N/A' AS duration,
          expense_date AS event_date,
          status,
          'expense' AS source
        FROM hrexpenses
      ) planner
      ORDER BY event_date DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  updateStatus: async (id, status, source) => {
    let tableName = '';
    
    if (source === 'task') tableName = 'hrtasks';
    else if (source === 'booking') tableName = 'hrbookings';
    else if (source === 'expense') tableName = 'hrexpenses';
    else throw new Error('Invalid source');

    const sql = `UPDATE ${tableName} SET status = ? WHERE id = ?`;
    await db.query(sql, [status, id]);
    
    return { id, status, source };
  }
};

module.exports = HrPlanner;