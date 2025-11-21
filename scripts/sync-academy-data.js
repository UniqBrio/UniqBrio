require('dotenv').config();
const { getMongoClient, closeConnections } = require('../lib/mongodb.js');

async function syncAcademyData() {
  try {
    const { client, db } = await getMongoClient();
    
    console.log('🔍 Checking registrations and Academy collections...');
    
    // Get all registrations
    const registrations = await db.collection('registrations').find({}).toArray();
    console.log(`Found ${registrations.length} registrations`);
    
    // Get all existing academies
    const existingAcademies = await db.collection('Academy').find({}).toArray();
    console.log(`Found ${existingAcademies.length} existing academies`);
    
    const existingAcademyIds = existingAcademies.map(a => a.academyId);
    console.log('Existing Academy IDs:', existingAcademyIds);
    
    // Find registrations that don't have corresponding Academy records
    const missingAcademies = [];
    const processedAcademyIds = new Set();
    
    registrations.forEach((reg, index) => {
      const academyId = reg.academyId;
      const businessInfo = reg.businessInfo;
      
      console.log(`\nRegistration ${index + 1}:`);
      console.log(`  Academy ID: ${academyId}`);
      console.log(`  Business Name: ${businessInfo?.businessName}`);
      console.log(`  Email: ${businessInfo?.businessEmail}`);
      console.log(`  Created: ${reg.createdAt}`);
      
      if (!existingAcademyIds.includes(academyId) && !processedAcademyIds.has(academyId)) {
        console.log(`  ❌ Missing Academy record for ${academyId}`);
        processedAcademyIds.add(academyId);
        
        // Create Academy record from registration data
        const academyRecord = {
          academyId: academyId,
          name: businessInfo?.businessName || "",
          legalEntityName: businessInfo?.legalEntityName || "",
          email: businessInfo?.businessEmail || "",
          phone: businessInfo?.phoneNumber || "",
          industryType: businessInfo?.industryType || "",
          servicesOffered: businessInfo?.servicesOffered || [],
          studentSize: businessInfo?.studentSize || "",
          staffCount: businessInfo?.staffCount || "",
          country: businessInfo?.country || "",
          state: businessInfo?.state || "",
          city: businessInfo?.city || "",
          address: businessInfo?.address || "",
          website: businessInfo?.website || "",
          preferredLanguage: businessInfo?.preferredLanguage || "",
          logoUrl: null,
          createdAt: reg.createdAt || new Date()
        };
        
        missingAcademies.push(academyRecord);
      } else if (processedAcademyIds.has(academyId)) {
        console.log(`  ⚠️ Duplicate Academy ID ${academyId} - skipping`);
      } else {
        console.log(`  ✅ Academy record exists for ${academyId}`);
      }
    });
    
    if (missingAcademies.length > 0) {
      console.log(`\n🔧 Creating ${missingAcademies.length} missing Academy records...`);
      
      for (const academy of missingAcademies) {
        console.log(`Creating Academy: ${academy.academyId} - ${academy.name}`);
        await db.collection('Academy').insertOne(academy);
      }
      
      console.log('✅ Successfully created missing Academy records!');
    } else {
      console.log('\n✅ All registrations have corresponding Academy records!');
    }
    
    // Final count
    const finalAcademyCount = await db.collection('Academy').countDocuments();
    console.log(`\nFinal Academy count: ${finalAcademyCount}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

syncAcademyData();