/**
 * Device & Environment Parser
 * 
 * Privacy-safe device information extraction from user agent and request headers.
 * Complies with GDPR and DPDP Act requirements:
 * - No fingerprinting or tracking
 * - Coarse geolocation only (country level)
 * - IP addresses are hashed (one-way, not reversible)
 * - Used solely for security and session management
 */

import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;  // e.g., "Chrome 120.0"
  os: string;       // e.g., "Windows 11"
  userAgent: string; // Raw user agent (stored for security audit)
  isPWA?: boolean;  // Whether user is accessing via installed PWA
}

export interface LocationInfo {
  ipHash: string;     // One-way hashed IP (not reversible)
  country?: string;   // Country code only (coarse geo)
}

export interface FullSessionMetadata extends DeviceInfo, LocationInfo {}

/**
 * Parse user agent string to extract device information
 * Uses ua-parser-js for standardized parsing
 * 
 * @param userAgent - Raw user agent string from request headers
 * @returns Device information object
 */
export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      browser: 'Unknown',
      os: 'Unknown',
      userAgent: 'N/A',
    };
  }

  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType: DeviceInfo['deviceType'] = 'unknown';
    if (result.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceType = 'tablet';
    } else if (result.device.type === 'console' || 
               result.device.type === 'smarttv' || 
               result.device.type === 'wearable' || 
               result.device.type === 'embedded') {
      deviceType = 'unknown';
    } else {
      // Desktop, laptop, or no device type specified
      deviceType = 'desktop';
    }

    // Format browser string
    const browser = result.browser.name 
      ? `${result.browser.name}${result.browser.version ? ` ${result.browser.version.split('.')[0]}` : ''}`
      : 'Unknown Browser';

    // Format OS string
    const os = result.os.name
      ? `${result.os.name}${result.os.version ? ` ${result.os.version}` : ''}`
      : 'Unknown OS';

    return {
      deviceType,
      browser,
      os,
      userAgent,
    };
  } catch (error) {
    console.error('[DeviceParser] Error parsing user agent:', error);
    return {
      deviceType: 'unknown',
      browser: 'Parse Error',
      os: 'Unknown',
      userAgent,
    };
  }
}

/**
 * Hash IP address for privacy-safe storage
 * Uses SHA-256 with a salt for one-way hashing
 * 
 * GDPR/DPDP Compliance: IP addresses are considered personal data.
 * By hashing, we can:
 * - Detect suspicious login patterns
 * - Prevent session hijacking
 * - Cannot reverse the hash to get original IP
 * 
 * @param ipAddress - Raw IP address from request
 * @returns One-way hashed IP address
 */
export function hashIpAddress(ipAddress: string | null | undefined): string {
  if (!ipAddress || ipAddress === 'unknown') {
    return 'unknown';
  }

  try {
    // Use a salt from environment (should be consistent across instances)
    const salt = process.env.IP_HASH_SALT || 'uniqbrio-ip-salt-2025';
    
    // Create SHA-256 hash
    const hash = createHash('sha256')
      .update(`${salt}:${ipAddress}`)
      .digest('hex');
    
    // Return first 16 characters for storage efficiency
    return hash.substring(0, 16);
  } catch (error) {
    console.error('[DeviceParser] Error hashing IP address:', error);
    return 'hash-error';
  }
}

/**
 * Extract IP address from request headers
 * Handles various proxy configurations (Cloudflare, AWS, etc.)
 * 
 * @param headers - Request headers object or Headers instance
 * @returns IP address or 'unknown'
 */
