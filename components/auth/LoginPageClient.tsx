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
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react"
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

export default function LoginPageClient() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    triggerShaderPulse(1.5)

    const cleanEmail = email.trim()
    const newErrors: typeof errors = {}

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanEmail) {
      newErrors.email = "Email is required."
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = "Please enter a valid email address."
    }

    if (!password) {
      newErrors.password = "Password is required."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Focus first error field for accessibility
      if (newErrors.email) {
        document.getElementById("email")?.focus()
      } else if (newErrors.password) {
        document.getElementById("password")?.focus()
      }
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        let message = error.message
        if (message.includes("Invalid login credentials")) {
          message = "Invalid email or password. Please try again."
          setErrors({
            email: "Invalid email or password.",
            password: "Invalid email or password."
          })
          document.getElementById("email")?.focus()
        } else {
          toast.error(message)
        }
        setLoading(false)
        return
      }

      toast.success("Login successful! Redirecting…")

      // Redirect to homepage or map
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

      <div className="w-full space-y-6">
        <div className="text-left select-none space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Sign In
          </h2>
          <p className="text-xs text-muted-foreground">
            Access your disaster response and mapping portal
          </p>
        </div>

        <form onSubmit={handleLogin} id="login-auth-form" noValidate className="space-y-4">
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
                className="pl-10 h-10 bg-muted/20 border-border focus-visible:border-foreground/30 transition-all font-sans text-sm rounded-xl"
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
                placeholder="Enter your password…"
                value={password}
                onFocus={() => triggerShaderPulse(0.5)}
                onChange={(e) => {
                  setPassword(e.target.value)
                  triggerShaderPulse(0.3)
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                className="pl-10 pr-10 h-10 bg-muted/20 border-border focus-visible:border-foreground/30 transition-all font-sans text-sm rounded-xl"
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <Button
                id="toggle-password-visibility"
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

          <div className="flex flex-col gap-4 pt-2">
            <Button
              id="login-submit-btn"
              type="submit"
              className="w-full h-10 font-sans font-medium text-xs tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer rounded-full shadow-xs"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="size-4" />
                  Verifying…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground font-sans">
              Don&apos;t have an account?{" "}
              <Link
                id="create-account-link"
                href="/signup"
                className="font-medium text-foreground hover:underline underline-offset-4 cursor-pointer transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
