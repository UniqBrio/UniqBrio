require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkCollections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('uniqbrio');
    
    console.log('📦 All collections in uniqbrio:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => console.log('  -', c.name));
    
    console.log('\n🔍 Checking KYC data for shaziafarheen74@gmail.com...\n');
    
    // Check User
    const user = await db.collection('User').findOne({ email: 'shaziafarheen74@gmail.com' });
    console.log('User kycStatus:', user?.kycStatus);
    console.log('User registrationComplete:', user?.registrationComplete);
    console.log('User userId:', user?.userId);
    console.log('User academyId:', user?.academyId);
    
    // Check KycSubmission in both possible collections
    const kycSubmission1 = await db.collection('KycSubmission').findOne({ userId: user?.userId });
    const kycSubmission2 = await db.collection('kycsubmissions').findOne({ userId: user?.userId });
    
    console.log('\nKycSubmission (capital):', kycSubmission1 ? 'FOUND' : 'NOT FOUND');
    console.log('kycsubmissions (lowercase):', kycSubmission2 ? 'FOUND' : 'NOT FOUND');
    
    // Check KycReview in both possible collections
    const kycReview1 = await db.collection('KycReview').findOne({ userId: user?.userId });
    const kycReview2 = await db.collection('kycreviews').findOne({ userId: user?.userId });
    
    console.log('\nKycReview (capital):', kycReview1 ? 'FOUND' : 'NOT FOUND');
    console.log('kycreviews (lowercase):', kycReview2 ? 'FOUND' : 'NOT FOUND');
    
  } finally {
    await client.close();
  }
}

checkCollections();
