require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: false });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('uniqbrio');
    console.log('✅ Using database: uniqbrio');
    
    const users = await db.collection('User').find({}).toArray();
    console.log(`\n📊 Found ${users.length} users in User collection:`);
    
    users.forEach(u => {
      console.log(`  - Email: ${u.email}`);
      console.log(`    Has Password: ${!!u.password}`);
      console.log(`    Academy ID: ${u.academyId || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
