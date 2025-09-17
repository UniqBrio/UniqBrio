// Migration script to fix null updatedAt values in KycSubmission records
// This script will update all existing KYC submissions to have proper updatedAt values

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixKycSubmissionUpdatedAt() {
  try {
    console.log('🔄 Starting migration to fix null updatedAt values in KycSubmission...');

    // First, let's see how many records we have
    const totalRecords = await prisma.kycSubmission.count();
    console.log(`📊 Found ${totalRecords} KYC submission records`);

    if (totalRecords === 0) {
      console.log('✅ No KYC submission records found. Migration not needed.');
      return;
    }

    // Get all KYC submissions (we need to update them to trigger updatedAt)
    const kycSubmissions = await prisma.kycSubmission.findMany({
      select: {
        id: true,
        createdAt: true
      }
    });

    console.log(`🔧 Updating ${kycSubmissions.length} records...`);

    // Update each record to trigger the updatedAt field
    let updatedCount = 0;
    for (const submission of kycSubmissions) {
      try {
        await prisma.kycSubmission.update({
          where: { id: submission.id },
          data: {
            // We're just touching the record to trigger updatedAt
            // Set updatedAt to createdAt for existing records to maintain data integrity
            updatedAt: submission.createdAt
          }
        });
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`   ✓ Updated ${updatedCount}/${kycSubmissions.length} records`);
        }
      } catch (updateError) {
        console.error(`❌ Failed to update record ${submission.id}:`, updateError.message);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} KYC submission records`);
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixKycSubmissionUpdatedAt();