import prisma from "@/lib/db";

async function verifyDataArchitecture() {
  try {
    console.log("\n=== Data Architecture Verification ===\n");
    
    // Check users and their registration status
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        userId: true,
        academyId: true,
        registrationComplete: true,
        verified: true
      }
    });
    
    console.log("📊 Current Users and Registration Status:");
    console.table(users);
    
    // Check if there are any KYC submissions for users
    const kycSubmissions = await prisma.kycSubmission.findMany({
      select: {
        userId: true,
        academyId: true,
        createdAt: true
      }
    });
    
    console.log(`\n📋 KYC Submissions: ${kycSubmissions.length}`);
    kycSubmissions.forEach((kyc, i) => {
      console.log(`  ${i + 1}. UserId: ${kyc.userId}, AcademyId: ${kyc.academyId}, Date: ${kyc.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Show the proper data flow
    console.log("\n🔄 Correct Data Architecture Flow:");
    console.log("1. User signs up → Creates record in 'User' collection");
    console.log("2. User verifies email → User.verified = true");
    console.log("3. User completes registration form → Creates record in 'registrations' collection");
    console.log("4. Registration completion → Updates User with userId & academyId from registration");
    console.log("5. KYC submission → Uses userId & academyId from User record");
    
    console.log("\n📋 Collections Explained:");
    console.log("• 'User' collection = Authentication data (email, password, role)");
    console.log("• 'registrations' collection = Business registration data (academy details, admin info)");
    console.log("• 'kyc_submissions' collection = KYC verification data (photos, location)");
    console.log("• User.userId & User.academyId = Links to registration data");
    
    // Check for any data inconsistencies
    console.log("\n🔍 Data Consistency Check:");
    for (const user of users) {
      if (user.registrationComplete && (!user.userId || !user.academyId)) {
        console.log(`❌ INCONSISTENCY: ${user.email} marked as complete but missing IDs`);
      } else if (!user.registrationComplete && (user.userId || user.academyId)) {
        console.log(`❌ INCONSISTENCY: ${user.email} has IDs but marked as incomplete`);
      } else {
        console.log(`✅ CONSISTENT: ${user.email}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error verifying data architecture:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDataArchitecture();
