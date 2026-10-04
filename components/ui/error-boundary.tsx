"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback UI. When omitted, the default error card is shown. */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Ignore benign browser View Transition abortions caused when document is hidden (tab switch/minimize)
    if (
      error.name === "InvalidStateError" ||
      error.message?.includes("Transition was aborted") ||
      error.message?.includes("Document hidden")
    ) {
      return { hasError: false, error: null }
    }
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (
      error.name === "InvalidStateError" ||
      error.message?.includes("Transition was aborted") ||
      error.message?.includes("Document hidden")
    ) {
      return
    }
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex-1 flex items-center justify-center p-8 w-full min-h-[300px]">
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center rounded-xl border border-destructive/15 bg-destructive/5 max-w-md w-full bg-card/40 backdrop-blur-md shadow-lg">
            <AlertTriangle className="size-10 text-destructive/60" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Something went wrong</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {this.state.error?.message || "An unexpected error occurred while rendering this section."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-1.5 cursor-pointer rounded-xl text-xs"
            >
              <RefreshCw className="size-3" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
