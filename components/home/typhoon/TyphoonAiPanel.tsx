"use client"

import React from "react"
import { BrainCircuit, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Intents } from "@/lib/chat/prompts"

interface TyphoonAiPanelProps {
  stormName: string
  onAnalyze: (prompt: string) => void
}

export function TyphoonAiPanel({ stormName, onAnalyze }: TyphoonAiPanelProps) {
  const handleAnalyze = () => {
    onAnalyze(Intents.getTyphoonAnalysis(stormName))
  }

  return (
    <Card className="w-full border-none ring-0 bg-background shadow-none rounded-2xl flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary shrink-0" aria-hidden="true" />
          <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase font-sans">
            AI Cyclone Analysis
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-5 flex flex-col gap-4 flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Get an AI-powered assessment of{" "}
          <span className="font-semibold text-foreground">{stormName}</span>
          {" "}covering storm intensity, wind signal areas, at-risk regions, and recommended safety actions for residents across the Philippines.
        </p>

        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-muted/20 border border-border/10">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-primary/70 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-foreground/80 mb-1">What the AI will analyze:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- Current storm intensity and classification</li>
                <li>- Wind signal levels by region</li>
                <li>- Projected path and affected areas</li>
                <li>- Safety precautions and evacuation guidance</li>
                <li>- Historical context and comparable events</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Button
            type="button"
            onClick={handleAnalyze}
            className="w-full gap-2 cursor-pointer"
            size="sm"
            aria-label={`Analyze typhoon ${stormName} with AI`}
          >
            <BrainCircuit className="size-3.5 shrink-0" aria-hidden="true" />
            <span>Analyze with AI</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
