"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import {
  Phone,
  Copy,
  Check,
  ExternalLink,
  Info,
  Flame,
  HeartPulse,
  AlertTriangle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortalHeader } from "@/components/ui/portal-header"
import { toast } from "sonner"

import { EMERGENCY_CONTACTS } from "@/lib/emergency/contacts"

export default function EmergencyPageClient() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyNumber = async (numVal: string, label: string) => {
    // Strip non-numeric tokens for clean dialer numbers
    const cleanNum = numVal.replace(/[^\d+]/g, "")
    try {
      await navigator.clipboard.writeText(cleanNum)
      setCopiedId(numVal)
      toast.success(`Copied number for ${label}`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Clipboard API failed:", err)
      toast.error(`Could not auto-copy. Please manually dial: ${cleanNum}`)
    }
  }

  // Map category code to human description badge
  const renderCategoryBadge = (category: "alert" | "responder" | "public") => {
    if (category === "alert") {
      return (
        <Badge variant="outline" className="text-[10px] font-sans font-semibold tracking-wider border-warning/25 bg-warning/5 text-warning py-0.5 px-1.5 h-fit select-none">
          <AlertTriangle className="size-2.5 mr-1 shrink-0" /> ALERT
        </Badge>
      )
    }
    if (category === "responder") {
      return (
        <Badge variant="outline" className="text-[10px] font-sans font-semibold tracking-wider border-destructive/25 bg-destructive/5 text-destructive py-0.5 px-1.5 h-fit select-none">
          <Flame className="size-2.5 mr-1 shrink-0" /> RESPONDER
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] font-sans font-semibold tracking-wider border-success/25 bg-success/5 text-success py-0.5 px-1.5 h-fit select-none">
        <HeartPulse className="size-2.5 mr-1 shrink-0" /> PUBLIC
      </Badge>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground pb-6 selection:bg-primary/25 font-sans">
      <PortalHeader title="Emergency Hotlines" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6" id="main-content">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full"
          >
            {/* Unified Single Card Directory List */}
            <Card className="w-full bg-background rounded-2xl border-none ring-0 shadow-none overflow-hidden divide-y divide-border/20">
              {EMERGENCY_CONTACTS.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 gap-4 hover:bg-muted/5 transition-all duration-200"
                >
                  {/* Left side: Acronym, Name, Category badge, and Official link */}
                  <div className="flex flex-col gap-1 md:w-1/3 min-w-0 select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold font-sans tracking-tight text-foreground leading-none">
                        {contact.acronym}
                      </h3>
                      {renderCategoryBadge(contact.category)}
                      {contact.website && (
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5 shrink-0"
                          title="Visit official website"
                          aria-label={`Visit official website of ${contact.acronym}`}
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium leading-normal">
                      {contact.name}
                    </span>
                  </div>

                  {/* Middle: Description (visible on desktop) */}
                  <div className="hidden lg:block flex-1 text-sm text-muted-foreground/90 pr-4 leading-relaxed">
                    {contact.description}
                  </div>

                  {/* Right side: Numbers list directory */}
                  <div className="flex flex-col gap-1.5 shrink-0 w-full md:w-64">
                    {contact.numbers.map((number, idx) => (
                      <div
                        key={`${number.value}-${idx}`}
                        className="flex flex-row items-center justify-between text-xs font-sans py-1 px-2.5 bg-muted/20 border border-border/10 rounded-lg gap-2 hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-muted-foreground font-sans truncate text-[10px] uppercase font-semibold">
                          {number.label}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-foreground font-bold tabular-nums tracking-wide">
                            {number.value}
                          </span>
                          {/* Call action link */}
                          <a
                            href={`tel:${number.value.replace(/[^\d+]/g, "")}`}
                            className="p-1 text-primary hover:bg-primary/10 rounded-lg shrink-0 transition-colors cursor-pointer"
                            title={`Call ${number.label}`}
                            aria-label={`Call ${number.label} at ${number.value}`}
                          >
                            <Phone className="size-3.5" />
                          </a>
                          {/* Copy action button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleCopyNumber(number.value, contact.acronym)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0 transition-colors cursor-pointer"
                            title="Copy number"
                            aria-label={`Copy ${number.label} number to clipboard`}
                          >
                            {copiedId === number.value ? (
                              <Check className="size-3.5 text-success" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>

          {/* Footer Guide checklist */}
          <Card className="mt-8 p-5 bg-background border-none rounded-2xl flex flex-col md:flex-row gap-4 items-start select-none ring-0 shadow-none">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Info className="size-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold tracking-tight text-foreground font-sans flex items-center gap-1">
                Emergency Calling Guidelines
              </h4>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                When making emergency calls: (1) State your exact location clearly, (2) Specify the emergency type (fire, medical, security), (3) Remain on the line until responders confirm details. For mobile devices, local carrier networks allow dialing 911 or 143 even with zero regular loads.
              </p>
            </div>
          </Card>
        </main>
    </div>
  )
}
