const { PrismaClient } = require('@prisma/client');
const { getMongoClient, closeConnections } = require('../lib/mongodb.js');

async function migrateRegistrations() {
  try {
    const { client, db } = await getMongoClient();
    
    console.log('Checking collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // Check if both collections exist
    const hasRegistration = collectionNames.includes('Registration');
    const hasRegistrations = collectionNames.includes('registrations');
    
    console.log('Has "Registration" collection:', hasRegistration);
    console.log('Has "registrations" collection:', hasRegistrations);
    
    if (hasRegistration) {
      const registrationData = await db.collection('Registration').find({}).toArray();
      console.log(`Found ${registrationData.length} records in "Registration" collection`);
      
      if (registrationData.length > 0) {
        if (hasRegistrations) {
          console.log('Checking existing data in "registrations" collection...');
          const existingData = await db.collection('registrations').find({}).toArray();
          console.log(`Found ${existingData.length} records in "registrations" collection`);
        }
        
        // Insert data into "registrations" collection
        console.log('Migrating data to "registrations" collection...');
        await db.collection('registrations').insertMany(registrationData);
        console.log('Migration completed successfully!');
        
        // Optionally remove old collection (commented out for safety)
        // await db.collection('Registration').drop();
        // console.log('Old "Registration" collection dropped');
      }
    } else {
      console.log('No "Registration" collection found - nothing to migrate');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateRegistrations();