"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children?: ReactNode
  fallback: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store details so we can optionally render them for debugging
    this.setState({ error, errorInfo })
    // Always log; also invoke external handler if provided
    console.error("Uncaught error:", error, errorInfo)
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch {}
    }
  }

  private isDebug(): boolean {
    // Enable via query param ?debug=1 or via NEXT_PUBLIC_DEBUG_ERRORS=true
    try {
      // Read public env (inlined by Next.js at build time if provided)
      if (process.env.NEXT_PUBLIC_DEBUG_ERRORS === "true") return true
    } catch {}
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search)
      if (p.get("debug") === "1") return true
    }
    return false
  }

  public render() {
    if (this.state.hasError) {
      if (this.isDebug() && (this.state.error || this.state.errorInfo)) {
        // Developer-friendly error panel rendered on page for quick diagnosis
        const err = this.state.error
        const info = this.state.errorInfo
        return (
          <div className="p-4 m-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
            <h2 className="font-semibold mb-2">A runtime error occurred</h2>
            {err && (
              <pre className="whitespace-pre-wrap text-xs overflow-auto">
                {String(err?.stack || err?.message || err)}
              </pre>
            )}
            {info?.componentStack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Component stack</summary>
                <pre className="whitespace-pre-wrap text-xs overflow-auto mt-1">{info.componentStack}</pre>
              </details>
            )}
            <p className="mt-2 text-xs text-red-700">Tip: Remove ?debug=1 from the URL (or set NEXT_PUBLIC_DEBUG_ERRORS=false) to hide this.</p>
          </div>
        )
      }
      // Normal users see the provided fallback UI
      return this.props.fallback
    }

    return this.props.children
  }
}

export default ErrorBoundary
