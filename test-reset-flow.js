require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testPasswordResetFlow() {
  console.log('Testing password reset database flow...\n');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('uniqbrio');
    const usersCollection = db.collection('User');
    
    // Test email
    const testEmail = 'shaziafarheen74@gmail.com';
    
    // 1. Find user
    console.log('\n1. Finding user:', testEmail);
    const user = await usersCollection.findOne({ email: testEmail });
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:', user.name);
    console.log('   User ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Current resetToken:', user.resetToken || 'none');
    console.log('   Current resetTokenExpiry:', user.resetTokenExpiry || 'none');
    
    // 2. Generate test token
    const testResetToken = 'test-reset-token-' + Date.now();
    const testResetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    console.log('\n2. Updating user with reset token...');
    console.log('   New resetToken:', testResetToken);
    console.log('   New resetTokenExpiry:', testResetTokenExpiry);
    
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken: testResetToken,
          resetTokenExpiry: testResetTokenExpiry
        }
      }
    );
    
    console.log('   Update result:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount
    });
    
    if (updateResult.modifiedCount === 1) {
      console.log('✅ User updated successfully');
    } else {
      console.warn('⚠️ User was matched but not modified (might already have same values)');
    }
    
    // 3. Verify the update
    console.log('\n3. Verifying the update...');
    const updatedUser = await usersCollection.findOne({ email: testEmail });
    
    console.log('   resetToken:', updatedUser.resetToken);
    console.log('   resetTokenExpiry:', updatedUser.resetTokenExpiry);
    
    if (updatedUser.resetToken === testResetToken) {
      console.log('✅ Reset token was saved correctly!');
    } else {
      console.error('❌ Reset token was NOT saved correctly!');
    }
    
    // 4. Test token lookup (what happens during password reset)
    console.log('\n4. Testing token lookup (simulating reset password)...');
    const userByToken = await usersCollection.findOne({
      resetToken: testResetToken,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (userByToken) {
      console.log('✅ User found by token!');
      console.log('   Email:', userByToken.email);
    } else {
      console.error('❌ User NOT found by token!');
    }
    
    console.log('\n✅ All tests completed!');
    console.log('\n📧 Check your email at', testEmail, 'for the test reset email sent earlier.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

testPasswordResetFlow();
