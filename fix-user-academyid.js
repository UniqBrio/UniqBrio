const mongoose = require('mongoose');

async function fixUserAcademyId() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@freecluster.l4kmq.mongodb.net/uniqbrio?retryWrites=true&w=majority&appName=FreeCluster';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const email = 'shaziafarheen75@gmail.com';
    
    // Find the user
    const user = await mongoose.connection.db.collection('users').findOne({ email });
    if (!user) {
      console.error('❌ User not found:', email);
      return;
    }
    
    console.log('\n📋 Current User:', {
      _id: user._id,
      email: user.email,
      userId: user.userId,
      academyId: user.academyId,
      tenantId: user.tenantId
    });
    
    // Find the registration
    const registration = await mongoose.connection.db.collection('registrations').findOne({ email });
    if (!registration) {
      console.error('❌ Registration not found for:', email);
      return;
    }
    
    console.log('\n📋 Registration:', {
      _id: registration._id,
      email: registration.email,
      userId: registration.userId,
      academyId: registration.academyId
    });
    
    // Update user with academyId from registration
    if (!user.academyId && registration.academyId) {
      console.log(`\n🔧 Updating user academyId to: ${registration.academyId}`);
      
      const result = await mongoose.connection.db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            academyId: registration.academyId,
            tenantId: registration.academyId 
          } 
        }
      );
      
      console.log('✅ Update result:', result);
      
      const updatedUser = await mongoose.connection.db.collection('users').findOne({ email });
      console.log('\n✅ Updated User:', {
        _id: updatedUser._id,
        email: updatedUser.email,
        userId: updatedUser.userId,
        academyId: updatedUser.academyId,
        tenantId: updatedUser.tenantId
      });
    } else {
      console.log('\n✅ User already has academyId or registration missing academyId');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixUserAcademyId();
