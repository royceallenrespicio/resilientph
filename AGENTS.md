# Agent Instructions & Project Guidelines

Welcome! This file provides essential context, architectural rules, and coding standards for AI agents working on **resilientph**.

This workspace contains specialized agent skills under **.agents/skills/**. Refer to these resources when working on specific domains:
- [LangChain RAG Skill](.agents/skills/langchain-rag/SKILL.md) for building retrieval-augmented generation (RAG) systems with document loaders, splitters, embeddings, and vector stores.
- [Supabase Skill](.agents/skills/supabase/SKILL.md) for database schemas, migrations, or auth flows.
- [Postgres Best Practices Skill](.agents/skills/supabase-postgres-best-practices/SKILL.md) for database query and index optimization.
- [UI/UX Pro Max Skill](.agents/skills/ui-ux-pro-max/SKILL.md) for design templates, visual styles, color palettes, and interface layouts.
- [Vercel Composition Patterns Skill](.agents/skills/vercel-composition-patterns/SKILL.md) for scalable React composition patterns, compound components, and React 19 API changes.
- [Vercel React Best Practices Skill](.agents/skills/vercel-react-best-practices/SKILL.md) for React/Next.js performance optimization, eliminating waterfalls, and bundle size reduction.
- [Vercel React View Transitions Skill](.agents/skills/vercel-react-view-transitions/SKILL.md) for smooth page and element transition animations using React 19 View Transitions.
- [Web Design Guidelines Skill](.agents/skills/web-design-guidelines/SKILL.md) for Web Interface Guidelines compliance, accessibility, and design audits.
- [ResilientPH Development Workflow Skill](.agents/skills/resilientph-development-workflow/SKILL.md) for project-specific rules regarding UI primitive reuse, domain folders, naming conventions, and clean code practices.
- [ResilientPH Deployment Readiness Skill](.agents/skills/resilientph-deployment-readiness/SKILL.md) for release gates, env contract checks, production hardening, and rollback readiness.
- [ResilientPH Hazard Data Ingestion Skill](.agents/skills/resilientph-hazard-data-ingestion/SKILL.md) for PAGASA/PHIVOLCS/GDACS parsing, normalization, retries, caching, and freshness policy.
- [ResilientPH Incident Moderation Skill](.agents/skills/resilientph-incident-moderation/SKILL.md) for community report validation, abuse controls, confidence scoring, and reviewer workflow.
- [ResilientPH Alerting and Notifications Skill](.agents/skills/resilientph-alerting-and-notifications/SKILL.md) for subscriptions, dedupe, severity routing, throttling, and delivery tracking.
- [ResilientPH Map UX and Geospatial Skill](.agents/skills/resilientph-map-ux-and-geospatial/SKILL.md) for map layer conventions, clustering strategy, interaction accessibility, and mobile map behavior.
- [ResilientPH Security and RLS Skill](.agents/skills/resilientph-security-and-rls/SKILL.md) for auth boundaries, Supabase RLS governance, service-role constraints, and secret handling.
- [ResilientPH Observability and SLO Skill](.agents/skills/resilientph-observability-slo/SKILL.md) for telemetry standards, SLO/error-budget policy, alert quality, and operational runbooks.

---

## 🧭 Skill Dispatch Priority (When Skills Overlap)

Use this precedence to avoid conflicting guidance:

1. **Security first:** `resilientph-security-and-rls` (plus `supabase` when Supabase-specific).
2. **Domain operation second:** choose one primary domain skill:
   - ingestion → `resilientph-hazard-data-ingestion`
   - moderation → `resilientph-incident-moderation`
   - notifications → `resilientph-alerting-and-notifications`
   - map/geospatial → `resilientph-map-ux-and-geospatial`
   - production release → `resilientph-deployment-readiness`
   - reliability/SLO → `resilientph-observability-slo`
3. **Architecture enforcement always-on:** `resilientph-development-workflow`.
4. **Performance/UI overlays as needed:** Vercel/UI/Web-design skills.

When multiple skills apply, assign one **primary** skill and treat others as constraints/overlays.

---

## ⚡ Skill Selection Quick Guide

| If you are working on... | Primary Skill |
|---|---|
| Production go-live, env validation, rollout risk | `resilientph-deployment-readiness` |
| Feed parser behavior, cache TTL, stale hazard data | `resilientph-hazard-data-ingestion` |
| User-submitted report trust, spam/abuse filtering | `resilientph-incident-moderation` |
| Alert subscriptions, dedupe, notification routing | `resilientph-alerting-and-notifications` |
| Map layers, clustering, viewport performance, map a11y | `resilientph-map-ux-and-geospatial` |
| RLS policies, auth trust boundary, secret exposure | `resilientph-security-and-rls` |
| Logs/metrics, SLOs, incident alerting quality | `resilientph-observability-slo` |

---

## 🚀 Quick Reference & Commands

- **Package Manager:** `pnpm` (use `pnpm` exclusively, do not use `npm` or `yarn`)
- **Development Server:** `pnpm dev`
- **Production Build:** `pnpm build`
- **Linting:** `pnpm lint`
- **Path Alias:** `@/*` points to the root directory `./*`

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript.
- **Styling:** Tailwind CSS v4, Base UI, Radix UI, and shadcn/ui.
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- **AI & LLM:** LangChain (`@langchain/core`, `@langchain/google`, `@langchain/groq`).
- **Mapping:** Leaflet (`leaflet`, `@types/leaflet`), raster tile themes (CartoDB Dark Matter, Positron, OSM, Esri Satellite, OpenTopoMap).
- **Weather API:** Open-Meteo integration via `lib/weather/meteo.ts`.
- **Animations:** Framer Motion (`motion/react`) for micro-interactions; React 19 `<ViewTransition>` for route transitions.
- **Icons:** Lucide React — do not use emoji characters in UI.

---

## 📂 Codebase Architecture

```
.
├── .agents/                     # Workspace agent skills
├── app/                         # Next.js App Router — thin route entrypoints only
│   ├── (auth)/                  # Auth flow pages (login, signup, callback)
│   ├── (portal)/                # Portal route group (shared layout with sidebar)
│   │   ├── chat/                # AI chat page
│   │   ├── emergency/           # Emergency hotlines page
│   │   ├── map/                 # Interactive hazard map page
│   │   ├── pagasa/              # PAGASA embedded weather portal page
│   │   ├── profile/             # Profile & user settings page
│   │   ├── layout.tsx           # Server Component layout → delegates to PortalProviders
│   │   └── page.tsx             # Homepage entrypoint
│   ├── actions/                 # Server actions (scrape-actions.ts)
│   ├── api/                     # API route handlers
│   │   ├── auth/                # Auth API endpoints (confirm, callback)
│   │   ├── chat/                # AI chat endpoint (rate-limited)
│   │   ├── gdacs/               # GDACS disaster feed endpoint
│   │   ├── moderate/            # Incident moderation endpoint
│   │   ├── pagasa/              # PAGASA scraper endpoints (daily weather, typhoon)
│   │   ├── phivolcs/            # PHIVOLCS earthquake scraper endpoint
│   │   └── reports/             # Community incident reports endpoint
│   ├── globals.css              # Tailwind v4 + shadcn/ui theme tokens
│   ├── transitions.css          # ViewTransition animation keyframes
│   ├── layout.tsx               # Root layout (fonts, metadata, ErrorBoundary)
│   ├── manifest.ts              # PWA web manifest
│   ├── robots.ts                # Robots.txt generation
│   └── sitemap.ts               # Sitemap generation
│
├── components/                  # UI components organized by domain
│   ├── auth/                    # Sign-in and Sign-up form components
│   ├── chat/                    # Chat components (ChatArea, ChatInput, ChatSidebar, etc.)
│   ├── emergency/               # Emergency page components
│   ├── home/                    # Homepage widgets (weather, quake, GDACS, marquee)
│   ├── map/                     # Map components (MapViewport, MapSidebar, FilterDrawer, etc.)
│   ├── pagasa/                  # PAGASA portal components (radar, feed panel, info dialog)
│   ├── profile/                 # Profile page components (ProfilePageClient)
│   └── ui/                      # Reusable shadcn/ui primitives (58 components)
│       └── PortalProviders.tsx   # Shared portal layout shell (providers + sidebar)
│
├── hooks/                       # Custom React hooks organized by domain
│   ├── chat/                    # use-chat-sessions
│   ├── home/                    # use-hazard-feeds, use-local-weather
│   ├── map/                     # use-map-boundaries, use-map-earthquakes, use-map-interaction, etc.
│   ├── profile/                 # use-profile
│   └── use-breakpoints.ts       # Shared responsive breakpoints hook
│
├── lib/                         # Shared utilities, configurations & API clients
│   ├── api/                     # Shared API utilities (errors.ts, rate-limit.ts)
│   ├── chat/                    # LangChain config (prompt, tools, storage, api)
│   │   └── tools/               # AI tool definitions (weather, earthquakes, etc.)
│   ├── emergency/               # Emergency contacts data, GDACS client
│   ├── home/                    # Home dashboard configuration and types
│   ├── map/                     # Geospatial utils (spatial.ts, usgs.ts, layer-styles.ts)
│   ├── scraper/                 # Server-side web scrapers
│   │   ├── cache/               # Scraper response cache files
│   │   └── pagasa/              # PAGASA-specific scrapers
│   ├── supabase/                # Supabase client/server helpers & type definitions
│   ├── upstash/                 # Upstash Redis client configuration
│   ├── weather/                 # Open-Meteo API configuration (meteo.ts)
│   ├── constants.ts             # App-wide constants
│   └── utils.ts                 # cn() utility (clsx + tailwind-merge)
│
└── supabase/
    └── migrations/              # Chronological SQL migration files (YYYYMMDDHHMMSS_name.sql)
```

---

## 📂 Code Modularization & Organization Guidelines

To keep the codebase clean, highly readable, scalable, and modularized:

1. **No Code Dumping**: Do NOT dump all logic/UI into a single massive file. Keep files small, focused, single-purpose, and easy to read. If a component exceeds ~300 lines, decompose it into sub-components.
2. **Domain-Specific Folders**: Place components, hooks, and lib utilities in their corresponding domain folder:
   - `chat/`: Chat-specific UI, message handlers, or chat hooks.
   - `home/`: Homepage layout components, landing page features, or home hooks.
   - `map/`: Interactive map controls, overlays, search logic, or mapping hooks.
   - `pagasa/`: PAGASA portal wrapping components or widgets.
   - `emergency/`: Emergency hotline UI and data.
   - `auth/`: Authentication screens, logins, and signup forms.
   - `profile/`: User profile management, account settings, and hooks.
   - `ui/`: Reusable, generic UI primitives (e.g. Buttons, Dialogs, Inputs) and shared layout shells.
3. **Future Domain Extensions**: If you introduce a new feature area or page (e.g., dashboard, settings, alerts), you must create a corresponding folder under both `components/` and `hooks/` (if hooks are required). Do not mix unrelated domains in existing folders.
4. **Configuration & Utilities (`lib/`)**: Place all global configuration files, API client definitions (like Open-Meteo or USGS), non-hook helper functions, layer style configs, schema validations, and integrations inside the `lib/` directory. Do not store these configs/helpers inside component or hook folders.
5. **Thin Route Pages**: Files in `app/` must only serve as thin entry points — metadata export + a single client component import. All business logic and UI lives in `components/`.

---

## 📝 Naming Conventions

Consistent naming makes the codebase navigable without opening files:

| Layer | Casing | Pattern | Examples |
|---|---|---|---|
| **Components** (`components/<domain>/`) | PascalCase `.tsx` | `<Domain><Purpose>.tsx` | `HomePageClient.tsx`, `MapViewport.tsx`, `ChatSidebar.tsx` |
| **Page clients** | PascalCase `.tsx` | `<Domain>PageClient.tsx` | `HomePageClient.tsx`, `ChatPageClient.tsx`, `MapPageClient.tsx` |
| **Sub-components** | PascalCase `.tsx` | `<Parent><Part>.tsx` | `WeatherOverviewTab.tsx` (child of `HomeWeatherForecast`) |
| **UI primitives** (`components/ui/`) | kebab-case `.tsx` | `<element-name>.tsx` | `button.tsx`, `error-boundary.tsx`, `portal-header.tsx` |
| **Hooks** (`hooks/<domain>/`) | kebab-case `.ts` | `use-<noun/verb>.ts` | `use-hazard-feeds.ts`, `use-breakpoints.ts` |
| **Lib utilities** (`lib/`) | kebab-case `.ts` | `<descriptive-name>.ts` | `rate-limit.ts`, `layer-styles.ts`, `spatial.ts` |
| **SQL migrations** | timestamp prefix | `YYYYMMDDHHMMSS_<description>.sql` | `20260624160000_tighten_community_report_policies.sql` |

---

## 🎨 Design & Aesthetic Guidelines

All user interfaces must look premium, modern, and visually engaging. Follow these rules:
1. **Curated Color Palette:** Do not use generic CSS colors. Rely on theme tokens defined in `globals.css` (e.g., `bg-background`, `text-foreground`, `bg-card`, `text-primary`). The site default is dark-themed.
2. **Typography & Layout:** Use Geist (primary sans-serif) and Geist Mono (monospace). Ensure structured, clean layouts. Avoid cramped elements.
3. **Animations:** Use Framer Motion (`motion/react`) for micro-interactions (hover, slide-in). Use React 19 `<ViewTransition>` for route transitions. Transition CSS lives in `transitions.css`.
4. **Icons:** Use Lucide React (`lucide-react`) exclusively. Never use emoji characters in rendered UI.
5. **Images:** Use `next/image` for all images. Use `unoptimized` prop for dynamic/external URLs that aren't in `remotePatterns`.
6. **No Placeholders:** Avoid creating empty page views, broken images, or skeleton templates. Write fully functioning, robust implementations.

---

## 🔒 Supabase Integration Guidelines

To maintain database security and correct server-client boundaries:
- **Client Components (`"use client"`):** Use the browser-based client from `lib/supabase/client.ts`.
  ```typescript
  import { createClient } from '@/lib/supabase/client';
  const supabase = createClient();
  ```
- **Server Components / API Routes / Server Actions:** Use the server-based client from `lib/supabase/server.ts`.
  ```typescript
  import { createClient } from '@/lib/supabase/server';
  const supabase = await createClient();
  ```
- **Auth Validation:** When validating authentication status in Next.js Server Components, Server Actions, or Middlewares, **ALWAYS** call `supabase.auth.getUser()` instead of `getSession()`. `getSession()` reads from the cookie store directly and can be spoofed, whereas `getUser()` validates the token on the Supabase auth server.
- **Client Memoization:** In client components that create a Supabase client, wrap it in `useMemo(() => createClient(), [])` to prevent re-instantiation on every render.
- **Database Migrations:** Write all schema definitions, table creations, Row Level Security (RLS) policies, triggers, and migrations in `supabase/migrations/` as SQL scripts. Do not perform ad-hoc DB mutations. Always include `IF NOT EXISTS` guards and explicit `DROP POLICY IF EXISTS` before `CREATE POLICY`.

---

## 🛠 UI Components (Shadcn / Base UI)

Before writing any custom button, popover, checkbox, or tooltip, verify if it already exists under `components/ui/`.
- 58 components are pre-configured in `components/ui/` (e.g. `button.tsx`, `dialog.tsx`, `sheet.tsx`, `scroll-area.tsx`, `sonner.tsx`, `error-boundary.tsx`, `portal-header.tsx`, etc.).
- Use these pre-built components to maintain consistency and premium design standards.
- **Theme & Preset Integration:** Always follow the preconfigured Tailwind v4 + Shadcn/ui theme configuration defined in `globals.css`. Rely exclusively on theme tokens (e.g., `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-primary`) rather than hardcoding hex or raw oklch colors. This ensures light/dark mode compatibility and unified aesthetics.
- **Portal Layout Shell:** The shared portal layout (sidebar, providers, error boundary) lives in `components/ui/PortalProviders.tsx`. The server-side layout at `app/(portal)/layout.tsx` delegates to it, enabling child pages to export `metadata`.

---

## 🛡️ Error Handling & Resilience

Production-ready code requires proper error handling at every layer:
- **Error Boundaries:** Wrap high-risk interactive widgets (map, weather, chat) with `<ErrorBoundary>` from `components/ui/error-boundary.tsx`. A global boundary exists in `app/layout.tsx`.
- **API Error Handling:** Use the shared `handleApiError()` helper from `lib/api/errors.ts` in all API routes for consistent JSON error responses.
- **Rate Limiting:** API routes that accept user input (e.g., `/api/chat`) must use the rate limiter from `lib/api/rate-limit.ts`. Default: 10 req/hr for anonymous users, 60 req/hr for authenticated users.
- **Fetch Cleanup:** All `useEffect` hooks that make fetch calls must use `AbortController` and clean up on unmount to prevent memory leaks and race conditions.
- **localStorage:** Always wrap `localStorage` access in `try/catch` blocks. Use versioned keys with the `resilientph_` prefix (e.g., `resilientph_preferred_weather_location_v1`).

---

## 🤖 AI Safety, Domain Guardrails & Token Efficiency

To protect application integrity, user safety, and LLM budget:
1. **Strict Domain Boundaries**: The AI Assistant must never generate, execute, or explain arbitrary programming code (Python, JS, Shell, etc.), nor participate in off-topic tasks (essays, roleplay, jailbreaks).
2. **Anti-Jailbreak Policy**: All system prompts must instruct the model to politely reject prompt injections (e.g., "ignore previous instructions", "act as DAN", or system prompt leakage attempts) and redirect back to Philippine weather and disaster preparedness.
3. **Sliding Window Context**: API routes must limit conversational history sent to the LLM to the most recent 10 messages (5 turns) to prevent runaway token accumulation.
4. **Response Caching**: Single-turn and repeated hazard queries must utilize a 5-minute cache (Upstash Redis with in-memory fallback) to ensure low latency and high token efficiency while keeping disaster bulletins fresh.

---

## 📋 Agent Workflow: Planning, Safety, and Completion Rules

To ensure high-quality software engineering and prevent system regressions, follow these workspace rules on every task:

1. **Plan Before Executing (Mandatory Planning)**:
   - Always analyze requirements, audit existing files, and document an implementation plan *before* editing source code or executing commands.
   - Outline all proposed files, function changes, and dependencies in the plan and wait for explicit user approval.
2. **Exhaustive & Thorough Completion**:
   - Deliver complete, fully-functional features. Do not use placeholders, simulated functions, or leave tasks half-done.
   - Verify that all objectives described in the prompt and plan are addressed down to the smallest requirement.
3. **Zero Breaking Changes & Regression Safety**:
   - Maintain regression safety at all times. All database schemas, routes, and hooks must be backward-compatible.
   - If a breaking change is absolutely required, you **MUST** pause immediately and alert the user with a warning before continuing.
4. **Strict Code Modularity & Folder Architecture**:
   - Follow the designated folder structures: Route files in `app/` must only serve as thin entry points.
   - Place client components in domain folders under `components/`, hooks in `hooks/`, and configuration utilities in `lib/`.
   - Hooks must never live in `components/`. Pure data configs must never live in `components/`.
5. **Clean Code Conventions & No Dead Code**:
   - Zero tolerance for dead code. Clean up unused imports, obsolete variables, parameters, and commented-out code blocks immediately.
   - Run linter checks (`pnpm lint`) and build validation (`pnpm build`) to verify codebase health before wrapping up.
6. **Accessibility**:
   - All form inputs must have associated labels (use `sr-only` for visually hidden labels).
   - Interactive elements must have `aria-label` attributes when text content is not self-descriptive.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
