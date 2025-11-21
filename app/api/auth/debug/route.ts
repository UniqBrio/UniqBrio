// Test OAuth configuration
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    baseUrl: baseUrl,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    expectedRedirectUri: `${baseUrl}/api/auth/callback/google`,
    currentTime: new Date().toISOString()
  })
}