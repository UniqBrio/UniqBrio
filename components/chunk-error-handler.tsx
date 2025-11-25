"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ChunkErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    // Handle chunk load errors globally
    const handleChunkError = (event: ErrorEvent) => {
      const isChunkError =
        event.message?.includes("Loading chunk") ||
        event.message?.includes("ChunkLoadError") ||
        event.message?.includes("Failed to fetch dynamically imported module")

      if (isChunkError) {
        console.warn("Chunk load error detected, reloading page...", event.message)
        
        // Show user-friendly message before reload
        const shouldReload = confirm(
          "A new version of the application is available. Click OK to reload and get the latest updates."
        )
        
        if (shouldReload) {
          // Clear cache and reload
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name))
            })
          }
          window.location.reload()
        }
      }
    }

    // Listen for unhandled errors
    window.addEventListener("error", handleChunkError)

    // Also handle unhandled promise rejections (dynamic imports)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const isChunkError =
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("ChunkLoadError") ||
        error?.name === "ChunkLoadError"

      if (isChunkError) {
        console.warn("Chunk load error (promise) detected, reloading page...", error)
        event.preventDefault()
        
        // Automatically reload after a brief delay
        setTimeout(() => {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name))
            })
          }
          window.location.reload()
        }, 1000)
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleChunkError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [router])

  return null
}
