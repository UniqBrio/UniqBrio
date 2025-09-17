import prisma from "@/lib/db";

async function removeDuplicateKYC() {
  try {
    console.log("🔍 Finding duplicate KYC submissions...");
    
    // Get all KYC submissions
    const allSubmissions = await prisma.kycSubmission.findMany({
      orderBy: { createdAt: 'asc' } // Keep the first submission (oldest)
    });
    
    console.log(`📊 Total KYC submissions found: ${allSubmissions.length}`);
    
    // Group by userId and academyId
    const grouped: { [key: string]: any[] } = {};
    allSubmissions.forEach(submission => {
      const key = `${submission.userId}_${submission.academyId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(submission);
    });
    
    console.log("\n📋 Analyzing duplicates:");
    
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    
    for (const [key, submissions] of Object.entries(grouped)) {
      if (submissions.length > 1) {
        duplicatesFound++;
        console.log(`❌ DUPLICATE: ${key} has ${submissions.length} submissions`);
        
        // Keep the first (oldest) submission, remove the rest
        const toKeep = submissions[0];
        const toRemove = submissions.slice(1);
        
        console.log(`   ✅ Keeping: ID ${toKeep.id} (${toKeep.createdAt.toISOString()})`);
        
        for (const duplicate of toRemove) {
          console.log(`   🗑️  Removing: ID ${duplicate.id} (${duplicate.createdAt.toISOString()})`);
          
          await prisma.kycSubmission.delete({
            where: { id: duplicate.id }
          });
          
          duplicatesRemoved++;
        }
      } else {
        console.log(`✅ UNIQUE: ${key}`);
      }
    }
    
    console.log(`\n🎯 Summary:`);
    console.log(`   - Duplicate groups found: ${duplicatesFound}`);
    console.log(`   - Duplicate submissions removed: ${duplicatesRemoved}`);
    console.log(`   - Unique submissions remaining: ${Object.keys(grouped).length}`);
    
    // Verify the cleanup
    const remainingSubmissions = await prisma.kycSubmission.findMany();
    console.log(`\n✅ Verification: ${remainingSubmissions.length} KYC submissions remaining`);
    
    remainingSubmissions.forEach((submission, index) => {
      console.log(`   ${index + 1}. UserId: ${submission.userId}, AcademyId: ${submission.academyId}, Date: ${submission.createdAt.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateKYC();