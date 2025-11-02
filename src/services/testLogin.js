const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing staff login...');
    
    const response = await fetch('http://localhost:5000/api/staff/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: 'ADMIN001',
        password: 'admin123'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Test if we can access the specific dashboard
    if (data.redirectUrl) {
      console.log('\nTesting dashboard access...');
      const dashboardResponse = await fetch(`http://localhost:5000${data.redirectUrl}`, {
        method: 'GET',
        headers: {
          'Cookie': response.headers.get('set-cookie') || ''
        }
      });
      console.log('Dashboard access status:', dashboardResponse.status);
    }
    
  } catch (err) {
    console.error('Test login error:', err.message);
  }
}

testLogin();