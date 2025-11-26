const mongoose = require('mongoose');

async function checkIncomeTenants() {
  try {
    await mongoose.connect('mongodb://localhost:27017/uniqbrio');
    console.log('Connected to MongoDB');
    
    const incomes = await mongoose.connection.db.collection('incomes').find({}).limit(10).toArray();
    
    console.log('\n=== INCOME RECORDS ===');
    console.log(`Total found: ${incomes.length}`);
    
    incomes.forEach((inc, idx) => {
      console.log(`\n${idx + 1}. Income:`, {
        _id: inc._id,
        amount: inc.amount,
        tenantId: inc.tenantId,
        date: inc.date
      });
    });
    
    const tenantGroups = {};
    incomes.forEach(inc => {
      const tid = inc.tenantId || 'NO_TENANT_ID';
      tenantGroups[tid] = (tenantGroups[tid] || 0) + 1;
    });
    
    console.log('\n=== TENANT DISTRIBUTION ===');
    Object.entries(tenantGroups).forEach(([tid, count]) => {
      console.log(`${tid}: ${count} records`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkIncomeTenants();
