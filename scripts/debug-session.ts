import { dbConnect } from '../lib/mongodb';
import UserModel from '../models/User';
import { verifyToken } from '../lib/auth';

async function debugSession() {
  try {
    console.log('🔍 Debugging session data...\n');
    
    // Connect to database
    await dbConnect();
    console.log('✅ Connected to database\n');
    
    // Check all users
    const users = await UserModel.find({}).select('email userId academyId tenantId registrationComplete role verified').lean();
    
    console.log('📊 User Summary:');
    console.log('================\n');
    
    for (const user of users) {
      console.log(`Email: ${user.email}`);
      console.log(`  userId: ${user.userId || 'NOT SET'}`);
      console.log(`  academyId: ${user.academyId || 'NOT SET'}`);
      console.log(`  tenantId: ${user.tenantId || 'NOT SET'}`);
      console.log(`  registrationComplete: ${user.registrationComplete}`);
      console.log(`  role: ${user.role}`);
      console.log(`  verified: ${user.verified}`);
      console.log('---\n');
    }
    
    // Show which users will have missing tenantId in session
    const problematicUsers = users.filter(u => 
      u.verified && (!u.academyId || !u.tenantId || !u.registrationComplete)
    );
    
    if (problematicUsers.length > 0) {
      console.log('⚠️  PROBLEMATIC USERS (verified but missing tenant data):');
      console.log('=========================================================\n');
      for (const user of problematicUsers) {
        console.log(`❌ ${user.email}`);
        console.log(`   Missing: ${!user.tenantId ? 'tenantId ' : ''}${!user.academyId ? 'academyId ' : ''}${!user.registrationComplete ? 'registrationComplete' : ''}`);
        console.log('');
      }
    } else {
      console.log('✅ All verified users have proper tenant data\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugSession();
