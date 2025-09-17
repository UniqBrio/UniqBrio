// Migration script to fix null updatedAt values in Academy records
// Use MongoDB client directly to bypass Prisma validation

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixAcademyUpdatedAt() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Connecting to MongoDB to fix Academy updatedAt...');
    await client.connect();
    
    const db = client.db();
    const academyCollection = db.collection('Academy');

    // Find all Academy records that have null updatedAt
    const academiesWithNullUpdatedAt = await academyCollection.find({
      $or: [
        { updatedAt: null },
        { updatedAt: { $exists: false } }
      ]
    }).toArray();

    console.log(`📊 Found ${academiesWithNullUpdatedAt.length} Academy records with null updatedAt`);

    if (academiesWithNullUpdatedAt.length === 0) {
      console.log('✅ No Academy records need fixing.');
      return;
    }

    // Update each record
    let updatedCount = 0;
    for (const academy of academiesWithNullUpdatedAt) {
      const result = await academyCollection.updateOne(
        { _id: academy._id },
        { 
          $set: { 
            updatedAt: academy.createdAt || new Date() 
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`   ✓ Updated Academy ${academy.academyId || academy._id}`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} Academy records`);
    console.log('🎉 Academy updatedAt migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
fixAcademyUpdatedAt();