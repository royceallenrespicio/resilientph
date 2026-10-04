import React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { TyphoonTabContent } from "./TyphoonTabContent"
import { PagasaTcInfo, TyphoonBulletin } from "@/lib/home/types"

interface TyphoonDialogProps {
  bulletinOpen: boolean
  setBulletinOpen: (open: boolean) => void
  tcInfo?: PagasaTcInfo | null
  typhoon?: TyphoonBulletin[] | null
  onAnalyze: (prompt: string) => void
}

export function TyphoonDialog({
  bulletinOpen,
  setBulletinOpen,
  tcInfo,
  typhoon,
  onAnalyze,
}: TyphoonDialogProps) {
  return (
    <Dialog open={bulletinOpen} onOpenChange={setBulletinOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          className="w-full sm:w-auto shrink-0 font-semibold cursor-pointer text-xs"
        >
          View Typhoon Bulletin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl bg-background text-foreground border-border/40 font-sans p-6 rounded-2xl">
        <DialogHeader className="pb-4 select-none border-b border-border/10">
          <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
            <AlertTriangle className="size-5 animate-pulse" />
            Tropical Cyclone Bulletin Detail
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 mt-4">
          <div className="py-2">
            <ErrorBoundary>
              <TyphoonTabContent
                tcInfo={tcInfo}
                typhoon={typhoon}
                onAnalyze={(prompt) => {
                  setBulletinOpen(false) // Close the dialog before triggering navigation or drawer
                  onAnalyze(prompt)
                }}
              />
            </ErrorBoundary>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
