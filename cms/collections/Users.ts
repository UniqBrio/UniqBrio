import type { CollectionConfig } from "payload"
import { isAdmin } from "../access/isAdmin"

const Users: CollectionConfig = {
  slug: "users",
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: "email",
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
    },
    {
      name: "userType",
      type: "select",
      options: [
        {
          label: "Individual",
          value: "individual",
        },
        {
          label: "Business",
          value: "business",
        },
      ],
      required: true,
    },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "verificationToken",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "resetToken",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "resetTokenExpiry",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "failedAttempts",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "lockedUntil",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "googleId",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default Users

