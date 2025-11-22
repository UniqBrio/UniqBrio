// Quick diagnostic script to test payment API endpoints
const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, name) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${name} FAILED (${response.status}):`, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ ${name} SUCCESS`);
    console.log(`   Data keys:`, Object.keys(data));
    
    if (Array.isArray(data)) {
      console.log(`   Array length: ${data.length}`);
      if (data.length > 0) {
        console.log(`   First item keys:`, Object.keys(data[0]));
      }
    }
    
    return data;
  } catch (error) {
    console.error(`❌ ${name} ERROR:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Payment API Diagnostics...');
  console.log('='.repeat(50));
  
  await testAPI('/api/dashboard/payments/analytics', 'Analytics API');
  await testAPI('/api/dashboard/payments/all-students', 'All Students API');
  await testAPI('/api/dashboard/payments/course-summary', 'Course Summary API');
  await testAPI('/api/dashboard/payments/cohort-dates-all', 'Cohort Dates API');
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Diagnostics Complete');
}

runTests();
