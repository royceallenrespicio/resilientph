import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { toast } from "sonner"

export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role: "citizen" | "responder" | "admin"
  created_at: string
  updated_at: string
}

export function useProfile() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Profile fields state
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<string>("citizen")

  // Password fields state
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Fetch initial data
  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        setLoading(true)
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!active) return

        if (currentUser) {
          setUser(currentUser)
          setEmail(currentUser.email || "")

          // Fetch database profile details
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single()

          if (profileError) {
            console.error("Failed to load DB profile:", profileError.message)
          }

          if (active && profileData) {
            setProfile(profileData)
            setUsername(profileData.username || "")
            setDisplayName(profileData.display_name || "")
            setRole(profileData.role || "citizen")
          }
        }
      } catch (err: unknown) {
        console.error("Error loading profile data:", err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [supabase])

  // Save profile changes (username & display name)
  const handleUpdateProfile = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user) return false

    const cleanUsername = username.trim()
    const cleanDisplayName = displayName.trim()

    // Validate username: 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!cleanUsername) {
      toast.error("Username is required.")
      return false
    }
    if (!usernameRegex.test(cleanUsername)) {
      toast.error("Username must be 3-20 characters and contain only letters, numbers, and underscores.")
      return false
    }

    try {
      setSavingProfile(true)

      // 1. Update profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          display_name: cleanDisplayName || null,
        })
        .eq("id", user.id)

      if (dbError) {
        if (dbError.message.includes("duplicate key")) {
          toast.error("Username is already taken.")
        } else {
          toast.error(dbError.message)
        }
        return false
      }

      // 2. Update auth user metadata so navigation bar/sidebar updates immediately
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: cleanUsername }
      })

      if (authError) {
        console.error("Auth metadata sync failed:", authError.message)
      }

      // Update local hook state
      if (profile) {
        setProfile({
          ...profile,
          username: cleanUsername,
          display_name: cleanDisplayName || null,
        })
      }

      toast.success("Profile updated successfully!")
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Failed to update profile: ${msg}`)
      return false
    } finally {
      setSavingProfile(false)
    }
  }, [user, username, displayName, supabase, profile])

  // Update password
  const handleUpdatePassword = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user) return false

    if (!password) {
      toast.error("New password is required.")
      return false
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.")
      return false
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return false
    }

    try {
      setSavingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success("Password updated successfully!")
      setPassword("")
      setConfirmPassword("")
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Failed to update password: ${msg}`)
      return false
    } finally {
      setSavingPassword(false)
    }
  }, [user, password, confirmPassword, supabase])

  return {
    user,
    profile,
    loading,
    savingProfile,
    savingPassword,
    // Fields
    username,
    setUsername,
    displayName,
    setDisplayName,
    email,
    role,
    // Password fields
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    // Actions
    handleUpdateProfile,
    handleUpdatePassword,
  }
}
