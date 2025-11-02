const db = require('../config/db');

async function checkCurrentRoles() {
  try {
    console.log('🔍 Checking current staff roles...');
    
    const [staffRows] = await db.execute('SELECT employee_id, name, position FROM staff');
    
    console.log('Current staff records:');
    staffRows.forEach(staff => {
      console.log(`${staff.employee_id}: ${staff.name} - Position: "${staff.position}"`);
    });
    
  } catch (err) {
    console.error('❌ Error checking staff roles:', err.message);
  }
  process.exit();
}

checkCurrentRoles();