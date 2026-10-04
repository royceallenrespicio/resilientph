---
name: resilientph-development-workflow
description: Enforce codebase modularity, strict reuse of components/ui primitives, correct folder placement (hooks, lib, components), naming conventions, error handling patterns, and clean code modification practices. Triggers on any task creating or editing components, pages, hooks, utilities, or database integrations.
license: MIT
metadata:
  author: resilientph-team
  version: "2.0.0"
---

# ResilientPH Development Workflow & Architecture

This skill defines strict codebase organization rules, modularity practices, naming conventions, and reuse patterns for **resilientph**. Follow these rules without exception.

---

## 🎨 1. UI Component Reuse (`components/ui`)

### The Rule: Check `components/ui` First!
You must **NEVER** write a custom primitive element (buttons, cards, dialogs, inputs, sheets, dropdowns, calendars, etc.) from scratch using raw divs/inputs. 58 premium components are pre-configured in `components/ui/`.

*   **Actionable Step:** Before writing any interactive UI element or card, run a search/list of `components/ui/` to locate the corresponding component.
*   **Theme Integration:** Rely exclusively on Tailwind v4 CSS theme tokens defined in `globals.css` (e.g., `bg-background`, `text-foreground`, `bg-card`, `text-primary`, `border-border`) rather than hardcoding hex colors or raw oklch.

### Core Primitives Quick Reference (but check the entire folder):
- Button: `components/ui/button.tsx`
- Dialog / Modal: `components/ui/dialog.tsx`
- Input fields: `components/ui/input.tsx`
- Textarea: `components/ui/textarea.tsx`
- Sliders: `components/ui/slider.tsx`
- Sheet / Drawer: `components/ui/sheet.tsx` or `components/ui/drawer.tsx`
- Loading Spinner: `components/ui/spinner.tsx`
- Checkbox / Switch: `components/ui/checkbox.tsx` or `components/ui/switch.tsx`
- Popovers / Tooltips: `components/ui/popover.tsx` or `components/ui/tooltip.tsx`
- Badge: `components/ui/badge.tsx`
- Error Boundary: `components/ui/error-boundary.tsx`
- Portal Layout Shell: `components/ui/PortalProviders.tsx`
- Portal Header: `components/ui/portal-header.tsx`

---

## 📂 2. Code Modularity & Folder Conventions

Do **NOT** dump React code or custom business logic inside the Next.js `app/` router directory. The `app/` directory is reserved for routing, layouts, and page entrypoints.

### Folder Mapping Rules:

| Type of Code | Proper Destination | Incorrect Placement (DO NOT DO) |
|---|---|---|
| **Route/Page entrypoints** | `app/<route>/page.tsx` (thin: metadata + single component import) | Business logic in `page.tsx` |
| **Page-Specific Components** | `components/<domain>/` (e.g. `components/chat/`, `components/map/`, `components/home/`, `components/pagasa/`, `components/emergency/`, `components/auth/`) | Inside `app/<route>/` or flat `components/` |
| **Reusable UI Primitives** | `components/ui/` | Custom elements inside feature folders |
| **Shared Layout Shells** | `components/ui/` (e.g. `PortalProviders.tsx`) | In a specific domain folder |
| **Custom Hooks** | `hooks/<domain>/` (e.g. `hooks/chat/`, `hooks/map/`, `hooks/home/`) | In the same file as a component, inside `app/`, or inside `components/` |
| **Pure Data Configs / Styles** | `lib/<domain>/` (e.g. `lib/map/layer-styles.ts`) | Inside `components/` |
| **API / Global Utils / Clients** | `lib/` (e.g. `lib/weather/meteo.ts`, `lib/supabase/`, `lib/api/`) | Inside `hooks/` or inside component files |

---

## 📝 3. Naming Conventions

Consistent naming makes the codebase navigable without opening files.

### Components (`components/<domain>/`)
- **Casing:** PascalCase `.tsx`
- **Pattern:** `<Domain><Purpose>.tsx` — e.g., `HomePageClient.tsx`, `MapViewport.tsx`, `ChatSidebar.tsx`
- **Page clients:** Always suffix with `PageClient` — e.g., `HomePageClient.tsx`, `ChatPageClient.tsx`
- **Sub-components:** Prefix with parent concept — e.g., `WeatherOutlookTab.tsx` (child of `HomeWeatherForecast.tsx`)

