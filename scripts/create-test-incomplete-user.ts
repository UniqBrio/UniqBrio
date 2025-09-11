import prisma from "@/lib/db";

async function createTestIncompleteUser() {
  try {
    console.log("\n=== Creating Test User with Incomplete Registration ===\n");
    
    // Create a test user with incomplete registration
    const testUser = await prisma.user.create({
      data: {
        name: "Test Incomplete User",
        email: "incomplete@test.com",
        phone: "+1234567890",
        password: "$2a$10$testhashedpassword", // Mock hashed password
        role: "super_admin",
        verified: true, // Verified but registration incomplete
        registrationComplete: false, // This is the key - incomplete registration
        verificationToken: null,
      }
    });
    
    console.log("✅ Created test user:", testUser);
    
    console.log("\n=== Expected Middleware Behavior ===");
    console.log("User: incomplete@test.com");
    console.log("Verified: true");
    console.log("Registration Complete: false");
    console.log("");
    console.log("Expected flow:");
    console.log("1. User logs in successfully");
    console.log("2. User tries to access /dashboard");
    console.log("3. Middleware checks: verified=true ✅, registrationComplete=false ❌");
    console.log("4. Middleware redirects to /register");
    console.log("5. User completes registration form");
    console.log("6. Registration sets registrationComplete=true");
    console.log("7. User can now access /dashboard");
    
    console.log("\n=== To Test This Flow ===");
    console.log("1. Login with: incomplete@test.com");
    console.log("2. Try accessing /dashboard - should redirect to /register");
    console.log("3. Complete registration form");
    console.log("4. Should redirect to /dashboard");
    
  } catch (error) {
    console.error("❌ Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestIncompleteUser();
