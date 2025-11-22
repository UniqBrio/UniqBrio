"use client"

import { Component, type ErrorInfo, type ReactNode, cloneElement, isValidElement } from "react"

interface Props {
  children?: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // Simply render the fallback without trying to pass props
      return this.props.fallback
    }

    return this.props.children
  }
}

export default ErrorBoundary
