// Check for old Registration collection using Prisma raw queries

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function checkAndMigrateOldRecords() {
  try {
    console.log('🔍 Checking for old "Registration" collection...\n');

    // List all collections
    const result = await prisma.$runCommandRaw({ listCollections: 1 });
    const collections = result.cursor.firstBatch.map(c => c.name);
    
    console.log('📋 Available collections containing "registration":');
    const registrationCollections = collections.filter(name => 
      name.toLowerCase().includes('registration')
    );
    
    registrationCollections.forEach(name => {
      console.log(`  - ${name}`);
    });
    
    // Check if old "Registration" collection exists and has data
    if (collections.includes('Registration')) {
      console.log('\n⚠️  Found old "Registration" collection!');
      
      try {
        // Try to query the old collection
        const oldRecords = await prisma.$runCommandRaw({
          find: 'Registration',
          filter: {}
        });
        
        const recordCount = oldRecords.cursor.firstBatch.length;
        console.log(`📊 Old "Registration" collection has ${recordCount} records`);
        
        if (recordCount > 0) {
          console.log('\n📋 Records in old collection:');
          oldRecords.cursor.firstBatch.forEach((record, index) => {
            console.log(`${index + 1}. ${record.userId} -> ${record.academyId}`);
          });
          
          console.log('\n💡 These records need manual migration or the collection should be dropped.');
          console.log('🔧 Recommendation: Drop the old "Registration" collection as we\'re now using "registrations"');
          
          // Drop the old collection
          await prisma.$runCommandRaw({ drop: 'Registration' });
          console.log('✅ Dropped old "Registration" collection');
        }
      } catch (error) {
        console.log('📋 Old "Registration" collection exists but appears to be empty or inaccessible');
        console.log('🔧 Attempting to drop it...');
        
        try {
          await prisma.$runCommandRaw({ drop: 'Registration' });
          console.log('✅ Dropped old "Registration" collection');
        } catch (dropError) {
          console.log('⚠️  Could not drop old collection:', dropError.message);
        }
      }
    } else {
      console.log('\n✅ No old "Registration" collection found');
    }
    
    // Verify current "registrations" collection
    console.log('\n📊 Current "registrations" collection status:');
    const currentRegistrations = await prisma.registration.findMany({
      select: { userId: true, academyId: true }
    });
    
    console.log(`✅ Found ${currentRegistrations.length} records in "registrations" collection`);
    currentRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.userId} -> ${reg.academyId}`);
    });
    
    console.log('\n🎉 Collection mapping is now correctly configured!');
    console.log('💡 New registrations will be stored in "registrations" collection');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAndMigrateOldRecords();