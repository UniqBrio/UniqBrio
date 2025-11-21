// Script to add kycStatus: "pending" to all existing KycSubmission documents
const { getMongoClient, closeConnections } = require('../lib/mongodb.js');

const dbName = 'uniqbrio';
const collectionName = 'KycSubmission';

async function main() {
  try {
    const { client, db } = await getMongoClient();
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
