// Reusable validation helpers for the Add/Edit Instructor flows

// Email validation: pragmatic and user-friendly, not RFC-5322 exhaustive.
// Rules:
// - total length <= 254
// - one @ splitting local and domain
// - local part <= 64, no consecutive dots, cannot start/end with dot
// - domain: labels 1-63 chars, alnum plus hyphen in middle, no leading/trailing hyphen
// - at least one dot in domain and TLD length >= 2
export function validateEmail(email: string): { ok: true } | { ok: false; reason: string } {
  const value = email.trim()
  if (!value) return { ok: false, reason: "Email is required." }
  if (value.length > 254) return { ok: false, reason: "Email is too long (max 254 characters)." }

  const atIndex = value.indexOf("@")
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@")) {
    return { ok: false, reason: "Please enter a valid email address (one '@' symbol)." }
  }

  const local = value.slice(0, atIndex)
  const domain = value.slice(atIndex + 1)
  if (!local || !domain) return { ok: false, reason: "Please enter a valid email address." }
  if (local.length > 64) return { ok: false, reason: "The part before '@' is too long (max 64 characters)." }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { ok: false, reason: "Local part cannot start/end with a dot or contain consecutive dots." }
  }

  // Enhanced validation for local part
  // 1. Check for allowed characters (common pragmatic set)
  const localOk = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)
  if (!localOk) return { ok: false, reason: "Local part contains invalid characters." }
  
  // 2. Reject consecutive hyphens, which are often typos
  if (local.includes('--')) return { ok: false, reason: "Email cannot contain consecutive hyphens." }
  
  // 3. Local part cannot start or end with hyphen
  if (local.startsWith('-') || local.endsWith('-')) {
    return { ok: false, reason: "Local part cannot start or end with a hyphen." }
  }
  
  // 4. Must contain at least one letter or number (not just special characters)
  if (!/[A-Za-z0-9]/.test(local)) {
    return { ok: false, reason: "Email must contain at least one letter or number." }
  }

  // Domain must have at least one dot and valid labels
  if (!domain.includes('.')) return { ok: false, reason: "Domain must contain a dot, e.g., example.com." }
  if (domain.length > 253) return { ok: false, reason: "Domain is too long." }
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { ok: false, reason: "Domain cannot start/end with a dot or contain consecutive dots." }
  }

  const labels = domain.split('.')
  for (const label of labels) {
    if (label.length < 1 || label.length > 63) return { ok: false, reason: "Domain labels must be 1-63 characters." }
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)) {
      return { ok: false, reason: "Domain labels can only contain letters, numbers, and hyphens (no leading/trailing hyphen)." }
    }
  }
  const tld = labels[labels.length - 1]
  if (tld.length < 2) return { ok: false, reason: "Top-level domain should be at least 2 characters (e.g., .com)." }

  return { ok: true }
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email).ok
}
