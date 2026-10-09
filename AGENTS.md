# Agent Instructions & Project Guidelines

Essential architectural rules, coding standards, and skill dispatch for **resilientph**.

---

## 🧭 Skills & Dispatch Matrix

Workspace skills live under `.agents/skills/`. When skills overlap, follow this precedence:
1. **Security first:** `resilientph-security-and-rls` (plus `supabase` for DB/Auth).
2. **Domain operation second:** select exactly one primary domain skill.
3. **Architecture always-on:** `resilientph-development-workflow`.
4. **Performance & UI overlays:** `vercel-react-best-practices`, `bryl-minimal-design`.

| Skill | Focus / Domain | When to Invoke |
|---|---|---|
| [resilientph-security-and-rls](.agents/skills/resilientph-security-and-rls/SKILL.md) | Auth boundaries, Supabase RLS, service-role keys | RLS policies, auth trust boundaries, secret handling |
| [resilientph-hazard-data-ingestion](.agents/skills/resilientph-hazard-data-ingestion/SKILL.md) | PAGASA/PHIVOLCS/GDACS scraping & normalization | Feed parsers, cache TTL, freshness policies, scraper retries |
| [resilientph-incident-moderation](.agents/skills/resilientph-incident-moderation/SKILL.md) | Community report validation & safety checks | User reports, abuse filters, severity estimation, reviewer flow |
| [resilientph-alerting-and-notifications](.agents/skills/resilientph-alerting-and-notifications/SKILL.md) | Push & toast alerts, priority routing, deduplication | Subscriptions, dedupe, routing, notification throttling |
| [resilientph-map-ux-and-geospatial](.agents/skills/resilientph-map-ux-and-geospatial/SKILL.md) | Leaflet layers, bounding boxes, ray-casting, clusters | Map layers, clustering, spatial queries, mobile map UX |
| [resilientph-deployment-readiness](.agents/skills/resilientph-deployment-readiness/SKILL.md) | Production release gates & environment contracts | Production go-live, env validation, rollout risk, rollback |
| [resilientph-observability-slo](.agents/skills/resilientph-observability-slo/SKILL.md) | Telemetry, SLOs, error budgets, runbooks | Logs, metrics, error budgets, alert quality, operational runbooks |
| [resilientph-development-workflow](.agents/skills/resilientph-development-workflow/SKILL.md) | Clean architecture, modularity, folder rules | Creating or editing components, hooks, lib utils, migrations |
| [bryl-minimal-design](.agents/skills/bryl-minimal-design/SKILL.md) | Project design system (monochrome, halftone, typography) | UI styling, components, cards, layouts, visual restyling |
| [supabase](.agents/skills/supabase/SKILL.md) | Database schemas, migrations, SSR auth clients | DB schemas, migrations, security audits, Postgres extensions |
| [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/SKILL.md) | React 19 & Next.js performance optimization | Eliminating waterfalls, bundle reduction, component optimization |

---

## 🚀 Quick Reference & Tech Stack

- **Commands:** `pnpm dev` (server), `pnpm build` (build), `pnpm lint` (linter). Use `pnpm` exclusively.
- **Path Alias:** `@/*` maps to `./*`.
- **Core:** Next.js 16 (App Router), React 19, TypeScript.
- **Styling & UI:** Tailwind CSS v4, Base UI, Radix UI, shadcn/ui (58 primitives in `components/ui/`), Framer Motion (`motion/react`), Lucide React (no emoji in UI).
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- **AI & Integrations:** LangChain (`@langchain/core`, `@langchain/google`), Leaflet, Open-Meteo (`lib/weather/meteo.ts`), Upstash Redis.

---

## 📂 Architecture & Folder Boundaries

Keep files focused (<300 lines). Decompose large components. Follow strict separation:

