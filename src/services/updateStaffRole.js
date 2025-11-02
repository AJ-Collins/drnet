const db = require('../config/db');

async function updateStaffRole() {
  try {
    console.log('🔄 Updating Admin Assistant role to CTIO (SysAdmin)...');
    
    const [result] = await db.execute(
      'UPDATE staff SET position = ? WHERE position = ?', 
      ['CTIO (SysAdmin)', 'Admin Assistant']
    );
    
    console.log(`✅ Updated ${result.affectedRows} staff record(s)`);
    
    // Verify the update
    const [staffRows] = await db.execute('SELECT employee_id, name, position FROM staff WHERE employee_id = ?', ['ADMIN001']);
    if (staffRows.length > 0) {
      console.log(`✅ Verification: ${staffRows[0].employee_id} - ${staffRows[0].name} - Position: "${staffRows[0].position}"`);
    }
    
  } catch (err) {
    console.error('❌ Error updating staff role:', err.message);
  }
  process.exit();
}

updateStaffRole();