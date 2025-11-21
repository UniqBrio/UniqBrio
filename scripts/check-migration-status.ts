import { getMongoClient, closeConnections } from '../lib/mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

// Old database connection
const OLD_DB_URI = 'mongodb+srv://uniqbrio:uniqbrio25@uniqbriocluster.pvl6zgz.mongodb.net/uniqbrio?retryWrites=true&w=majority&appName=UniqBrioCluster';

async function checkMigrationStatus() {
  let oldClient: any = null;

  try {
    console.log('\n🔍 Checking Database Status');
    console.log('================================\n');

    // Connect to old database
    console.log('📡 Connecting to OLD database...');
    const { MongoClient } = await import('mongodb');
    oldClient = new MongoClient(OLD_DB_URI);
    await oldClient.connect();
    const oldDb = oldClient.db();
    console.log('✅ Connected to OLD database\n');

    // Connect to new database
    console.log('📡 Connecting to NEW database...');
    const { client: newClient, db: newDb } = await getMongoClient();
    console.log('✅ Connected to NEW database\n');

    // Get collections from both databases
    const oldCollections = await oldDb.listCollections().toArray();
    const newCollections = await newDb.listCollections().toArray();

    console.log('📊 OLD Database Collections:');
    console.log('----------------------------');
    for (const col of oldCollections) {
      if (!col.name.startsWith('system.')) {
        const count = await oldDb.collection(col.name).countDocuments();
        console.log(`   ${col.name}: ${count} documents`);
      }
    }

    console.log('\n📊 NEW Database Collections:');
    console.log('----------------------------');
    if (newCollections.length === 0) {
      console.log('   (empty - no collections yet)');
    } else {
      for (const col of newCollections) {
        if (!col.name.startsWith('system.')) {
          const count = await newDb.collection(col.name).countDocuments();
          console.log(`   ${col.name}: ${count} documents`);
        }
      }
    }

    console.log('\n================================');
    console.log('✅ Status check complete!\n');

  } catch (error) {
    console.error('\n❌ Status check failed:', error);
    throw error;
  } finally {
    if (oldClient) await oldClient.close();
    await closeConnections();
  }
}

checkMigrationStatus()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
