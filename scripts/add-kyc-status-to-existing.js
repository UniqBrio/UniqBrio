// Script to add kycStatus: "pending" to all existing KycSubmission documents
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL || 'mongodb+srv://<username>:<password>@uniqbriocluster.pvl6zgz.mongodb.net/uniqbrio';
const dbName = 'uniqbrio';
const collectionName = 'KycSubmission';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Update all documents missing kycStatus
    const result = await collection.updateMany(
      { kycStatus: { $exists: false } },
      { $set: { kycStatus: 'pending' } }
    );

    console.log(`Updated ${result.modifiedCount} documents.`);
  } catch (err) {
    console.error('Error updating KYC documents:', err);
  } finally {
    await client.close();
  }
}

main();