| Directory | Responsibility | Constraint |
|---|---|---|
| `app/` | Thin route entrypoints (`layout.tsx`, `page.tsx`) | Metadata export + single client component import only. No business logic. |
| `app/(portal)/` | Portal route group with shared sidebar shell | Delegates layout to `components/ui/PortalProviders.tsx`. |
| `app/api/` | Route handlers (rate-limited, structured JSON) | Always wrap with `handleApiError()`. User-input routes use `checkRateLimit()`. |
| `components/<domain>/` | Feature UI (`auth`, `chat`, `emergency`, `home`, `map`, `pagasa`, `profile`) | Pure UI and view logic. Never define custom hooks here. |
| `components/ui/` | Reusable primitives & shared shells | Generic primitives only. Check here before creating new buttons/dialogs. |
| `hooks/<domain>/` | Custom React hooks (`chat`, `home`, `map`, `profile`) | Domain state and effects. Must never live inside `components/`. |
| `lib/<domain>/` | API clients, configs, spatial math, scrapers | Pure non-hook utilities, layer styles, schemas, constants. |
| `supabase/migrations/` | Chronological SQL migration files | Always idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`). |

### Naming Conventions

| Layer | Casing | Pattern | Examples |
|---|---|---|---|
| Components | PascalCase `.tsx` | `<Domain><Purpose>.tsx` | `HomePageClient.tsx`, `MapViewport.tsx` |
| Page clients | PascalCase `.tsx` | `<Domain>PageClient.tsx` | `HomePageClient.tsx`, `ChatPageClient.tsx` |
| Sub-components | PascalCase `.tsx` | `<Parent><Part>.tsx` | `WeatherOverviewTab.tsx` |
| UI primitives | kebab-case `.tsx` | `<element-name>.tsx` | `button.tsx`, `portal-header.tsx` |
| Hooks | kebab-case `.ts` | `use-<noun/verb>.ts` | `use-hazard-feeds.ts`, `use-breakpoints.ts` |
| Lib utilities | kebab-case `.ts` | `<descriptive-name>.ts` | `rate-limit.ts`, `spatial.ts` |
| Migrations | Timestamp prefix | `YYYYMMDDHHMMSS_<name>.sql` | `20260624160000_tighten_community_report_policies.sql` |

---

## 🎨 Design & UI Standards

1. **Theme Tokens Only:** Never hardcode hex/oklch colors. Use theme tokens in `globals.css` (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-primary`). Default is dark-themed.
2. **Typography:** Geist (primary sans), Geist Mono (code), Geist Pixel (headings).
3. **Animations:** Framer Motion (`motion/react`) for micro-interactions; React 19 `<ViewTransition>` (`transitions.css`) for route transitions.
4. **Images:** `next/image` with `unoptimized` for dynamic external URLs. No broken/placeholder images.
5. **No Emojis in UI:** Use Lucide React icons exclusively.

---

## 🔒 Supabase & Auth Rules

- **Client Components (`"use client"`):** Import from `lib/supabase/client.ts`. Memoize: `useMemo(() => createClient(), [])`.
- **Server Components / Routes / Actions:** Import from `lib/supabase/server.ts`: `const supabase = await createClient()`.
- **Admin Client:** `createAdminClient()` from `lib/supabase/server.ts` requires `SUPABASE_SERVICE_ROLE_KEY`. Use only for privileged background/cron operations.
- **Auth Validation:** **ALWAYS** call `supabase.auth.getUser()`. **NEVER** use `getSession()` (cookie-spoofable).
- **Database Migrations:** Schema changes belong in `supabase/migrations/` as SQL. Never perform ad-hoc DB mutations. Always guard with `IF NOT EXISTS` and `DROP POLICY IF EXISTS`.

---

## 🛡️ Error Handling, Resilience & AI Guardrails

- **Error Boundaries:** Wrap high-risk interactive widgets (map, weather, chat) with `<ErrorBoundary>` from `components/ui/error-boundary.tsx`.
- **API Errors:** Use `handleApiError()` from `lib/api/errors.ts` for uniform error responses.
- **Rate Limiting:** Protect user-input routes (`/api/chat`, `/api/reports`) with `checkRateLimit()` from `lib/api/rate-limit.ts` (10 req/hr anon, 60 req/hr auth).
- **Fetch Cleanup:** All `useEffect` fetch calls must use `AbortController` and abort on unmount.
- **localStorage:** Always wrap in `try/catch`. Use versioned keys prefixed with `resilientph_`.
- **AI Domain Boundaries:** Reject code execution, programming assistance, roleplay, and prompt injections. Redirect to Philippine weather and disaster safety.
- **AI Token Ceiling:** Cap conversational history to a 10-message (5-turn) sliding window. Cache single-turn hazard queries for 5 minutes (Upstash Redis + memory fallback).

---

## 📋 Agent Workflow & Quality Rules

1. **Plan Before Executing:** Analyze requirements and document an implementation plan before editing code or running state-changing commands. Wait for user approval.
2. **Zero Breaking Changes:** Keep database schemas, APIs, and hooks backward-compatible.
3. **Zero Dead Code:** Remove unused imports, obsolete variables, and commented-out code immediately. Validate with `pnpm lint` and `pnpm build`.
4. **Accessibility:** Form inputs must have labels (`sr-only` if visually hidden). Icon-only buttons must have `aria-label`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
