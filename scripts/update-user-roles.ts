import prisma from "@/lib/db";

async function updateUsersToSuperAdmin() {
  try {
    console.log("[Role Update] Starting to update existing users to super_admin role...");
    
    // First, let's see current users and their roles
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        registrationComplete: true
      }
    });
    
    console.log("\n[Role Update] Current users in database:");
    console.table(existingUsers);
    
    // Update all users who currently have 'admin' role to 'super_admin'
    const updateResult = await prisma.user.updateMany({
      where: {
        role: "admin" // Only update users who currently have 'admin' role
      },
      data: {
        role: "super_admin"
      }
    });
    
    console.log(`\n[Role Update] Successfully updated ${updateResult.count} users from 'admin' to 'super_admin'`);
    
    // Show updated users
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        registrationComplete: true
      }
    });
    
    console.log("\n[Role Update] Updated users in database:");
    console.table(updatedUsers);
    
    console.log("\n[Role Update] ✅ Role update completed successfully!");
    
  } catch (error) {
    console.error("[Role Update] ❌ Error updating user roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateUsersToSuperAdmin();
