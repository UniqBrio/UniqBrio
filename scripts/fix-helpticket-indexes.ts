/**
 * Script to fix HelpTicket indexes
 * Drops the old ticketId_1 index and ensures correct compound index exists
 * 
 * Run with: npx tsx scripts/fix-helpticket-indexes.ts
 */

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

async function fixHelpTicketIndexes() {
  try {
    console.log('🔌 Connecting to database...');
    await dbConnect('uniqbrio');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collection = db.collection('helptickets');
    
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    // Check if old ticketId_1 index exists
    const oldIndexExists = indexes.some(idx => idx.name === 'ticketId_1');
    
    if (oldIndexExists) {
      console.log('\n🗑️  Dropping old ticketId_1 index...');
      try {
        await collection.dropIndex('ticketId_1');
        console.log('✅ Successfully dropped ticketId_1 index');
      } catch (error: any) {
        if (error.code === 27 || error.message.includes('index not found')) {
          console.log('ℹ️  Index already dropped or not found');
        } else {
          throw error;
        }
      }
    } else {
      console.log('\nℹ️  No old ticketId_1 index found');
    }
    
    // Ensure correct compound index exists
    console.log('\n🔧 Ensuring correct compound index...');
    try {
      await collection.createIndex(
        { tenantId: 1, ticketId: 1 },
        { unique: true, name: 'tenantId_1_ticketId_1' }
      );
      console.log('✅ Compound index (tenantId_1_ticketId_1) created/verified');
    } catch (error: any) {
      if (error.code === 85 || error.message.includes('already exists')) {
        console.log('ℹ️  Compound index already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('\n✅ Index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
fixHelpTicketIndexes()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
