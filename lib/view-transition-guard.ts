/**
 * Browser View Transition API guard.
 *
 * Prevents "Recoverable InvalidStateError: Transition was aborted because of invalid state. Document hidden"
 * which occurs in Chromium / React 19 when view transitions are triggered or running while
 * the document visibility state is hidden (e.g., user switched tabs or minimized window).
 */

if (typeof window !== "undefined") {
  // 1. Suppress global unhandled rejection / error events for benign view transition aborts
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason
    const msg = String(reason?.message || reason || "")
    if (
      reason?.name === "InvalidStateError" ||
      msg.includes("Transition was aborted") ||
      msg.includes("Document hidden")
    ) {
      event.preventDefault()
    }
  })

  window.addEventListener("error", (event) => {
    const msg = String(event.message || event.error?.message || "")
    if (
      event.error?.name === "InvalidStateError" ||
      msg.includes("Transition was aborted") ||
      msg.includes("Document hidden")
    ) {
      event.preventDefault()
    }
  })

  // 2. Wrap document.startViewTransition to safely handle hidden documents
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    const origStartViewTransition = document.startViewTransition.bind(document)

    document.startViewTransition = function (callbackOrOptions) {
      const options = callbackOrOptions as { update?: () => void; types?: string[] } | (() => void) | undefined

      if (document.visibilityState === "hidden") {
        // Document is hidden: native API will reject with InvalidStateError.
        // Run update callback directly and return a mock resolved ViewTransition object.
        const update =
          typeof options === "function"
            ? options
            : options?.update

        if (update) {
          try {
            const res = update() as Promise<void> | undefined
            if (res && typeof res.then === "function") {
              res.catch(() => {})
            }
          } catch {
            // Ignore callback execution errors in hidden state
          }
        }

        const typesList = typeof options === "object" && options?.types ? options.types : []

        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: () => {},
          types: new Set(typesList),
        } as unknown as ViewTransition
      }

      try {
        const transition = origStartViewTransition(callbackOrOptions)

        // Catch promise rejections if the document becomes hidden while transition is active
        if (transition && typeof transition.finished?.catch === "function") {
          transition.finished.catch((err) => {
            if (
              err?.name === "InvalidStateError" ||
              String(err?.message || "").includes("Document hidden") ||
              String(err?.message || "").includes("Transition was aborted")
            ) {
              return
            }
          })
        }

        if (transition && typeof transition.ready?.catch === "function") {
          transition.ready.catch((err) => {
            if (
              err?.name === "InvalidStateError" ||
              String(err?.message || "").includes("Document hidden") ||
              String(err?.message || "").includes("Transition was aborted")
            ) {
              return
            }
          })
        }

        return transition
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string }
        if (
          error?.name === "InvalidStateError" ||
          String(error?.message || "").includes("Document hidden") ||
          String(error?.message || "").includes("Transition was aborted")
        ) {
          const update =
            typeof options === "function"
              ? options
              : options?.update

          if (update) {
            try {
              update()
            } catch {
              // Ignore
            }
          }

          const typesList = typeof options === "object" && options?.types ? options.types : []

          return {
            ready: Promise.resolve(),
            finished: Promise.resolve(),
            updateCallbackDone: Promise.resolve(),
            skipTransition: () => {},
            types: new Set(typesList),
          } as unknown as ViewTransition
        }

        throw err
      }
    }
  }
}
