"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { motion } from "motion/react"
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

function triggerShaderPulse(intensity = 0.8) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("resilientph:auth-shockwave", {
        detail: { intensity, x: 0.5, y: 0.5 },
      })
    )
  }
}

export default function SignupPageClient() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string }>({})

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    triggerShaderPulse(1.5)

    const cleanUsername = username.trim()
    const cleanEmail = email.trim()
    const newErrors: typeof errors = {}

    // Username validation: 3-20 characters, alphanumeric & underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!cleanUsername) {
      newErrors.username = "Username is required."
    } else if (!usernameRegex.test(cleanUsername)) {
      newErrors.username = "Username must be 3-20 characters and contain only letters, numbers, and underscores (_)."
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanEmail) {
      newErrors.email = "Email is required."
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = "Please enter a valid email address."
    }

    // Password validation: minimum 6 characters
    if (!password) {
      newErrors.password = "Password is required."
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long."
    }

    // Matching password check
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required."
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Focus first error field for accessibility
      if (newErrors.username) {
        document.getElementById("username")?.focus()
      } else if (newErrors.email) {
        document.getElementById("email")?.focus()
      } else if (newErrors.password) {
        document.getElementById("password")?.focus()
      } else if (newErrors.confirmPassword) {
        document.getElementById("confirmPassword")?.focus()
      }
      return
    }

    setErrors({})
    setLoading(true)

    try {
      // Sign up the user with real email, password, and pass username metadata
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      })

      if (signUpError) {
        toast.error(signUpError.message)
        setLoading(false)
        return
      }

      toast.success("Account created successfully!")

      // Try to automatically sign in after sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) {
        // If auto sign-in fails (e.g. if email confirmation is required), guide the user
        toast.info("Registration complete! Check your inbox to confirm your email, then sign in.")
        router.push("/login")
        return
      }

      toast.success("Logging you in…")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  // Motion animation configs
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" }
    }
  } as const

  return (
    <motion.div
      className="w-full px-2 sm:px-0"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      {/* Return to Home link */}
      <div className="mb-4 flex justify-start">
        <Link
          id="back-to-home-link"
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-sans font-medium transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full space-y-5">
        <div className="text-left select-none space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Create Account
          </h2>
          <p className="text-xs text-muted-foreground">
            Register to join the Philippines resilience network
          </p>
        </div>

        <form onSubmit={handleSignup} id="signup-auth-form" noValidate className="space-y-3.5">
          <div className="space-y-3.5">
            <Field data-disabled={loading} data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username" className="text-xs font-sans font-medium text-foreground/90">
                Username
              </FieldLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter a username…"
                  value={username}
                  onFocus={() => triggerShaderPulse(0.5)}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    triggerShaderPulse(0.3)
                    if (errors.username) {
                      setErrors((prev) => ({ ...prev, username: undefined }))
                    }
                  }}
                  className="pl-10 h-10 bg-background/50 border-border focus-visible:border-foreground/30 transition-all font-sans text-sm rounded-xl"
                  disabled={loading}
                  required
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>
              {errors.username && <FieldError errors={[{ message: errors.username }]} />}
            </Field>

            <Field data-disabled={loading} data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email" className="text-xs font-sans font-medium text-foreground/90">
                Email Address
              </FieldLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address…"
                  value={email}
                  onFocus={() => triggerShaderPulse(0.5)}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    triggerShaderPulse(0.3)
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  }}
                  className="pl-10 h-10 bg-background/50 border-border focus-visible:border-foreground/30 transition-all font-sans text-sm rounded-xl"
                  disabled={loading}
                  required
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>
              {errors.email && <FieldError errors={[{ message: errors.email }]} />}
            </Field>

            <Field data-disabled={loading} data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password" className="text-xs font-sans font-medium text-foreground/90">
                Password
              </FieldLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters…"
                  value={password}
                  onFocus={() => triggerShaderPulse(0.5)}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    triggerShaderPulse(0.3)
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }))
                    }
                  }}
                  className="pl-10 pr-10 h-10 bg-background/50 border-border focus-visible:border-foreground/30 transition-all font-sans text-sm rounded-xl"
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
                <Button
                  id="toggle-signup-password"
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowPassword(!showPassword)
                    triggerShaderPulse(0.6)
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors cursor-pointer rounded-lg"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </Button>
              </div>
              {errors.password && <FieldError errors={[{ message: errors.password }]} />}
            </Field>

            <Field data-disabled={loading} data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword" className="text-xs font-sans font-medium text-foreground/90">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password…"
                  value={confirmPassword}
                  onFocus={() => triggerShaderPulse(0.5)}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    triggerShaderPulse(0.3)
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    }
                  }}
                  className="pl-10 pr-10 h-10 bg-background/50 border-border focus-visible:border-foreground/30 transition-all font-sans text-sm rounded-xl"
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
                <Button
                  id="toggle-signup-confirm-password"
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword)
                    triggerShaderPulse(0.6)
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors cursor-pointer rounded-lg"
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </Button>
              </div>
              {errors.confirmPassword && <FieldError errors={[{ message: errors.confirmPassword }]} />}
            </Field>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              id="signup-submit-btn"
              type="submit"
              className="w-full h-10 font-sans font-medium text-xs tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer rounded-full shadow-xs"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="size-4" />
                  Creating…
                </>
              ) : (
                <>
                  Register
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground font-sans">
              Already have an account?{" "}
              <Link
                id="login-redirect-link"
                href="/login"
                className="font-medium text-foreground hover:underline underline-offset-4 cursor-pointer transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
