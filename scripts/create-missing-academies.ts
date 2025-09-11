import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingAcademies() {
  try {
    console.log('Starting to create missing Academy records...');

    // Find all registrations that don't have corresponding Academy records
    const registrations = await prisma.registration.findMany({
      select: {
        academyId: true,
        businessInfo: true,
      },
    });

    const existingAcademies = await prisma.academy.findMany({
      select: { academyId: true },
    });

    const existingAcademyIds = new Set(existingAcademies.map(a => a.academyId));

    const missingAcademies = registrations.filter(
      reg => !existingAcademyIds.has(reg.academyId)
    );

    console.log(`Found ${missingAcademies.length} registrations without Academy records`);

    let created = 0;
    for (const registration of missingAcademies) {
      try {
        const businessInfo = registration.businessInfo as any;
        
        await prisma.academy.create({
          data: {
            academyId: registration.academyId,
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
          },
        });
        
        created++;
        console.log(`Created Academy record for ${registration.academyId}: ${businessInfo?.businessName || 'Unnamed Academy'}`);
      } catch (error) {
        console.error(`Failed to create Academy for ${registration.academyId}:`, error);
      }
    }

    console.log(`Successfully created ${created} Academy records`);
  } catch (error) {
    console.error('Error creating missing academies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createMissingAcademies();
}

export default createMissingAcademies;
