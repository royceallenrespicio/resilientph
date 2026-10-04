import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/home/navigation/BottomNav";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SITE_URL } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    template: "%s | ResilientPH",
    default: "ResilientPH | Philippine Disaster Preparedness & Weather Portal",
  },
  description: "Real-time weather tracking, geological hazard monitoring, active disaster alerts, and AI-assisted emergency preparedness planning for the Philippines.",
  applicationName: "ResilientPH",
  keywords: [
    "Philippines",
    "disaster preparedness",
    "weather tracking",
    "PAGASA weather",
    "earthquake tracker",
    "geological portal",
    "typhoon alert",
    "emergency hotline",
    "family go bag checklist",
    "AI response assistant"
  ],
  authors: [{ name: "ResilientPH Team" }],
  creator: "ResilientPH Team",
  publisher: "ResilientPH Team",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: SITE_URL,
    title: "ResilientPH | Philippine Disaster Preparedness & Weather Portal",
    description: "Real-time weather tracking, geological hazard monitoring, active disaster alerts, and AI-assisted emergency preparedness planning for the Philippines.",
    siteName: "ResilientPH",
    images: [
      {
        url: "/google-gemini-icon.svg",
        width: 512,
        height: 512,
        alt: "ResilientPH Brand Icon",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ResilientPH | Philippine Disaster Preparedness & Weather Portal",
    description: "Real-time weather tracking, geological hazard monitoring, active disaster alerts, and AI-assisted emergency preparedness planning for the Philippines.",
    images: ["/google-gemini-icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", instrumentSans.variable, geistMono.variable, GeistPixelSquare.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined')return;window.addEventListener('unhandledrejection',function(e){var r=e&&(e.reason||e),m=(r&&(r.message||r))+'';if((r&&r.name==='InvalidStateError')||m.indexOf('Transition was aborted')!==-1||m.indexOf('Document hidden')!==-1){e.preventDefault();}});if(typeof document!=='undefined'&&'startViewTransition' in document){var orig=document.startViewTransition.bind(document);document.startViewTransition=function(cb){if(document.visibilityState==='hidden'){var u=typeof cb==='function'?cb:(cb&&cb.update);if(u){try{var res=u();if(res&&typeof res.then==='function')res.catch(function(){});}catch(err){}}return{ready:Promise.resolve(),finished:Promise.resolve(),updateCallbackDone:Promise.resolve(),skipTransition:function(){},types:new Set()};}try{var t=orig(cb);if(t&&t.finished)t.finished.catch(function(err){if(err&&(err.name==='InvalidStateError'||(err.message&&(err.message.indexOf('Document hidden')!==-1||err.message.indexOf('Transition was aborted')!==-1))))return;throw err;});if(t&&t.ready)t.ready.catch(function(err){if(err&&(err.name==='InvalidStateError'||(err.message&&(err.message.indexOf('Document hidden')!==-1||err.message.indexOf('Transition was aborted')!==-1))))return;throw err;});return t;}catch(err){if(err&&(err.name==='InvalidStateError'||(err.message&&(err.message.indexOf('Document hidden')!==-1||err.message.indexOf('Transition was aborted')!==-1)))){var u2=typeof cb==='function'?cb:(cb&&cb.update);if(u2){try{u2();}catch(e){}}return{ready:Promise.resolve(),finished:Promise.resolve(),updateCallbackDone:Promise.resolve(),skipTransition:function(){},types:new Set()};}throw err;}}}})();`
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <BottomNav />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
