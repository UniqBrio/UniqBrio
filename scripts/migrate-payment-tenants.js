/**
 * Migration Script: Add tenantId to existing payments
 * 
 * This script updates all payment records that are missing tenantId by:
 * 1. Looking up the student for each payment
 * 2. Getting the tenantId from the student's academy
 * 3. Updating the payment with the correct tenantId
 * 
 * Run with: node scripts/migrate-payment-tenants.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'uniqbrio'; // Explicitly set the database name

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function migratePaymentTenants() {
  try {
    console.log('Connecting to MongoDB...');
    // Ensure we connect to the correct database
    const connectionOptions = {
      dbName: DATABASE_NAME
    };
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log(`Connected to MongoDB database: ${DATABASE_NAME}`);

    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');
    const studentsCollection = db.collection('students');

    // Find all payments without tenantId
    const paymentsWithoutTenant = await paymentsCollection.find({
      $or: [
        { tenantId: { $exists: false } },
        { tenantId: null },
        { tenantId: '' }
      ]
    }).toArray();

    console.log(`Found ${paymentsWithoutTenant.length} payments without tenantId`);

    let updated = 0;
    let failed = 0;

    for (const payment of paymentsWithoutTenant) {
      try {
        // Find the student to get their tenantId
        const student = await studentsCollection.findOne({ studentId: payment.studentId });
        
        if (student && student.tenantId) {
          await paymentsCollection.updateOne(
            { _id: payment._id },
            { $set: { tenantId: student.tenantId } }
          );
          console.log(`Updated payment ${payment._id} for student ${payment.studentId} with tenantId ${student.tenantId}`);
          updated++;
        } else if (student && student.academyId) {
          // Fallback to academyId if tenantId not set
          await paymentsCollection.updateOne(
            { _id: payment._id },
            { $set: { tenantId: student.academyId } }
          );
          console.log(`Updated payment ${payment._id} for student ${payment.studentId} with academyId ${student.academyId}`);
          updated++;
        } else {
          console.warn(`Could not find tenantId for payment ${payment._id} (student: ${payment.studentId})`);
          failed++;
        }
      } catch (error) {
        console.error(`Error updating payment ${payment._id}:`, error.message);
        failed++;
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total payments without tenantId: ${paymentsWithoutTenant.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed/Skipped: ${failed}`);

    // Also drop the problematic index if it exists
    console.log('\nChecking for problematic index...');
    try {
      const indexes = await paymentsCollection.indexes();
      const hasProblematicIndex = indexes.some(idx => idx.name === 'studentId_1_courseId_1');
      
      if (hasProblematicIndex) {
        await paymentsCollection.dropIndex('studentId_1_courseId_1');
        console.log('Dropped problematic index: studentId_1_courseId_1');
      } else {
        console.log('Problematic index not found (already dropped or never existed)');
      }
    } catch (indexError) {
      console.log('Index operation result:', indexError.message);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migratePaymentTenants();
