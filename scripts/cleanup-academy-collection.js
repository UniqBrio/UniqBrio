// Clean up existing Academy collection data since we no longer use it

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function cleanupAcademyCollection() {
  try {
    console.log('🧹 Cleaning up Academy collection...\n');

    // First, let's see what collections exist
    const result = await prisma.$runCommandRaw({ listCollections: 1 });
    const collections = result.cursor.firstBatch.map(c => c.name);
    
    console.log('📋 Available collections:');
    collections.forEach(name => {
      console.log(`  - ${name}`);
    });

    // Check if Academy collection exists and has data
    if (collections.includes('Academy')) {
      console.log('\n⚠️  Found old "Academy" collection!');
      
      try {
        // Get Academy data before deleting (for reference)
        const academyData = await prisma.$runCommandRaw({
          find: 'Academy',
          filter: {}
        });
        
        const academyCount = academyData.cursor.firstBatch.length;
        console.log(`📊 Academy collection has ${academyCount} records`);
        
        if (academyCount > 0) {
          console.log('\n📋 Academy records being removed:');
          academyData.cursor.firstBatch.forEach((academy, index) => {
            console.log(`${index + 1}. ${academy.academyId}: ${academy.name} (${academy.email})`);
          });
        }
        
        // Drop the Academy collection since we no longer need it
        console.log('\n🗑️  Dropping Academy collection...');
        await prisma.$runCommandRaw({ drop: 'Academy' });
        console.log('✅ Academy collection successfully dropped');
        
      } catch (error) {
        if (error.message.includes('ns not found')) {
          console.log('✅ Academy collection is already empty or doesn\'t exist');
        } else {
          console.log('❌ Error accessing Academy collection:', error.message);
        }
      }
    } else {
      console.log('\n✅ No Academy collection found - already cleaned up');
    }

    // Verify current state
    console.log('\n📊 Final verification:');
    const finalResult = await prisma.$runCommandRaw({ listCollections: 1 });
    const finalCollections = finalResult.cursor.firstBatch.map(c => c.name);
    
    const hasAcademy = finalCollections.includes('Academy');
    const hasRegistrations = finalCollections.includes('registrations');
    
    console.log(`✅ Academy collection exists: ${hasAcademy ? 'YES ❌' : 'NO ✅'}`);
    console.log(`✅ Registrations collection exists: ${hasRegistrations ? 'YES ✅' : 'NO ❌'}`);
    
    if (!hasAcademy && hasRegistrations) {
      console.log('\n🎉 Perfect! Academy collection removed, registrations collection active');
      
      // Show current registrations count
      const regCount = await prisma.registration.count();
      console.log(`📊 Active registrations: ${regCount} records`);
    }

    console.log('\n✅ Academy collection cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupAcademyCollection();