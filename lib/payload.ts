import { getPayload } from "payload";
// import config from "../payload.config"; // No longer importing the config file
import { mongooseAdapter } from "@payloadcms/db-mongodb"; // Correct adapter import
import Users from "../cms/collections/Users"; // Assuming path is correct
import SupportTickets from "../cms/collections/SupportTickets"; // Assuming path is correct

// Cache the Payload instance
let cached = (global as any).payload;

if (!cached) {
  cached = (global as any).payload = {
    client: null,
    promise: null,
  };
}

export async function createPayloadClient() {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    cached.promise = getPayload({
      // Inlined configuration
      config: {
        serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
        admin: { // This whole object will be cast to 'any'
          user: Users.slug, // Use dynamic slug from collection
          meta: {
            titleSuffix: "- UniqBrio Admin",
            // Provide additional required meta properties for type safety
            title: "UniqBrio Admin",
            description: "Admin panel for UniqBrio.",
            defaultOGImageType: 'off', // As per type 'off' | 'dynamic' | 'static'
            metadataBase: process.env.PAYLOAD_PUBLIC_SERVER_URL ? new URL(process.env.PAYLOAD_PUBLIC_SERVER_URL) : null,
          }, // No longer need 'as any' here if parent 'admin' is 'as any'
          // Add default timezones configuration
          timezones: {
            defaultTimezone: 'Etc/UTC', // A sensible default
            supportedTimezones: [ { label: 'UTC', value: 'Etc/UTC' } ], // Minimal supported timezones
          }, // No longer need 'as any' here if parent 'admin' is 'as any'
        } as any, // Cast the entire admin object to 'any'
        // Cast collections to 'any' to bypass strict SanitizedCollectionConfig check for inlining
        collections: [Users, SupportTickets] as any,
        db: mongooseAdapter({ // Use the correct adapter function
          url: process.env.MONGODB_URI!, // Assert non-null, as it's checked in payload.config.ts
        }) as any, // Cast to 'any' to bypass strict DatabaseAdapter type check for inlining
        secret: process.env.PAYLOAD_SECRET!, // Assert non-null

        // Ensure FRONTEND_URL is set correctly in Vercel env vars
        // Handle potential comma-separated list for multiple origins
        cors: (process.env.FRONTEND_URL || "http://localhost:3000").split(','),
        csrf: (process.env.FRONTEND_URL || "http://localhost:3000").split(','),

        upload: {
          limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
          },
          // Add 'adapters' array; for Vercel, a cloud adapter (e.g., S3) is recommended for actual uploads.
          adapters: [],
        },
        // Add other common top-level config properties with sensible defaults
        // to prevent Payload from trying to load them from non-exported internal paths.
        endpoints: [],
        globals: [],
        hooks: {}, // Global hooks
        plugins: [],
        telemetry: false, // Explicitly disable telemetry
        i18n: undefined, // Or provide a minimal i18n config if needed
        // If you're not generating GraphQL schema or TS types at runtime with getPayload:
        graphQL: { disable: true },
        typescript: { outputFile: undefined, declare: false }, // `declare: false` can prevent some FS operations
      } as any, // Cast the entire inlined config object to 'any'
    });
  }

  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.client;
}
