import { AuthIllustration } from "@/components/auth/AuthIllustration"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col justify-between overflow-x-hidden p-6 sm:p-8 lg:p-12">
      {/* Brand Header - Top Left */}
      <div className="relative z-50 flex flex-col items-start text-left select-none">
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-foreground font-heading">
          RESILIENTPH
        </h1>
        <p className="mt-0.5 text-[10px] tracking-widest uppercase text-muted-foreground/80 font-mono">
          [ SYSTEM ACCESS PORTAL ]
        </p>
      </div>

      {/* 2-Column Layout for Desktop */}
      <div className="relative z-10 w-full max-w-7xl mx-auto my-auto py-6 lg:py-0 lg:grid lg:grid-cols-12 lg:gap-16 xl:gap-24 lg:items-center">
        {/* Left Column: Interactive WebGPU Philippine Halftone Map (Desktop Only) */}
        <div className="hidden lg:flex col-span-7 w-full h-[580px] xl:h-[640px] items-center justify-start pr-6 xl:pr-12">
          <AuthIllustration />
        </div>

        {/* Right Column: Auth Form */}
        <div className="col-span-5 flex flex-col justify-center w-full max-w-md ml-auto">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
