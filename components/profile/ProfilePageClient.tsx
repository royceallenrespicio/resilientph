"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useProfile } from "@/hooks/profile/use-profile"
import { PortalHeader } from "@/components/ui/portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Shield, Key, Eye, EyeOff, Save, Bell, Ghost, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { IncidentReport } from "@/lib/supabase/reports"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePageClient() {
  const {
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
  } = useProfile()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
 
  const [profileErrors, setProfileErrors] = useState<{ username?: string }>({})
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({})
 
  const [myIncidents, setMyIncidents] = useState<IncidentReport[]>([])
  const [loadingIncidents, setLoadingIncidents] = useState(true)
  const [updatingIncidentId, setUpdatingIncidentId] = useState<string | null>(null)
  const supabaseClient = useMemo(() => createClient(), [])
 
  const [refreshTrigger, setRefreshTrigger] = useState(0)
 
  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    let isMounted = true
 
    async function loadIncidents() {
      try {
        const { data, error } = await supabaseClient
          .from("incident_reports")
          .select("*, profiles:user_id(display_name, username)")
          .eq("user_id", userId)
          .order("reported_at", { ascending: false })
 
        if (error) throw error
        if (isMounted) {
          setMyIncidents((data || []) as IncidentReport[])
        }
      } catch (err) {
        console.error("Failed to load user reports:", err)
        toast.error("Failed to load your submitted reports.")
      } finally {
        if (isMounted) {
          setLoadingIncidents(false)
        }
      }
    }
 
    loadIncidents()
 
    return () => {
      isMounted = false
    }
  }, [user?.id, refreshTrigger, supabaseClient])
 
  const handleResolveIncident = async (id: string) => {
    try {
      setUpdatingIncidentId(id)
      const response = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      })
 
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to resolve incident")
      }
 
      toast.success("Incident marked as resolved!")
      setMyIncidents(prev =>
        prev.map(inc => inc.id === id ? { ...inc, status: "resolved" } : inc)
      )
      setRefreshTrigger(prev => prev + 1)
      window.dispatchEvent(new CustomEvent("resilientph_refresh_incidents"))
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setUpdatingIncidentId(null)
    }
  }
 
  const handleWithdrawIncident = async (id: string) => {
    const confirmWithdraw = window.confirm("Are you sure you want to withdraw this incident report? This will remove it permanently.")
    if (!confirmWithdraw) return
 
    try {
      setUpdatingIncidentId(id)
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE"
      })
 
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to withdraw report")
      }
 
      toast.success("Incident report withdrawn successfully!")
      setMyIncidents(prev => prev.filter(inc => inc.id !== id))
      setRefreshTrigger(prev => prev + 1)
      window.dispatchEvent(new CustomEvent("resilientph_refresh_incidents"))
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setUpdatingIncidentId(null)
    }
  }
 
  // Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      return localStorage.getItem("resilientph_incident_notifications") !== "false"
    } catch {
      return true
    }
  })

  const [anonymousReporting, setAnonymousReporting] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("resilientph_anonymous_reporting") === "true"
    } catch {
      return false
    }
  })

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    try {
      localStorage.setItem("resilientph_incident_notifications", enabled ? "true" : "false")
    } catch (err) {
      console.warn("Failed to set notification preference in localStorage:", err)
    }
    if (enabled && "Notification" in window) {
      Notification.requestPermission()
    }
  }

  const handleToggleAnonymous = (enabled: boolean) => {
    setAnonymousReporting(enabled)
    try {
      localStorage.setItem("resilientph_anonymous_reporting", enabled ? "true" : "false")
    } catch (err) {
      console.warn("Failed to set anonymous reporting preference in localStorage:", err)
    }
  }


  // Form submit handlers with custom validations before hook triggers
  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUsername = username.trim()
    const errors: typeof profileErrors = {}

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!cleanUsername) {
      errors.username = "Username is required."
    } else if (!usernameRegex.test(cleanUsername)) {
      errors.username = "Username must be 3-20 characters and contain only letters, numbers, and underscores."
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      document.getElementById("username")?.focus()
      return
    }

    setProfileErrors({})
    await handleUpdateProfile()
  }

  const onSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: typeof passwordErrors = {}

    if (!password) {
      errors.password = "New password is required."
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long."
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password."
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match."
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      if (errors.password) {
        document.getElementById("password")?.focus()
      } else {
        document.getElementById("confirmPassword")?.focus()
      }
      return
    }

    setPasswordErrors({})
    const success = await handleUpdatePassword()
    if (success) {
      setPassword("")
      setConfirmPassword("")
    }
  }

  // Get readable role badge colors
  const roleBadge = useMemo(() => {
    switch (role) {
      case "admin":
        return { label: "Admin", variant: "destructive" as const }
      case "responder":
        return { label: "Responder", variant: "secondary" as const }
      default:
        return { label: "Citizen", variant: "outline" as const }
    }
  }, [role])

  // --- Predefined UI Cards to avoid markup duplication ---
  
  // 1. Profile Summary Card
  const profileSummaryCard = (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
      <CardHeader className="text-center pb-6 border-b border-border/20">
        <div className="mx-auto size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
          <User className="size-8 text-primary" />
        </div>
        <CardTitle className="text-lg font-semibold text-foreground tracking-tight">
          {user ? (profile?.display_name || user?.user_metadata?.username || "Citizen") : "Guest Citizen"}
        </CardTitle>
        <CardDescription className="text-xs font-mono text-muted-foreground/75 mt-0.5 truncate select-all">
          {user ? `@${profile?.username || "user"}` : "Unauthenticated Session"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Access Role:</span>
          <Badge variant={user ? roleBadge.variant : "outline"} className="font-mono text-[10px] tracking-wide uppercase px-2 py-0.5">
            {user ? roleBadge.label : "Guest"}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Email Status:</span>
          {user ? (
            <span className="text-xs text-success font-medium flex items-center gap-1">
              <Shield className="size-3" /> Verified
            </span>
          ) : (
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Not Signed In
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Guest Authentication Notice Card
  const guestAuthNoticeCard = (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
          <User className="size-6 text-primary" />
        </div>
        <CardTitle className="text-base font-semibold text-foreground">Sign In to Manage Profile</CardTitle>
        <CardDescription className="text-xs text-muted-foreground max-w-md mx-auto pt-1 leading-relaxed">
          You are currently browsing ResilientPH as a guest. All public hazard maps, weather forecasts, and emergency hotlines are fully accessible. To customize your display name, update credentials, and manage incident reports, please sign in.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center gap-3 pt-4 pb-6">
        <Button asChild size="sm" className="rounded-full px-5 cursor-pointer">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full px-5 cursor-pointer">
          <Link href="/signup">Create Account</Link>
        </Button>
      </CardFooter>
    </Card>
  )

  // 2. Preferences Card
  const preferencesCard = (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
      <CardHeader className="pb-4 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">Preferences</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">Community Alerts</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive browser push notifications for real-time hazard reports within 10km of your location.
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            aria-label="Toggle community alerts"
          />
        </div>

        <div className="flex items-start justify-between gap-4 pt-3 border-t border-border/10">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Ghost className="size-3.5" />
              Anonymous Reporting
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Submit incident reports without linking your identity. Useful for privacy, but we won&apos;t be able to contact you.
            </p>
          </div>
          <Switch
            checked={anonymousReporting}
            onCheckedChange={handleToggleAnonymous}
            aria-label="Toggle anonymous reporting"
          />
        </div>
      </CardContent>
    </Card>
  )

  // 3. Profile Information Card Form
  const profileInfoCard = (
    <form onSubmit={onSaveProfile}>
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Profile Information</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your public display identity used for assistant interactions and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field>
            <FieldLabel htmlFor="display-name" className="text-xs uppercase tracking-wider text-muted-foreground/80 font-mono">
              Display Name
            </FieldLabel>
            <div className="relative">
              <Input
                id="display-name"
                name="displayName"
                type="text"
                placeholder="e.g. Juan dela Cruz"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 bg-background/40 border-primary/10 focus-visible:border-primary/30 transition-all font-sans"
                disabled={savingProfile}
              />
            </div>
            <FieldDescription>
              Your display name or alias.
            </FieldDescription>
          </Field>

          <Field data-invalid={!!profileErrors.username}>
            <FieldLabel htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground/80 font-mono">
              Username
            </FieldLabel>
            <div className="relative">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="e.g. juan_dc"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (profileErrors.username) {
                    setProfileErrors((prev) => ({ ...prev, username: undefined }))
                  }
                }}
                className="h-10 bg-background/40 border-primary/10 focus-visible:border-primary/30 transition-all font-sans"
                disabled={savingProfile}
                required
                spellCheck={false}
              />
            </div>
            <FieldDescription>
              Unique identifier. Standard rules: 3-20 characters, lowercase letters, numbers, and underscores.
            </FieldDescription>
            {profileErrors.username && <FieldError errors={[{ message: profileErrors.username }]} />}
          </Field>

          <Field>
            <FieldLabel htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground/60 font-mono select-none">
              Email Address
            </FieldLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground/40">
                <Mail className="size-4" aria-hidden="true" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                className="pl-10 h-10 bg-muted/20 border-border/20 text-muted-foreground cursor-not-allowed select-none font-sans"
                disabled
              />
            </div>
            <FieldDescription>
              To update your registered email address, please contact support.
            </FieldDescription>
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={savingProfile}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-full shadow-md transition-all px-6"
          >
            {savingProfile ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-3" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="size-4" /> Save Changes
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )

  // 4. Change Password Card Form
  const changePasswordCard = (
    <form onSubmit={onSavePassword}>
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Change Password</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Ensure your account remains secure by maintaining a strong, custom passphrase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field data-invalid={!!passwordErrors.password}>
            <FieldLabel htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground/80 font-mono">
              New Password
            </FieldLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                <Key className="size-4" aria-hidden="true" />
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordErrors.password) {
                    setPasswordErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                className="pl-10 pr-10 h-10 bg-background/40 border-primary/10 focus-visible:border-primary/30 transition-all font-sans"
                disabled={savingPassword}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 text-muted-foreground/50 hover:text-foreground hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-lg"
                disabled={savingPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <FieldDescription>
              Minimum of 6 characters required.
            </FieldDescription>
            {passwordErrors.password && <FieldError errors={[{ message: passwordErrors.password }]} />}
          </Field>

          <Field data-invalid={!!passwordErrors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground/80 font-mono">
              Confirm New Password
            </FieldLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                <Key className="size-4" aria-hidden="true" />
              </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
                className="pl-10 pr-10 h-10 bg-background/40 border-primary/10 focus-visible:border-primary/30 transition-all font-sans"
                disabled={savingPassword}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 text-muted-foreground/50 hover:text-foreground hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-lg"
                disabled={savingPassword}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {passwordErrors.confirmPassword && <FieldError errors={[{ message: passwordErrors.confirmPassword }]} />}
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={savingPassword}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-full shadow-md transition-all px-6"
          >
            {savingPassword ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-3" /> Changing...
              </span>
            ) : (
              <span>Update Password</span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )

  // 5. My Submitted Reports Card
  const mySubmittedReportsCard = (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">My Submitted Reports</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Track, resolve, or withdraw the hazard and outage reports you have submitted to the community.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingIncidents ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-xs font-mono">
            <Loader2 className="size-4 animate-spin mr-2 text-primary" />
            Loading history...
          </div>
        ) : myIncidents.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            You haven&apos;t submitted any incident reports yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myIncidents.map((incident) => {
              const categoryLabel = incident.category.replace("_", " ").toUpperCase()
              const typeLabel = incident.sub_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())

              return (
                <div
                  key={incident.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-border/10 bg-muted/10 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/30 font-semibold uppercase tracking-wider font-mono">
                        {categoryLabel}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[9px] px-1.5 py-0 rounded border font-mono font-semibold uppercase tracking-wider",
                          incident.status === "active" || incident.status === "monitoring"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-success/10 text-success border-success/20"
                        )}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold text-foreground">
                      {typeLabel}
                    </h4>
                    {incident.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {incident.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      {new Date(incident.reported_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {incident.status !== "resolved" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={updatingIncidentId !== null}
                        onClick={() => handleResolveIncident(incident.id)}
                        className="h-8 px-3 rounded-lg border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 text-[10px] font-semibold cursor-pointer"
                      >
                        Resolve
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={updatingIncidentId !== null}
                      onClick={() => handleWithdrawIncident(incident.id)}
                      className="h-8 px-3 rounded-lg border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive-400 text-[10px] font-semibold cursor-pointer"
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background">
        <PortalHeader title="Profile Settings" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto pb-10">
      <PortalHeader title="Profile Settings" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 font-sans">
        <ErrorBoundary>
          
          {/* 1. Desktop Layout (Split-pane Sidebar Grid) */}
          <div className="hidden lg:block">
            <Tabs defaultValue="details" orientation="vertical" className="flex flex-row gap-10 w-full">
              
              {/* Left Sidebar */}
              <div className="w-72 shrink-0 flex flex-col gap-6">
                {profileSummaryCard}
                
                <TabsList className="flex flex-col h-auto w-full bg-transparent border-none p-0 space-y-1.5 items-stretch justify-start">
                  <TabsTrigger 
                    value="details" 
                    className="justify-start px-4 py-3 text-sm font-medium rounded-xl border border-transparent data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:border-border/50 data-[state=active]:shadow-sm hover:bg-muted/40 cursor-pointer transition-all"
                  >
                    Personal Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="justify-start px-4 py-3 text-sm font-medium rounded-xl border border-transparent data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:border-border/50 data-[state=active]:shadow-sm hover:bg-muted/40 cursor-pointer transition-all"
                  >
                    Password & Security
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reports" 
                    className="justify-start px-4 py-3 text-sm font-medium rounded-xl border border-transparent data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:border-border/50 data-[state=active]:shadow-sm hover:bg-muted/40 cursor-pointer transition-all"
                  >
                    Report History
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preferences" 
                    className="justify-start px-4 py-3 text-sm font-medium rounded-xl border border-transparent data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:border-border/50 data-[state=active]:shadow-sm hover:bg-muted/40 cursor-pointer transition-all"
                  >
                    System Preferences
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Right Content Pane */}
              <div className="flex-1 max-w-2xl min-w-0">
                <TabsContent value="details" className="mt-0 space-y-6 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                  {user ? profileInfoCard : guestAuthNoticeCard}
                </TabsContent>
                <TabsContent value="security" className="mt-0 space-y-6 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                  {user ? changePasswordCard : guestAuthNoticeCard}
                </TabsContent>
                <TabsContent value="reports" className="mt-0 space-y-6 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                  {user ? mySubmittedReportsCard : guestAuthNoticeCard}
                </TabsContent>
                <TabsContent value="preferences" className="mt-0 space-y-6 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                  {preferencesCard}
                </TabsContent>
              </div>
              
            </Tabs>
          </div>

          {/* 2. Mobile View Layout (Tabs System to prevent infinite scroll) */}
          <div className="block lg:hidden space-y-6">
            
            {profileSummaryCard}

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-11 bg-muted/20 border border-border/10 rounded-xl p-1 mb-6">
                <TabsTrigger value="details" className="text-[11px] font-medium py-2 rounded-lg cursor-pointer">Info</TabsTrigger>
                <TabsTrigger value="security" className="text-[11px] font-medium py-2 rounded-lg cursor-pointer">Security</TabsTrigger>
                <TabsTrigger value="reports" className="text-[11px] font-medium py-2 rounded-lg cursor-pointer">Reports</TabsTrigger>
                <TabsTrigger value="preferences" className="text-[11px] font-medium py-2 rounded-lg cursor-pointer">Prefs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 outline-none">
                {user ? profileInfoCard : guestAuthNoticeCard}
              </TabsContent>
              <TabsContent value="security" className="space-y-4 outline-none">
                {user ? changePasswordCard : guestAuthNoticeCard}
              </TabsContent>
              <TabsContent value="reports" className="space-y-4 outline-none">
                {user ? mySubmittedReportsCard : guestAuthNoticeCard}
              </TabsContent>
              <TabsContent value="preferences" className="space-y-4 outline-none">
                {preferencesCard}
              </TabsContent>
            </Tabs>

          </div>

        </ErrorBoundary>
      </main>
    </div>
  )
}
