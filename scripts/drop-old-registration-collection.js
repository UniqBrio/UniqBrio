const { getMongoClient, closeConnections } = require('../lib/mongodb.js');

async function dropOldCollection() {
  try {
    const { client, db } = await getMongoClient();
    
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