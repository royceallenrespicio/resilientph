"use client"

import React, { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"

export interface GeocodedCity {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

interface WeatherLocationSearchProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: GeocodedCity[]
  setSearchResults: (results: GeocodedCity[]) => void
  activeLocation: GeocodedCity | null
  executeSearch: (query: string) => void
  selectCity: (city: GeocodedCity) => void
}

export function WeatherLocationSearch({
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  activeLocation,
  executeSearch,
  selectCity
}: WeatherLocationSearchProps) {
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const inlineSearchRef = useRef<HTMLDivElement>(null)

  // Close inline search suggestion and input on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inlineSearchRef.current && !inlineSearchRef.current.contains(event.target as Node)) {
        setIsEditingLocation(false)
        setSearchQuery("")
        setSearchResults([])
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setSearchResults, setSearchQuery])

  // Debounce query search on typing
  useEffect(() => {
    if (!isEditingLocation || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      executeSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, isEditingLocation, executeSearch, setSearchResults])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      executeSearch(searchQuery)
    }
  }

  return (
    <div className="relative flex-1" ref={inlineSearchRef}>
      {isEditingLocation ? (
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 mt-0.5 z-50 relative">
          <span className="inline-block size-1.5 rounded-full bg-success animate-pulse shrink-0" />
          <div className="relative flex items-center border-b border-border/40 focus-within:border-primary/50 transition-colors py-0">
            <label htmlFor="weather-city-search-inline" className="sr-only">Search city</label>
            <input
              type="text"
              id="weather-city-search-inline"
              name="city"
              placeholder="Search city…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsEditingLocation(false)
                  setSearchQuery("")
                  setSearchResults([])
                }
              }}
              autoFocus
              className="w-40 sm:w-48 bg-transparent border-0 text-sm font-semibold text-foreground focus:ring-0 focus:outline-none px-0.5 pb-0.5 font-sans placeholder:text-muted-foreground/60 placeholder:font-normal"
              spellCheck={false}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults([])
                }}
                className="absolute right-0 text-muted-foreground hover:text-foreground shrink-0 transition-colors p-0.5 cursor-pointer rounded-full"
                aria-label="Clear query"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditingLocation(false)
              setSearchQuery("")
              setSearchResults([])
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer shrink-0 ml-1.5 font-sans"
          >
            Cancel
          </button>

          {/* Autocomplete suggestion dropdown overlay for inline search */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-2.5 mt-1.5 w-48 sm:w-64 bg-card/95 border border-border/50 rounded-xl shadow-2xl z-50 divide-y divide-border/20 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              {searchResults.map((result, idx) => (
                <button
                  key={`${result.latitude}-${result.longitude}-${idx}`}
                  type="button"
                  onClick={() => {
                    selectCity(result)
                    setIsEditingLocation(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60 transition-colors flex flex-col gap-0.5 cursor-pointer font-sans"
                >
                  <span className="font-semibold truncate">{result.name}</span>
                  {(result.admin1 || result.country) && (
                    <span className="text-xs text-muted-foreground truncate">
                      {result.admin1 ? `${result.admin1}, ` : ""}{result.country || "PH"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </form>
      ) : (
        <div
          onClick={() => setIsEditingLocation(true)}
          className="group text-sm text-muted-foreground flex items-center gap-1.5 font-sans mt-1 cursor-pointer hover:text-foreground transition-colors select-none w-fit"
          title="Click to search and change location"
        >
          <span className="inline-block size-1.5 rounded-full bg-success animate-pulse shrink-0" />
          <span className="font-semibold text-sm text-foreground group-hover:underline decoration-primary/40 underline-offset-2 flex items-center gap-1">
            {activeLocation ? activeLocation.name : "Metro Manila, PH"}
            <Search className="size-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-all ml-0.5 shrink-0" />
          </span>
        </div>
      )}
    </div>
  )
}
