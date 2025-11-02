const db = require('../config/db');

async function revertStaffRole() {
  try {
    console.log('🔄 Reverting staff role back to Admin Assistant...');
    
    const [result] = await db.execute(
      'UPDATE staff SET position = ? WHERE position = ?', 
      ['Admin Assistant', 'CTIO (SysAdmin)']
    );
    
    console.log(`✅ Reverted ${result.affectedRows} staff record(s)`);
    
    // Verify the reversion
    const [staffRows] = await db.execute('SELECT employee_id, name, position FROM staff WHERE employee_id = ?', ['ADMIN001']);
    if (staffRows.length > 0) {
      console.log(`✅ Verification: ${staffRows[0].employee_id} - ${staffRows[0].name} - Position: "${staffRows[0].position}"`);
    }
    
  } catch (err) {
    console.error('❌ Error reverting staff role:', err.message);
  }
  process.exit();
}

revertStaffRole();