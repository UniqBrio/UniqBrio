/**
 * Script to list all collections and check database connection
 */

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

async function checkDatabase() {
  console.log('🔍 CHECKING DATABASE CONNECTION\n');

  try {
    // Check auth database
    console.log('=' .repeat(70));
    console.log('📌 AUTH DATABASE (uniqbrio-admin)');
    console.log('='.repeat(70));
    
    await dbConnect('uniqbrio-admin');
    console.log(`✅ Connected to: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.db.databaseName}\n`);

    const authDb = mongoose.connection.db;
    const authCollections = await authDb.listCollections().toArray();
    
    console.log(`📁 Collections in auth database (${authCollections.length}):`);
    for (const col of authCollections) {
      const count = await authDb.collection(col.name).countDocuments();
      console.log(`   - ${col.name.padEnd(30)} (${count} documents)`);
    }

    // Check dashboard database
    console.log('\n' + '='.repeat(70));
    console.log('📌 DASHBOARD DATABASE (uniqbrio)');
    console.log('='.repeat(70));
    
    await mongoose.disconnect();
    await dbConnect('uniqbrio');
    
    console.log(`✅ Connected to: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.db.databaseName}\n`);

    const dashDb = mongoose.connection.db;
    const dashCollections = await dashDb.listCollections().toArray();
    
    console.log(`📁 Collections in dashboard database (${dashCollections.length}):`);
    for (const col of dashCollections) {
      const count = await dashDb.collection(col.name).countDocuments();
      console.log(`   - ${col.name.padEnd(30)} (${count} documents)`);
    }

    // Sample some data from User collection if it exists
    console.log('\n' + '='.repeat(70));
    console.log('📌 SAMPLE USER DATA');
    console.log('='.repeat(70));
    
    await mongoose.disconnect();
    await dbConnect('uniqbrio-admin');
    
    const userCount = await authDb.collection('User').countDocuments();
    console.log(`\nTotal users in 'User' collection: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUsers = await authDb.collection('User')
        .find({})
        .limit(5)
        .project({ email: 1, name: 1, academyId: 1, userId: 1 })
        .toArray();
      
      console.log('\nSample users:');
      sampleUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email} - ${user.name} (Academy: ${user.academyId || 'N/A'})`);
      });
    }

  } catch (error: any) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
