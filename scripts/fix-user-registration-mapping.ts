import { getMongoClient, closeConnections } from '../lib/mongodb';

async function fixUserRegistrationMapping() {
  try {
    console.log("\n=== Fixing User-Registration Data Mapping ===\n");
    
    const { client, db } = await getMongoClient();
    
    // Get all users
    const users = await db.collection('User').find({}).toArray();
    console.log(`📋 Found ${users.length} users to process`);
    
    // Get all registrations
    const registrations = await db.collection('registrations').find({}).toArray();
    console.log(`📋 Found ${registrations.length} registrations available`);
    
    console.log("\n🔗 Mapping users to registrations...\n");
    
    for (const user of users) {
      console.log(`\n--- Processing user: ${user.email} ---`);
      
      // Find matching registration by email
      const matchingRegistration = registrations.find(reg => 
        reg.adminInfo && reg.adminInfo.email === user.email
      );
      
      if (matchingRegistration) {
        console.log(`✅ Found matching registration:`);
        console.log(`   Registration ID: ${matchingRegistration._id}`);
        console.log(`   User ID: ${matchingRegistration.userId}`);
        console.log(`   Academy ID: ${matchingRegistration.academyId}`);
        console.log(`   Academy Name: ${matchingRegistration.academyName}`);
        
        // Update user with the correct IDs from registration
        const updateResult = await db.collection('User').updateOne(
          { _id: user._id },
          {
            $set: {
              userId: matchingRegistration.userId,
              academyId: matchingRegistration.academyId,
              registrationComplete: true // They have completed registration
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`✅ Updated user ${user.email} with userId: ${matchingRegistration.userId}, academyId: ${matchingRegistration.academyId}`);
        } else {
          console.log(`⚠️  No changes made to user ${user.email} (already up to date)`);
        }
        
      } else {
        console.log(`❌ No matching registration found for ${user.email}`);
        console.log(`   This user signed up but never completed registration form`);
        console.log(`   Setting registrationComplete: false`);
        
        // Set registrationComplete to false for users without registrations
        await db.collection('User').updateOne(
          { _id: user._id },
          {
            $set: {
              registrationComplete: false
            }
          }
        );
      }
    }
    
    // Show final results
    console.log("\n📊 Final Results:");
    const updatedUsers = await db.collection('User').find({}).toArray();
    
    const usersWithRegistration = updatedUsers.filter(u => u.userId && u.academyId);
    const usersWithoutRegistration = updatedUsers.filter(u => !u.userId || !u.academyId);
    
    console.log(`✅ Users with complete registration: ${usersWithRegistration.length}`);
    usersWithRegistration.forEach(u => {
      console.log(`   ${u.email} - userId: ${u.userId}, academyId: ${u.academyId}`);
    });
    
    console.log(`❌ Users needing registration: ${usersWithoutRegistration.length}`);
    usersWithoutRegistration.forEach(u => {
      console.log(`   ${u.email} - needs to complete registration form`);
    });
    
    await client.close();
    console.log("\n✅ User-Registration mapping completed!");
    
  } catch (error) {
    console.error("❌ Error fixing user-registration mapping:", error);
  }
}

fixUserRegistrationMapping();
