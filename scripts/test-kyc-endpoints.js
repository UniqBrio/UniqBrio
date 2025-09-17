// Test script to verify the KYC API endpoints are working after the schema fix
const https = require('http');

async function testKycEndpoints() {
  console.log('🧪 Testing KYC API endpoints after schema fix...\n');

  // Test KYC queue endpoint
  console.log('📋 Testing KYC Queue endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/admin-data?type=kyc-queue', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ KYC Queue endpoint working!');
      console.log(`   📊 Found ${data.length || 0} KYC submissions in queue`);
    } else {
      console.log(`❌ KYC Queue endpoint failed with status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ KYC Queue endpoint error: ${error.message}`);
  }

  console.log('');

  // Test Academies endpoint
  console.log('🏫 Testing Academies endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/admin-data?type=academies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Academies endpoint working!');
      console.log(`   📊 Found ${data.length || 0} academies`);
    } else {
      console.log(`❌ Academies endpoint failed with status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Academies endpoint error: ${error.message}`);
  }

  console.log('');

  // Test Dashboard Stats endpoint
  console.log('📈 Testing Dashboard Stats endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/admin-data?type=dashboard-stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard Stats endpoint working!');
      console.log(`   📊 Stats: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`❌ Dashboard Stats endpoint failed with status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Dashboard Stats endpoint error: ${error.message}`);
  }

  console.log('\n🎉 API endpoint testing completed!');
}

// Add a small delay to ensure server is ready
setTimeout(testKycEndpoints, 2000);