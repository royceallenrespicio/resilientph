"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_OR_MOBILE_BREAKPOINT = 1024

function useMediaQuery(maxWidthPx: number): boolean {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`)
    const onChange = () => setMatches(window.innerWidth < maxWidthPx)
    mql.addEventListener("change", onChange)
    const timeoutId = setTimeout(onChange, 0)
    return () => {
      clearTimeout(timeoutId)
      mql.removeEventListener("change", onChange)
    }
  }, [maxWidthPx])

  return !!matches
}

/** True when viewport is phone-width only (< 768px). */
export function useIsMobile() {
  return useMediaQuery(MOBILE_BREAKPOINT)
}

/** True when viewport is tablet or phone width (< 1024px). Used for collapsing desktop sidebar layouts. */
export function useIsTabletOrMobile() {
  return useMediaQuery(TABLET_OR_MOBILE_BREAKPOINT)
}
