import Cookies from "js-cookie"

// Cookie names
export const COOKIE_NAMES = {
  CONSENT: "uniqbrio_cookie_consent",
  SESSION: "session",
  LAST_ACTIVITY: "last_activity",
  DEVICE_ID: "device_id",
}

// Cookie expiration times
export const COOKIE_EXPIRY = {
  CONSENT: 365, // days
  SESSION: 1, // days
  LAST_ACTIVITY: 1, // days
  DEVICE_ID: 30, // days
}

// Session timeout in milliseconds (30 minutes)
export const SESSION_TIMEOUT = 30 * 60 * 1000

// Set cookie consent
export function setCookieConsent(consentType: "all" | "essential") {
  Cookies.set(COOKIE_NAMES.CONSENT, consentType, {
    expires: COOKIE_EXPIRY.CONSENT,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

// Get cookie consent
export function getCookieConsent(): "all" | "essential" | null {
  const consent = Cookies.get(COOKIE_NAMES.CONSENT)
  if (consent === "all" || consent === "essential") {
    return consent
  }
  return null
}

// Update last activity timestamp
export function updateLastActivity() {
  Cookies.set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
    expires: COOKIE_EXPIRY.LAST_ACTIVITY,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

// Get last activity timestamp
export function getLastActivity(): number | null {
  const lastActivity = Cookies.get(COOKIE_NAMES.LAST_ACTIVITY)
  return lastActivity ? Number.parseInt(lastActivity, 10) : null
}

// Check if session is active
export function isSessionActive(): boolean {
  const lastActivity = getLastActivity()
  if (!lastActivity) return false

  const now = Date.now()
  return now - lastActivity < SESSION_TIMEOUT
}

// Generate a unique device ID
export function generateDeviceId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Set device ID
export function setDeviceId(deviceId: string) {
  Cookies.set(COOKIE_NAMES.DEVICE_ID, deviceId, {
    expires: COOKIE_EXPIRY.DEVICE_ID,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

// Get device ID
export function getDeviceId(): string | null {
  return Cookies.get(COOKIE_NAMES.DEVICE_ID) || null
}

// Ensure device ID exists
export function ensureDeviceId(): string {
  let deviceId = getDeviceId()
  if (!deviceId) {
    deviceId = generateDeviceId()
    setDeviceId(deviceId)
  }
  return deviceId
}

