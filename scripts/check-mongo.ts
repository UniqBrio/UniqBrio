import { MongoClient } from 'mongodb';

async function checkCollections() {
  const url = process.env.DATABASE_URL || '';
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check registrations collection specifically
    const regs = await db.collection('registrations').find({}).toArray();
    console.log('\nRegistrations found:', regs.length);
    console.log(JSON.stringify(regs, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCollections();
