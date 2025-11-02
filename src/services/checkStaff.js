const db = require('../config/db');

(async () => {
  try {
    const [staffRows] = await db.execute('SELECT employee_id, name, position FROM staff WHERE employee_id IN (?, ?, ?)', ['ADMIN001', 'CARE001', 'LEAD001']);
    console.log('Staff records:');
    staffRows.forEach(staff => {
      console.log(`${staff.employee_id}: ${staff.name} - Position: "${staff.position}"`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
})();