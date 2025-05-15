import { buildConfig } from "payload";
// Remove path import if no longer needed after removing typescript/graphQL blocks
// import path from "path";
import { mongooseAdapter } from "@payloadcms/db-mongodb"; // Correct adapter import
import Users from "./cms/collections/Users"; // Assuming path is correct
import SupportTickets from "./cms/collections/SupportTickets"; // Assuming path is correct

// Add checks for essential environment variables
if (!process.env.PAYLOAD_SECRET) {
  throw new Error("PAYLOAD_SECRET environment variable is not set.");
}
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set.");
}

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug, // Use dynamic slug from collection
    meta: {
      titleSuffix: "- UniqBrio Admin",
    },
  },
  collections: [Users, SupportTickets],
  db: mongooseAdapter({ // Use the correct adapter function
    url: process.env.MONGODB_URI, // Rely on environment variable
    // Add other options like connectOptions if needed
  }),
  secret: process.env.PAYLOAD_SECRET, // Rely on environment variable

  // Removed typescript block - Payload/Next usually handles this.
  // If needed, use process.cwd() instead of __dirname
  // typescript: {
  //   outputFile: path.resolve(process.cwd(), 'src', 'payload-types.ts'),
  // },

  // Removed graphQL block - Usually not needed for output file.
  // If needed, use process.cwd() instead of __dirname
  // graphQL: {
  //   schemaOutputFile: path.resolve(process.cwd(), 'generated-schema.graphql'),
  // },

  // Ensure FRONTEND_URL is set correctly in Vercel env vars
  // Handle potential comma-separated list for multiple origins
  cors: (process.env.FRONTEND_URL || "http://localhost:3000").split(','),
  csrf: (process.env.FRONTEND_URL || "http://localhost:3000").split(','),

  upload: {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB (more explicit)
    },
    // Define S3 or other storage adapters here if needed
  },
  // Consider adding plugins like payloadCloud() if used
  // plugins: [],
});
