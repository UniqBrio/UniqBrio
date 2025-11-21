// Check if there are any records in the old "Registration" collection that need to be migrated

const { getMongoClient, closeConnections } = require('../lib/mongodb.js');

async function checkOldRegistrationCollection() {
  try {
    const { client, db } = await getMongoClient();
    
    console.log('🔍 Checking for records in old "Registration" collection...\n');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📋 Available collections:');
    collectionNames.forEach(name => {
      if (name.toLowerCase().includes('registration')) {
        console.log(`  - ${name}`);
      }
    });
    
    // Check if "Registration" (capital R) collection exists
    if (collectionNames.includes('Registration')) {
      const oldCollection = db.collection('Registration');
      const oldRecords = await oldCollection.find({}).toArray();
      
      console.log(`\n📊 Found ${oldRecords.length} records in "Registration" collection`);
      
      if (oldRecords.length > 0) {
        console.log('\n⚠️  Migration needed! Found records in old collection:');
        oldRecords.forEach((record, index) => {
          console.log(`${index + 1}. ${record.userId} -> ${record.academyId}`);
        });
        
        console.log('\n💡 These records should be migrated to "registrations" collection.');
        
        // Migrate the records
        const newCollection = db.collection('registrations');
        
        for (const record of oldRecords) {
          // Check if record already exists in new collection
          const existing = await newCollection.findOne({ userId: record.userId });
          
          if (!existing) {
            await newCollection.insertOne(record);
            console.log(`✅ Migrated: ${record.userId} -> ${record.academyId}`);
          } else {
            console.log(`⏭️  Skipped (already exists): ${record.userId} -> ${record.academyId}`);
          }
        }
        
        console.log('\n🗑️  Dropping old "Registration" collection...');
        await oldCollection.drop();
        console.log('✅ Old collection dropped successfully');
        
      } else {
        console.log('\n✅ No records found in old collection');
        console.log('🗑️  Dropping empty "Registration" collection...');
        await oldCollection.drop();
        console.log('✅ Old collection dropped successfully');
      }
    } else {
      console.log('\n✅ No old "Registration" collection found');
    }
    
    // Final verification
    const registrationsCollection = db.collection('registrations');
    const finalCount = await registrationsCollection.countDocuments();
    console.log(`\n📊 Final count in "registrations" collection: ${finalCount} records`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration check
checkOldRegistrationCollection();