// Cookie names
export const COOKIE_NAMES = {
    CONSENT: "uniqbrio_cookie_consent",
    SESSION: "session",
    LAST_ACTIVITY: "last_activity",
    DEVICE_ID: "device_id",
  }
  
  // Cookie expiration times in days
  export const COOKIE_EXPIRY = {
    CONSENT: 365, // days
    SESSION: 1, // days
    LAST_ACTIVITY: 1, // days
    DEVICE_ID: 30, // days
  }
  
  // Session timeout in milliseconds (30 minutes)
  export const SESSION_TIMEOUT = 30 * 60 * 1000
  