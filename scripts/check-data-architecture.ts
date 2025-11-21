import { getMongoClient, closeConnections } from '../lib/mongodb';

async function checkDataArchitecture() {
  try {
    console.log("\n=== Analyzing Current Data Architecture ===\n");
    
    const { client, db } = await getMongoClient();
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log("📊 Current Collections:");
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check Users collection
    console.log("\n📋 Users Collection:");
    const users = await db.collection('User').find({}).toArray();
    console.log(`Total users: ${users.length}`);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} - Role: ${user.role} - UserId: ${user.userId || 'MISSING'} - AcademyId: ${user.academyId || 'MISSING'}`);
    });
    
    // Check Registrations collection
    if (collections.find(col => col.name === 'Registration')) {
      console.log("\n📋 Registrations Collection:");
      const registrations = await db.collection('Registration').find({}).toArray();
      console.log(`Total registrations: ${registrations.length}`);
      registrations.forEach((reg, i) => {
        console.log(`  ${i + 1}. ${reg.email} - UserId: ${reg.userId} - AcademyId: ${reg.academyId} - Academy: ${reg.academyName}`);
      });
    }
    
    // Check Academy collection
    if (collections.find(col => col.name === 'Academy')) {
      console.log("\n📋 Academy Collection:");
      const academies = await db.collection('Academy').find({}).toArray();
      console.log(`Total academies: ${academies.length}`);
      academies.forEach((academy, i) => {
        console.log(`  ${i + 1}. ${academy.name} - AcademyId: ${academy.academyId} - UserId: ${academy.userId}`);
      });
    }
    
    console.log("\n🔍 Data Architecture Issues:");
    
    // Find users without userId/academyId
    const usersWithoutIds = users.filter(u => !u.userId || !u.academyId);
    if (usersWithoutIds.length > 0) {
      console.log(`❌ ${usersWithoutIds.length} users missing userId/academyId:`);
      usersWithoutIds.forEach(u => console.log(`  - ${u.email}`));
    }
    
    // Check for data consistency
    if (collections.find(col => col.name === 'Registration')) {
      const registrations = await db.collection('Registration').find({}).toArray();
      
      // Find users with registrations
      for (const user of users) {
        const userRegistration = registrations.find(r => r.email === user.email);
        if (userRegistration) {
          console.log(`✅ ${user.email} has matching registration with UserId: ${userRegistration.userId}, AcademyId: ${userRegistration.academyId}`);
          
          // Check if user's IDs match registration IDs
          if (user.userId !== userRegistration.userId || user.academyId !== userRegistration.academyId) {
            console.log(`❌ ID MISMATCH for ${user.email}:`);
            console.log(`   User: userId=${user.userId}, academyId=${user.academyId}`);
            console.log(`   Registration: userId=${userRegistration.userId}, academyId=${userRegistration.academyId}`);
          }
        } else {
          console.log(`❌ ${user.email} has NO matching registration`);
        }
      }
    }
    
    await client.close();
    
  } catch (error) {
    console.error("❌ Error analyzing data:", error);
  }
}

checkDataArchitecture();
