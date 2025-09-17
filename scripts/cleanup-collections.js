require('dotenv').config();
const { MongoClient } = require('mongodb');

async function cleanupRedundantCollections() {
  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🧹 Cleaning up redundant collections...');
    
    // Check what collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // Collections to remove (redundant ones)
    const collectionsToRemove = ['users', 'Registration'];
    
    for (const collectionName of collectionsToRemove) {
      if (collectionNames.includes(collectionName)) {
        console.log(`❌ Dropping redundant collection: ${collectionName}`);
        await db.collection(collectionName).drop();
        console.log(`✅ Dropped: ${collectionName}`);
      } else {
        console.log(`ℹ️  Collection ${collectionName} doesn't exist, skipping`);
      }
    }
    
    // Final check
    const finalCollections = await db.listCollections().toArray();
    const finalNames = finalCollections.map(c => c.name);
    console.log('\n📊 Final collections:');
    finalNames.forEach(name => {
      if (name === 'User') console.log(`  ✅ ${name} - User authentication & profiles`);
      else if (name === 'Academy') console.log(`  ✅ ${name} - Academy business details`);
      else if (name === 'registrations') console.log(`  ✅ ${name} - Registration form data`);
      else if (name === 'KycSubmission') console.log(`  ✅ ${name} - KYC verification data`);
      else if (name === 'SupportTicket') console.log(`  ✅ ${name} - Support tickets`);
      else console.log(`  📋 ${name} - Other collection`);
    });
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupRedundantCollections();