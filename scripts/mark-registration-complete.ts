import prisma from "../lib/db";

async function markRegistrationComplete(email: string) {
  const user = await prisma.user.update({
    where: { email },
    data: { registrationComplete: true },
  });
  console.log(`Updated user:`, user);
}

const email = process.argv[2];
if (!email) {
  console.error("Please provide an email as an argument.");
  process.exit(1);
}

markRegistrationComplete(email)
  .then(() => {
    console.log("Registration marked complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error updating user:", err);
    process.exit(1);
  });
