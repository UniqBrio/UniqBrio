// Shared spots remaining logic - ensures DemoPopup and UrgencyBanner show the same number
let cachedSpots: number | null = null
let cachedBookings: number | null = null

export function getSpotsRemaining(): number {
  if (cachedSpots === null) {
    const allowedSpots = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13]
    cachedSpots = allowedSpots[Math.floor(Math.random() * allowedSpots.length)]
  }
  return cachedSpots
}

export function getBookingsCount(): number {
  if (cachedBookings === null) {
    const allowedCounts = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13]
    cachedBookings = allowedCounts[Math.floor(Math.random() * allowedCounts.length)]
  }
  return cachedBookings
}

// Reset functions in case we need to regenerate (e.g., on page refresh)
export function resetSpotsRemaining(): void {
  cachedSpots = null
}

export function resetBookingsCount(): void {
  cachedBookings = null
}
