// Utility to broadcast session changes across tabs
// This uses BroadcastChannel API and localStorage as fallback

export function broadcastSessionChange(type: "SESSION_CHANGED" | "LOGOUT") {
  if (typeof window === "undefined") return

  // Use the globally exposed function from MultiTabSessionHandler
  if ((window as any).__broadcastSessionChange) {
    (window as any).__broadcastSessionChange(type)
  } else {
    // Fallback: directly use localStorage (triggers storage event in other tabs)
    localStorage.setItem("session_broadcast", `${type}_${Date.now()}`)
  }
}

// Clear the tab session storage when logging out
export function clearTabSession() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem("current_tab_session")
}
