import { buildConfig } from "payload";
import path from "path";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import Users from "./cms/collections/Users";
import SupportTickets from "./cms/collections/SupportTickets";

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: "users",
    meta: {
      titleSuffix: "- UniqBrio Admin",
    },
  },
  collections: [Users, SupportTickets],
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || "your-mongodb-uri",
  }),
  secret: process.env.PAYLOAD_SECRET || "your-secret-key",
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  cors: [process.env.FRONTEND_URL || "http://localhost:3000"],
  csrf: [process.env.FRONTEND_URL || "http://localhost:3000"],
  upload: {
    limits: {
      fileSize: 5000000, // 5MB
    },
  },
});
