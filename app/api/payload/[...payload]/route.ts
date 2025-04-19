import { createPayloadClient } from "@/lib/payload"
import type { NextRequest } from "next/server"

// This is a catch-all API route for Payload CMS
export async function GET(req: NextRequest, { params }: { params: { payload: string[] } }) {
  const payload = await createPayloadClient()
  return await payload.handle(req)
}

export async function POST(req: NextRequest, { params }: { params: { payload: string[] } }) {
  const payload = await createPayloadClient()
  return await payload.handle(req)
}

export async function PUT(req: NextRequest, { params }: { params: { payload: string[] } }) {
  const payload = await createPayloadClient()
  return await payload.handle(req)
}

export async function DELETE(req: NextRequest, { params }: { params: { payload: string[] } }) {
  const payload = await createPayloadClient()
  return await payload.handle(req)
}

export const dynamic = "force-dynamic"

