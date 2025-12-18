/**
 * Migration Script: Rename priceINR field to price in courses collection
 * 
 * This script renames the priceINR field to price across all course documents
 * to better reflect the currency-agnostic nature of the field.
 * 
 * Run with: node scripts/rename-priceINR-to-price.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'uniqbrio';

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function renamePriceField() {
  try {
    console.log('Connecting to MongoDB...');
    const connectionOptions = {
      dbName: DATABASE_NAME
    };
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log(`Connected to MongoDB database: ${DATABASE_NAME}`);

    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    // Find courses with priceINR field
    const coursesWithPriceINR = await coursesCollection.find({
      priceINR: { $exists: true }
    }).toArray();

    console.log(`\nFound ${coursesWithPriceINR.length} courses with 'priceINR' field`);

    if (coursesWithPriceINR.length === 0) {
      console.log('No courses to migrate.');
      await mongoose.disconnect();
      return;
    }

    // Display sample courses
    console.log('\nSample courses to be migrated:');
    coursesWithPriceINR.slice(0, 5).forEach((course, index) => {
      console.log(`${index + 1}. ${course.title || course.name || 'Untitled'} (priceINR: ${course.priceINR})`);
    });
    if (coursesWithPriceINR.length > 5) {
      console.log(`... and ${coursesWithPriceINR.length - 5} more courses`);
    }

    // Confirmation prompt
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`\n⚠️  Are you sure you want to rename 'priceINR' to 'price' for ${coursesWithPriceINR.length} courses? (yes/no): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled.');
      await mongoose.disconnect();
      return;
    }

    // Perform the rename operation
    console.log('\n🔄 Renaming field...');
    const result = await coursesCollection.updateMany(
      { priceINR: { $exists: true } },
      { $rename: { priceINR: 'price' } }
    );

    console.log(`\n✅ Successfully renamed field in ${result.modifiedCount} courses`);

    // Verify the migration
    const verification = await coursesCollection.countDocuments({
      price: { $exists: true }
    });
    console.log(`\n✅ Verification: ${verification} courses now have 'price' field`);

    const remaining = await coursesCollection.countDocuments({
      priceINR: { $exists: true }
    });
    if (remaining > 0) {
      console.log(`\n⚠️  Warning: ${remaining} courses still have 'priceINR' field`);
    } else {
      console.log('\n✅ All courses migrated successfully!');
    }

    // Log summary
    console.log('\n📊 Summary:');
    console.log(`   Total Courses Found: ${coursesWithPriceINR.length}`);
    console.log(`   Courses Updated: ${result.modifiedCount}`);
    console.log(`   Courses with 'price' field: ${verification}`);
    console.log(`   Remaining with 'priceINR': ${remaining}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
renamePriceField();
