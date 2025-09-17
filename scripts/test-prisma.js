const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  const prisma = new PrismaClient();
  
  try {
    console.log('✅ Prisma client loaded successfully');
    
    // Test a simple query to verify connection
    const count = await prisma.kycSubmission.count();
    console.log(`✅ Database connection working. Found ${count} KYC submissions`);
    
    // Test that updatedAt field is accessible
    const kycSubmissions = await prisma.kycSubmission.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true
      },
      take: 1
    });
    
    if (kycSubmissions.length > 0) {
      console.log('✅ updatedAt field is accessible in schema');
      console.log(`   Sample record: createdAt=${kycSubmissions[0].createdAt}, updatedAt=${kycSubmissions[0].updatedAt}`);
    }
    
  } catch (error) {
    console.error('❌ Prisma error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();