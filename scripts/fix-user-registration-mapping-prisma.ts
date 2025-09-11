import prisma from "@/lib/db";

async function fixUserRegistrationMapping() {
  try {
    console.log("\n=== Fixing User-Registration Data Mapping ===\n");
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        userId: true,
        academyId: true,
        registrationComplete: true
      }
    });
    
    console.log(`📋 Found ${users.length} users to process`);
    
    for (const user of users) {
      console.log(`\n--- Processing user: ${user.email} ---`);
      
      try {
        // Use the same logic as user-academy-info API to find registrations
        const rawRegistrations = await prisma.$runCommandRaw({
          find: "registrations",
          filter: { "adminInfo.email": user.email }
        }) as any;

        const matchingDocs = rawRegistrations.cursor.firstBatch;
        
        if (matchingDocs.length > 0) {
          const registration = matchingDocs[0];
          console.log(`✅ Found matching registration:`);
          console.log(`   User ID: ${registration.userId}`);
          console.log(`   Academy ID: ${registration.academyId}`);
          console.log(`   Academy Name: ${registration.academyName}`);
          
          // Update user with the correct IDs from registration
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              userId: registration.userId,
              academyId: registration.academyId,
              registrationComplete: true // They have completed registration
            }
          });
          
          console.log(`✅ Updated user ${user.email} with userId: ${registration.userId}, academyId: ${registration.academyId}`);
          
        } else {
          console.log(`❌ No matching registration found for ${user.email}`);
          console.log(`   This user signed up but never completed registration form`);
          console.log(`   Setting registrationComplete: false`);
          
          // Set registrationComplete to false for users without registrations
          await prisma.user.update({
            where: { id: user.id },
            data: {
              registrationComplete: false,
              userId: null,
              academyId: null
            }
          });
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }
    
    // Show final results
    console.log("\n📊 Final Results:");
    const updatedUsers = await prisma.user.findMany({
      select: {
        email: true,
        userId: true,
        academyId: true,
        registrationComplete: true
      }
    });
    
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
    
    console.log("\n✅ User-Registration mapping completed!");
    
  } catch (error) {
    console.error("❌ Error fixing user-registration mapping:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRegistrationMapping();
