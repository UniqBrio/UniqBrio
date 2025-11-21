import { getMongoClient, closeConnections } from '../lib/mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

// Old database connection
const OLD_DB_URI = 'mongodb+srv://uniqbrio:uniqbrio25@uniqbriocluster.pvl6zgz.mongodb.net/uniqbrio?retryWrites=true&w=majority&appName=UniqBrioCluster';

// Collections to skip (system collections)
const SKIP_COLLECTIONS = ['system.indexes', 'system.users'];

async function migrateAllData() {
  let oldClient: any = null;

  try {
    console.log('\n🚀 Starting Database Migration');
    console.log('================================\n');

    // Connect to old database using native MongoClient
    console.log('📡 Connecting to OLD database...');
    const { MongoClient } = await import('mongodb');
    oldClient = new MongoClient(OLD_DB_URI);
    await oldClient.connect();
    const oldDb = oldClient.db();
    console.log('✅ Connected to OLD database\n');

    // Connect to new database using our utility
    console.log('📡 Connecting to NEW database...');
    const { client: newClient, db: newDb } = await getMongoClient();
    console.log('✅ Connected to NEW database\n');

    // Get all collections from old database
    const collections = await oldDb.listCollections().toArray();
    const collectionNames = collections
      .map(col => col.name)
      .filter(name => !SKIP_COLLECTIONS.includes(name));

    console.log(`📋 Found ${collectionNames.length} collections to migrate:`);
    collectionNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // Migration statistics
    const stats = {
      totalCollections: collectionNames.length,
      migratedCollections: 0,
      totalDocuments: 0,
      migratedDocuments: 0,
      errors: [] as Array<{ collection: string; error: string }>
    };

    // Migrate each collection
    for (const collectionName of collectionNames) {
      try {
        console.log(`\n📦 Migrating collection: ${collectionName}`);
        
        // Get all documents from old collection
        const oldCollection = oldDb.collection(collectionName);
        const documents = await oldCollection.find({}).toArray();
        
        console.log(`   Found ${documents.length} documents`);
        stats.totalDocuments += documents.length;

        if (documents.length === 0) {
          console.log(`   ⚠️  Collection is empty, skipping...`);
          stats.migratedCollections++;
          continue;
        }

        // Check if collection exists in new database
        const newCollection = newDb.collection(collectionName);
        const existingCount = await newCollection.countDocuments();
        
        if (existingCount > 0) {
          console.log(`   ⚠️  Collection already has ${existingCount} documents`);
          console.log(`   Do you want to:`);
          console.log(`   1. Skip this collection`);
          console.log(`   2. Append new documents`);
          console.log(`   3. Drop and replace`);
          console.log(`   For now, appending documents...`);
        }

        // Insert documents into new collection in batches
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          
          try {
            // Insert batch
            const result = await newCollection.insertMany(batch, { ordered: false });
            insertedCount += result.insertedCount;
            
            // Show progress
            const progress = Math.min(i + batchSize, documents.length);
            console.log(`   ⏳ Progress: ${progress}/${documents.length} documents`);
          } catch (error: any) {
            // Handle duplicate key errors (documents already exist)
            if (error.code === 11000) {
              console.log(`   ⚠️  Some documents already exist, skipping duplicates...`);
              // Count successful inserts from writeErrors
              const successCount = batch.length - (error.writeErrors?.length || 0);
              insertedCount += successCount;
            } else {
              throw error;
            }
          }
        }

        stats.migratedDocuments += insertedCount;
        stats.migratedCollections++;
        
        console.log(`   ✅ Successfully migrated ${insertedCount} documents`);

        // Verify migration
        const newCount = await newCollection.countDocuments();
        console.log(`   📊 Collection now has ${newCount} total documents`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error migrating ${collectionName}: ${errorMsg}`);
        stats.errors.push({ collection: collectionName, error: errorMsg });
      }
    }

    // Print final statistics
    console.log('\n\n================================');
    console.log('📊 Migration Summary');
    console.log('================================');
    console.log(`Total Collections: ${stats.totalCollections}`);
    console.log(`Migrated Collections: ${stats.migratedCollections}`);
    console.log(`Total Documents Found: ${stats.totalDocuments}`);
    console.log(`Documents Migrated: ${stats.migratedDocuments}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(err => {
        console.log(`   - ${err.collection}: ${err.error}`);
      });
    }

    console.log('\n✅ Migration completed!\n');

    // Show collections in new database
    console.log('📋 Collections in NEW database:');
    const newCollections = await newDb.listCollections().toArray();
    for (const col of newCollections) {
      const count = await newDb.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    if (oldClient) {
      await oldClient.close();
      console.log('\n📡 Disconnected from OLD database');
    }
    await closeConnections();
    console.log('📡 Disconnected from NEW database');
  }
}

// Run migration
migrateAllData()
  .then(() => {
    console.log('\n🎉 Migration process finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed:', error);
    process.exit(1);
  });