### UI Primitives (`components/ui/`)
- **Casing:** kebab-case `.tsx`
- **Pattern:** `<element-name>.tsx` — e.g., `button.tsx`, `error-boundary.tsx`, `portal-header.tsx`

### Hooks (`hooks/<domain>/`)
- **Casing:** kebab-case `.ts`
- **Pattern:** `use-<noun-or-verb>.ts` — e.g., `use-hazard-feeds.ts`, `use-map-boundaries.ts`
- **Never** use PascalCase or camelCase for hook files.

### Lib Utilities (`lib/`)
- **Casing:** kebab-case `.ts`
- **Pattern:** `<descriptive-name>.ts` — e.g., `rate-limit.ts`, `layer-styles.ts`, `spatial.ts`

### SQL Migrations
- **Pattern:** `YYYYMMDDHHMMSS_<descriptive_name>.sql`
- **Example:** `20260624160000_tighten_community_report_policies.sql`

---

## 🛡️ 4. Error Handling & Resilience Patterns

Production-ready code requires proper error handling at every layer:

1. **Error Boundaries:** Wrap high-risk interactive widgets (map, weather, chat) with `<ErrorBoundary>` from `components/ui/error-boundary.tsx`. A global boundary exists in `app/layout.tsx`.
2. **API Error Handling:** Use the shared `handleApiError()` helper from `lib/api/errors.ts` in all API routes for consistent JSON error responses.
3. **Rate Limiting:** API routes that accept user input must use the rate limiter from `lib/api/rate-limit.ts`. Default: 10 req/hr for anon, 60 req/hr for authenticated.
4. **Fetch Cleanup:** All `useEffect` hooks that make fetch calls must use `AbortController` and clean up on unmount:
   ```typescript
   useEffect(() => {
     const controller = new AbortController();
     fetch(url, { signal: controller.signal }).then(/* ... */);
     return () => controller.abort();
   }, [deps]);
   ```
5. **localStorage:** Always wrap in `try/catch`. Use versioned keys with `resilientph_` prefix:
   ```typescript
   const STORAGE_KEY = "resilientph_preferred_location_v1";
   ```

---

## 🎨 5. Design Rules

1. **Icons:** Use Lucide React (`lucide-react`) exclusively. Never use emoji characters (⚡🧹) in rendered UI.
2. **Images:** Use `next/image` for all images. Use `unoptimized` prop for dynamic/external URLs not in `remotePatterns`.
3. **Animations:** Use Framer Motion (`motion/react`) for component animations. Use React 19 `<ViewTransition>` for route transitions.
4. **Typography:** Geist (sans-serif) as primary font, Geist Mono for code/data.
5. **Accessibility:** All form inputs must have labels (use `sr-only` for visually hidden). Interactive elements need `aria-label` when text is not self-descriptive.

---

## 🛡️ 6. Safe Modifications & Clean Code Practices

1. **No Dead Code:** Do not declare variables, imports, or functions that are never used. If refactoring, clean up the unused portions.
2. **Preserve Existing Logic:** Always read the target file completely before modifying it. Do not break existing state variables, theme settings, or helper utility integrations.
3. **Run Lints & Tests:** After making modifications, verify syntax and correctness by running `pnpm lint` and `pnpm build`.
4. **File Size Limit:** If a component file exceeds ~300 lines, decompose it into focused sub-components in the same domain folder.

---

## 🛡️ 7. Work Strategy & Execution Rules

To maintain the architectural integrity of **resilientph**, every agent must follow this execution strategy:

1. **Mandatory Planning**: Run search and viewing tools first to thoroughly understand the task. Build an implementation plan in the workspace artifact directory and wait for user approval before modifying files.
2. **Thorough Objective Execution**: Complete every aspect of the objectives. Avoid skeletal files, dummy endpoints, or mock variables. Verify edge cases.
3. **No Breaking Changes**: Code changes must not break existing interfaces, databases, APIs, or components. If any compatibility risk is found, you MUST alert the user immediately.
4. **Clean Code & No Dead Code**: Do not leave unused imports, variables, arguments, or obsolete files. Run `pnpm lint` and `pnpm build` to verify correctness.
5. **Verify File Placement**: After creating any new file, verify it follows the naming conventions and folder mapping rules in Sections 2 and 3.
