const db = require('./db');
const bcrypt = require('bcryptjs');
const { createClient } = require('./models/Client');
const { createStaff } = require('./models/Staff');

async function seedInitialData() {
  console.log('🌱 Seeding initial data...');

  try {
    // Check if clients already exist
    const [clientRows] = await db.execute('SELECT COUNT(*) as count FROM clients');
    const clientCount = clientRows[0].count;

    if (clientCount === 0) {
      console.log('📱 Creating sample clients...');

      // Create sample clients
      const sampleClients = [
        {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main Street, New York, NY 10001',
          packageType: 'Premium Plus',
          monthlyFee: 79.99,
          startDate: '2024-01-15',
          expiryDate: '2025-01-15',
          password: await bcrypt.hash('password123', 10)
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '1234567891',
          address: '456 Oak Avenue, Los Angeles, CA 90210',
          packageType: 'Standard Plus',
          monthlyFee: 49.99,
          startDate: '2024-03-01',
          expiryDate: '2025-03-01',
          password: await bcrypt.hash('password123', 10)
        },
        {
          name: 'Mike Davis',
          email: 'mike@example.com',
          phone: '1234567892',
          address: '789 Pine Road, Chicago, IL 60601',
          packageType: 'Basic',
          monthlyFee: 29.99,
          startDate: '2024-06-10',
          expiryDate: '2025-06-10',
          password: await bcrypt.hash('password123', 10)
        },
        {
          name: 'Emily Chen',
          email: 'emily@example.com',
          phone: '1234567893',
          address: '321 Cedar Lane, Miami, FL 33101',
          packageType: 'Business Pro',
          monthlyFee: 149.99,
          startDate: '2024-02-20',
          expiryDate: '2025-02-20',
          password: await bcrypt.hash('password123', 10)
        },
        {
          name: 'Robert Wilson',
          email: 'robert@example.com',
          phone: '1234567894',
          address: '654 Elm Street, Seattle, WA 98101',
          packageType: 'Premium Plus',
          monthlyFee: 79.99,
          startDate: '2024-04-05',
          expiryDate: '2025-04-05',
          password: await bcrypt.hash('password123', 10)
        }
      ];

      for (const client of sampleClients) {
        await createClient(client);
      }

      console.log('✅ Sample clients created successfully');
    }

    // Check if staff already exist
    const [staffRows] = await db.execute('SELECT COUNT(*) as count FROM staff');
    const staffCount = staffRows[0].count;

    if (staffCount === 0) {
      console.log('👨‍💼 Creating sample staff...');

      // Create sample staff members with role-based positions
      const sampleStaff = [
        {
          name: 'Alex Rodriguez',
          email: 'alex@drnet.com',
          phone: '5551234567',
          employee_id: 'LEAD001',
          position: 'Supervisor',
          department: 'Technical Support',
          salary: 65000.00,
          password: await bcrypt.hash('staff123', 10),
          hire_date: '2023-01-15'
        },
        {
          name: 'Lisa Wang',
          email: 'lisa@drnet.com',
          phone: '5551234568',
          employee_id: 'CARE001',
          position: 'Customer Care',
          department: 'Customer Service',
          salary: 45000.00,
          password: await bcrypt.hash('staff123', 10),
          hire_date: '2023-03-10'
        },
        {
          name: 'Marcus Johnson',
          email: 'marcus@drnet.com',
          phone: '5551234569',
          employee_id: 'ADMIN001',
          position: 'CTIO (SysAdmin)',
          department: 'Administration',
          salary: 42000.00,
          password: await bcrypt.hash('staff123', 10),
          hire_date: '2023-05-20'
        },
        {
          name: 'Jennifer Lee',
          email: 'jennifer@drnet.com',
          phone: '5551234570',
          employee_id: 'TECH003',
          position: 'Senior Technician',
          department: 'Technical Support',
          salary: 55000.00,
          password: await bcrypt.hash('staff123', 10),
          hire_date: '2023-02-01'
        },
        {
          name: 'David Brown',
          email: 'david@drnet.com',
          phone: '5551234571',
          employee_id: 'NEW001',
          position: 'New Employee',
          department: 'Training',
          salary: 35000.00,
          password: await bcrypt.hash('staff123', 10),
          hire_date: '2024-10-01'
        },
        {
          name: 'Sarah Mitchell',
          email: 'sarah@drnet.com',
          phone: '5551234572',
          employee_id: 'FIELD001',
          position: 'Field Technician',
          department: 'Installation Services',
          salary: 48000.00,
          password: await bcrypt.hash('staff123', 10),
          hire_date: '2023-08-20'
        }
      ];

      for (const staff of sampleStaff) {
        await createStaff(staff);
      }

      console.log('✅ Sample staff created successfully');

      // Assign some clients to staff members
      console.log('🔗 Creating staff-client assignments...');

      // Get staff and client IDs
      const [staffList] = await db.execute('SELECT id FROM staff LIMIT 5');
      const [clientList] = await db.execute('SELECT id FROM clients LIMIT 5');

      // Create assignments
      if (staffList.length > 0 && clientList.length > 0) {
        await db.execute(
          `INSERT INTO staff_client_assignments (staff_id, client_id) VALUES 
           (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)`,
          [
            staffList[0].id, clientList[0].id,  // Alex -> John
            staffList[0].id, clientList[1].id,  // Alex -> Sarah  
            staffList[1].id, clientList[2].id,  // Lisa -> Mike
            staffList[1].id, clientList[3].id,  // Lisa -> Emily
            staffList[2].id, clientList[4].id   // Marcus -> Robert
          ]
        );

        // Create some sample tasks
        const today = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

        await db.execute(`
          INSERT INTO staff_tasks (staff_id, client_id, task_type, description, scheduled_time, priority, status)
          VALUES 
          (?, ?, 'Installation', 'Router installation and setup', ?, 'high', 'pending'),
          (?, ?, 'Technical Support', 'Internet connectivity troubleshooting', ?, 'medium', 'in_progress'),
          (?, ?, 'Follow-up', 'Service satisfaction check', ?, 'low', 'pending')
        `, [
          staffList[0].id, clientList[0].id, tomorrow,
          staffList[1].id, clientList[1].id, today,
          staffList[2].id, clientList[2].id, tomorrow
        ]);

        console.log('✅ Staff assignments and tasks created');
      }
    }

    console.log('🎉 Initial data seeding completed successfully');

  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
    throw error;
  }
}

module.exports = seedInitialData;