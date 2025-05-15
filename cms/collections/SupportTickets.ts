import type { CollectionConfig } from "payload"
import { isAdmin } from "../access/isAdmin"

const SupportTickets: CollectionConfig = {
  slug: "support-tickets",
  admin: {
    useAsTitle: "email",
  },
  access: {
    read: isAdmin,
    create: () => true, // Anyone can create a support ticket
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "issueType",
      type: "select",
      options: [
        {
          label: "Login Problems",
          value: "login",
        },
        {
          label: "Password Reset Issues",
          value: "password",
        },
        {
          label: "Email Verification",
          value: "verification",
        },
        {
          label: "Other",
          value: "other",
        },
      ],
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "ticketNumber",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "status",
      type: "select",
      options: [
        {
          label: "Open",
          value: "open",
        },
        {
          label: "In Progress",
          value: "in-progress",
        },
        {
          label: "Resolved",
          value: "resolved",
        },
        {
          label: "Closed",
          value: "closed",
        },
      ],
      defaultValue: "open",
      required: true,
    },
  ],
}

export default SupportTickets

