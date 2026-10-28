# ResilientPH

Open-source disaster-preparedness web app for the Philippines.

The Philippines faces around 20 typhoons a year, plus frequent earthquakes and volcanic activity. Official hazard information is spread across separate agency sites in inconsistent formats. ResilientPH normalizes these sources and presents them in one fast, mobile-friendly interface.

> Status: early-stage, in active development.

## Features

- **Live hazard data** from PAGASA (weather and typhoons), PHIVOLCS (earthquakes and volcanoes) and GDACS, with caching and freshness handling.
- **Interactive map** built on Leaflet with hazard layers.
- **Community incident reports** with validation and moderation.
- **AI assistant** (LangChain + Gemini) restricted to Philippine weather and disaster safety, with prompt-injection and off-topic guardrails.
- **Emergency resources** for quick access during a crisis.
- **Authentication** via Supabase, with row-level security on all data.
- **Rate limiting** on user-input routes (Upstash Redis with in-memory fallback).

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Base UI, Radix UI, Framer Motion, Supabase, LangChain, Leaflet, Open-Meteo, Upstash Redis.

## Getting Started

Requirements: Node.js 24.22.1+ (LTS) or 26.12.1+ and [pnpm](https://pnpm.io).

```bash
git clone https://github.com/royceallenrespicio/resilientph.git
cd resilientph
pnpm install
cp .env.example .env.local   # then fill in your values
pnpm dev
```

Open http://localhost:3000.

### Environment variables

See [`.env.example`](.env.example) for the full list and deployment notes.

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Yes | AI assistant |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Privileged server and cron operations only |
| `NEXT_PUBLIC_SITE_URL` | Optional | Custom domains |
| `CRON_SECRET` | Optional | Protects privileged force-refreshes |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional | Persistent rate limiting |
| `NEXT_PUBLIC_CARTO_API_KEY` | Optional | CARTO basemaps |

Never commit `.env.local` or expose the service-role key to the client.

### Database

SQL migrations live in `supabase/migrations/` and are idempotent. Apply them to your Supabase project before running the app.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |

## Project Structure

```
app/          Route entrypoints and API route handlers
components/   Feature UI by domain, plus shared primitives in ui/
hooks/        Custom React hooks by domain
lib/          API clients, scrapers, spatial math, Supabase helpers
supabase/     SQL migrations
```

## Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for setup steps, development guidelines, and PR workflows, and review our [Code of Conduct](CODE_OF_CONDUCT.md). For architectural details and coding conventions, see [`AGENTS.md`](AGENTS.md).

## Data Sources and Disclaimer

Hazard data is sourced from PAGASA, PHIVOLCS, GDACS and Open-Meteo. ResilientPH is an independent project and is **not affiliated with any government agency**. For official warnings and evacuation orders, always follow your local government and national agencies.

## License

[MIT](LICENSE.md) © 2026 Royce Allen Respicio
