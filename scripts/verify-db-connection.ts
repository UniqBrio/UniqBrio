// This is a diagnostic script to verify Prisma + MongoDB Atlas connection
// Save this in a file like scripts/verify-db-connection.ts and run with:
// npx ts-node scripts/verify-db-connection.ts

import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

dotenv.config()

async function main() {
  console.log("Starting database connection test...")

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  console.log("✅ DATABASE_URL is set")

  // Create a new PrismaClient instance
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  })

  try {
    // Test connection by counting users
    console.log("Attempting to connect to MongoDB Atlas...")
    const userCount = await prisma.user.count()
    console.log(`✅ Successfully connected to MongoDB Atlas! Found ${userCount} users.`)

    // Test creating a test user
    console.log("Testing user creation...")
    const testEmail = `test-${Date.now()}@example.com`

    const newUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: testEmail,
        role: "student",
        verified: false,
      },
    })

    console.log(`✅ Successfully created test user with ID: ${newUser.id}`)

    // Test retrieving the user
    console.log("Testing user retrieval...")
    const retrievedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    if (retrievedUser && retrievedUser.id === newUser.id) {
      console.log("✅ Successfully retrieved test user")
    } else {
      console.error("❌ Failed to retrieve test user")
    }

    // Test updating the user
    console.log("Testing user update...")
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: { name: "Updated Test User" },
    })

    if (updatedUser.name === "Updated Test User") {
      console.log("✅ Successfully updated test user")
    } else {
      console.error("❌ Failed to update test user")
    }

    // Test deleting the user
    console.log("Testing user deletion...")
    await prisma.user.delete({
      where: { id: newUser.id },
    })

    const deletedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    if (!deletedUser) {
      console.log("✅ Successfully deleted test user")
    } else {
      console.error("❌ Failed to delete test user")
    }

    console.log("✅ All database operations completed successfully!")
  } catch (error) {
    console.error("❌ Database test failed with error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
