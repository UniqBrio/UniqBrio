import { getPayload } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import Users from "../cms/collections/Users";
import SupportTickets from "../cms/collections/SupportTickets";

// Global cache for reuse across invocations (Vercel function-level reuse)
let cached = (globalThis as any).payload;

if (!cached) {
  cached = (globalThis as any).payload = {
    client: null,
    promise: null,
  };
}

export async function createPayloadClient() {
  if (cached.client) return cached.client;

  if (!cached.promise) {
    // Check essential environment variables
    const {
      PAYLOAD_PUBLIC_SERVER_URL,
      PAYLOAD_SECRET,
      MONGODB_URI,
      FRONTEND_URL
    } = process.env;

    if (!PAYLOAD_SECRET) throw new Error("Missing PAYLOAD_SECRET");
    if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

    cached.promise = getPayload({
      config: {
        serverURL: PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
        secret: PAYLOAD_SECRET,
        db: mongooseAdapter({ url: MONGODB_URI }),
        collections: [Users, SupportTickets],

        admin: {
          user: Users.slug,
          meta: {
            titleSuffix: "- UniqBrio Admin",
            title: "UniqBrio Admin",
            description: "Admin panel for UniqBrio.",
            defaultOGImageType: "off",
            metadataBase: PAYLOAD_PUBLIC_SERVER_URL ? new URL(PAYLOAD_PUBLIC_SERVER_URL) : undefined,
          },
          timezones: {
            defaultTimezone: "Etc/UTC",
            supportedTimezones: [{ label: "UTC", value: "Etc/UTC" }],
          },
        } as any,

        cors: (FRONTEND_URL || "http://localhost:3000").split(","),
        csrf: (FRONTEND_URL || "http://localhost:3000").split(","),

        upload: {
          limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
          adapters: [], // Recommend S3 if you're uploading from Vercel
        },

        telemetry: false,
        graphQL: { disable: true },
        typescript: { outputFile: undefined, declare: false },
        globals: [],
        endpoints: [],
        plugins: [],
        hooks: {},
        i18n: undefined,
      } as any,
    });
  }

  try {
    cached.client = await cached.promise;
    return cached.client;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}
