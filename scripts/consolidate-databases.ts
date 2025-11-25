import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://course:course1@cluster0.1gqwk5m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const SOURCE_DB = "uniqbrio-admin";
const TARGET_DB = "uniqbrio";

// Collections to migrate (excluding waitlists, early_access, waitlistfeedbacks - not part of main application)
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'User', 
  'registrations',
  'kycsubmissions',
  'KycSubmission',
  'kycreviews',
  'KycReview',
  'supporttickets',
  'SupportTicket'
];

async function consolidateDatabases() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);
    
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      console.log(`\n📦 Processing collection: ${collectionName}`);
      
      // Check if source collection exists
      const sourceCollections = await sourceDb.listCollections({ name: collectionName }).toArray();
      if (sourceCollections.length === 0) {
        console.log(`   ⚠️  Collection ${collectionName} not found in ${SOURCE_DB}, skipping...`);
        continue;
      }
      
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Count documents in source
      const sourceCount = await sourceCollection.countDocuments();
      console.log(`   Found ${sourceCount} documents in source`);
      
      if (sourceCount === 0) {
        console.log(`   Collection is empty, skipping...`);
        continue;
      }
      
      // Check if target collection exists and has data
      const targetCount = await targetCollection.countDocuments();
      if (targetCount > 0) {
        console.log(`   ⚠️  Target collection already has ${targetCount} documents`);
        console.log(`   Skipping to avoid duplicates. Manual review recommended.`);
        continue;
      }
      
      // Copy all documents
      const documents = await sourceCollection.find({}).toArray();
      if (documents.length > 0) {
        await targetCollection.insertMany(documents);
        console.log(`   ✅ Copied ${documents.length} documents to ${TARGET_DB}`);
      }
      
      // Copy indexes
      const indexes = await sourceCollection.indexes();
      for (const index of indexes) {
        // Skip _id index as it's created automatically
        if (index.name === '_id_') continue;
        
        try {
          const { key, ...options } = index;
          delete options.v; // Remove version field
          delete options.ns; // Remove namespace field
          await targetCollection.createIndex(key, options);
          console.log(`   ✅ Created index: ${index.name}`);
        } catch (error: any) {
          if (error.code === 85 || error.code === 86) {
            console.log(`   ℹ️  Index ${index.name} already exists, skipping...`);
          } else {
            console.error(`   ❌ Failed to create index ${index.name}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Database consolidation completed!');
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Verify data in target database using MongoDB Compass');
    console.log('2. Test all authentication and KYC flows');
    console.log('3. After verification, you can drop the uniqbrio-admin database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the migration
consolidateDatabases()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
