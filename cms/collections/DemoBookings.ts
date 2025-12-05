import type { CollectionConfig } from "payload"
import { isAdmin } from "../access/isAdmin"

const DemoBookings: CollectionConfig = {
  slug: "demo-bookings",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "phone", "academyType", "createdAt"],
  },
  access: {
    read: isAdmin,
    create: () => true, // Anyone can book a demo
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Academy Name",
    },
    {
      name: "email",
      type: "email",
      required: true,
      label: "Email Address",
    },
    {
      name: "phone",
      type: "text",
      required: true,
      label: "Phone Number",
    },
    {
      name: "academyType",
      type: "text",
      required: true,
      label: "Academy Type",
    },
    {
      name: "numStudents",
      type: "number",
      label: "Number of Students",
    },
    {
      name: "status",
      type: "select",
      options: [
        {
          label: "Pending",
          value: "pending",
        },
        {
          label: "Contacted",
          value: "contacted",
        },
        {
          label: "Scheduled",
          value: "scheduled",
        },
        {
          label: "Completed",
          value: "completed",
        },
        {
          label: "Cancelled",
          value: "cancelled",
        },
      ],
      defaultValue: "pending",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "notes",
      type: "textarea",
      label: "Internal Notes",
      admin: {
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
}

export default DemoBookings
