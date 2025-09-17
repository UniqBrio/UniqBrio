// Test script to verify that Registration model now uses "registrations" collection

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function testRegistrationCollection() {
  try {
    console.log('🧪 Testing Registration collection mapping...\n');

    // Check current registrations - this should query "registrations" collection now
    console.log('📋 Querying registrations collection...');
    const registrations = await prisma.registration.findMany({
      select: { 
        id: true,
        userId: true, 
        academyId: true, 
        createdAt: true 
      }
    });

    console.log(`✅ Found ${registrations.length} records in "registrations" collection`);
    
    if (registrations.length > 0) {
      registrations.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.userId} -> ${reg.academyId} (${reg.createdAt})`);
      });
    } else {
      console.log('💡 No records found - collection is ready for new registrations');
    }

    // Test that we can access both collections to confirm the mapping worked
    console.log('\n🔍 Checking collection access...');
    
    // List all collections to see both "Registration" and "registrations"
    const admin = prisma.$runCommandRaw({ listCollections: 1 });
    
    console.log('📊 Available collections:', await admin.then(result => 
      result.cursor.firstBatch.map(col => col.name).filter(name => 
        name.includes('registration') || name.includes('Registration')
      )
    ));

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // If error contains "Registration" it means the old collection name is still being used
    if (error.message && error.message.includes('Registration')) {
      console.log('⚠️  The Prisma client might still be using the old collection name.');
      console.log('💡 Try restarting your development server or regenerating Prisma client.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRegistrationCollection();