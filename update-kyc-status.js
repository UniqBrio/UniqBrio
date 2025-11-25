require('dotenv').config();
const { MongoClient } = require('mongodb');

async function updateKycStatus() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('uniqbrio');
    
    console.log('🔄 Updating KYC status for shaziafarheen74@gmail.com to approved...\n');
    
    const result = await db.collection('User').updateOne(
      { email: 'shaziafarheen74@gmail.com' },
      { 
        $set: { 
          kycStatus: 'approved',
          kycSubmissionDate: new Date()
        } 
      }
    );
    
    console.log('✅ Updated:', result.modifiedCount, 'document(s)');
    
    // Verify
    const user = await db.collection('User').findOne({ email: 'shaziafarheen74@gmail.com' });
    console.log('\n✅ Verified User kycStatus:', user.kycStatus);
    console.log('✅ Verified kycSubmissionDate:', user.kycSubmissionDate);
    
  } finally {
    await client.close();
  }
}

updateKycStatus();
