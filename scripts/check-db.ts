import { prisma } from "../lib/prisma";

async function checkRegistrations() {
  try {
    // Try to find the specific registration we see in MongoDB Compass
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { userId: "AD000001" },
          { academyId: "AC000001" }
        ]
      }
    });
    
    console.log('\nLooking for registration with userId AD000001 or academyId AC000001:');
    console.log(JSON.stringify(registration, null, 2));
    
    // Get all registrations to see what's actually in the database
    const allRegistrations = await prisma.registration.findMany();
    console.log('\nAll registrations in database:');
    console.log(JSON.stringify(allRegistrations, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrations();
