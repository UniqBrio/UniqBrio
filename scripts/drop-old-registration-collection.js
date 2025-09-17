const { MongoClient } = require('mongodb');

async function dropOldCollection() {
  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Dropping old "Registration" collection...');
    await db.collection('Registration').drop();
    console.log('Old "Registration" collection dropped successfully!');
    
  } catch (error) {
    console.error('Error dropping collection:', error);
  } finally {
    await client.close();
  }
}

dropOldCollection();