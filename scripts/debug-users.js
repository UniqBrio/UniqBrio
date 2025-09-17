// Quick DB debug script to list users and registrations
require('dotenv').config({ path: 'd:\\UniqBrio\\.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        academyId: true,
        verified: true,
        registrationComplete: true,
      }
    });

    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        userId: true,
        academyId: true,
        businessInfo: true,
        adminInfo: true,
      }
    });

    console.log(JSON.stringify({
      totalUsers: users.length,
      totalRegistrations: registrations.length,
      users,
      registrations,
    }, null, 2));
  } catch (err) {
    console.error('debug-users.js error:', err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();