export function extractIpAddress(
  headers: Headers | Record<string, string | string[] | undefined>
): string {
  try {
    // Convert Headers to Record if needed
    const headersObj: Record<string, string | undefined> = 
      headers instanceof Headers
        ? Object.fromEntries(headers.entries())
        : headers as Record<string, string | undefined>;

    // Check various proxy headers (in order of preference)
    const possibleHeaders = [
      'x-real-ip',
      'x-forwarded-for',
      'cf-connecting-ip', // Cloudflare
      'x-client-ip',
      'x-cluster-client-ip',
      'forwarded',
    ];

    for (const header of possibleHeaders) {
      const value = headersObj[header] || headersObj[header.toLowerCase()];
      if (value) {
        // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
        // We want the first one (the client)
        let ip: string;
        if (typeof value === 'string') {
          ip = value.split(',')[0].trim();
        } else if (Array.isArray(value)) {
          ip = String(value[0] || '').trim();
        } else {
          ip = String(value).trim();
        }
        
        if (ip && ip !== 'unknown') {
          return ip;
        }
      }
    }

    return 'unknown';
  } catch (error) {
    console.error('[DeviceParser] Error extracting IP address:', error);
    return 'unknown';
  }
}

/**
 * Get country from IP address using geolocation API (optional)
 * 
 * Note: This is a placeholder. In production, you would:
 * - Use a geolocation service (MaxMind, IPinfo, CloudFlare)
 * - Or rely on CDN headers (cf-ipcountry)
 * - Store only country code, not city or precise location
 * 
 * @param ipAddress - IP address to geolocate
 * @param headers - Request headers (may contain geo data from CDN)
 * @returns Country code (ISO 3166-1 alpha-2) or undefined
 */
export async function getCountryFromIp(
  ipAddress: string,
  headers?: Headers | Record<string, string | undefined>
): Promise<string | undefined> {
  try {
    // Check if CloudFlare provides country header
    if (headers) {
      const headersObj: Record<string, string | undefined> = 
        headers instanceof Headers
          ? Object.fromEntries(headers.entries())
          : headers as Record<string, string | undefined>;
      
      const cfCountry = headersObj['cf-ipcountry'] || headersObj['CF-IPCountry'];
      if (cfCountry && cfCountry !== 'XX') {
        return cfCountry.toUpperCase();
      }
    }

    // For development or when no geolocation is available
    if (process.env.NODE_ENV === 'development' || ipAddress === 'unknown') {
      return undefined;
    }

    // Production: Integrate with geolocation service
    // Example with ipapi.co (free tier available)
    // Note: You should implement rate limiting and caching
    
    // Placeholder - implement actual geolocation service
    return undefined;
  } catch (error) {
    console.error('[DeviceParser] Error getting country from IP:', error);
    return undefined;
  }
}

/**
 * Parse complete session metadata from request
 * Combines device info and location info
 * 
 * @param headers - Request headers
 * @returns Complete session metadata for storage
 */
export async function parseSessionMetadata(
  headers: Headers
): Promise<FullSessionMetadata> {
  const userAgent = headers.get('user-agent') || undefined;
  const deviceInfo = parseUserAgent(userAgent);
  
  const ipAddress = extractIpAddress(headers);
  const ipHash = hashIpAddress(ipAddress);
  const country = await getCountryFromIp(ipAddress, headers);

  return {
    ...deviceInfo,
    ipHash,
    country,
  };
}

/**
 * Format device info for display in UI
 * 
 * @param deviceInfo - Device information from database
 * @returns Human-readable device description
 */
export function formatDeviceDisplay(deviceInfo: Partial<DeviceInfo>): string {
  const parts: string[] = [];
  
  if (deviceInfo.browser && deviceInfo.browser !== 'Unknown Browser') {
    parts.push(deviceInfo.browser);
  }
  
  if (deviceInfo.os && deviceInfo.os !== 'Unknown OS') {
    parts.push(deviceInfo.os);
  }
  
  if (deviceInfo.deviceType && deviceInfo.deviceType !== 'unknown') {
    const type = deviceInfo.deviceType.charAt(0).toUpperCase() + 
                 deviceInfo.deviceType.slice(1);
    parts.push(type);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Unknown Device';
}

/**
 * Get device icon name based on device type
 * For use with Lucide React icons
 * 
 * @param deviceType - Device type from parsed data
 * @returns Icon name for UI rendering
 */
export function getDeviceIcon(deviceType: DeviceInfo['deviceType']): string {
  switch (deviceType) {
    case 'mobile':
      return 'Smartphone';
    case 'tablet':
      return 'Tablet';
    case 'desktop':
      return 'Monitor';
    default:
      return 'HelpCircle';
  }
}
