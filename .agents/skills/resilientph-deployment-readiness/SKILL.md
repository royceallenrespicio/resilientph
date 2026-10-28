---
name: resilientph-deployment-readiness
description: Deployment hardening and production go-live gates for ResilientPH (env validation, security checks, scraper safety, release checklist, and rollback readiness).
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Deployment Readiness

Use this skill for any deployment, pre-release audit, or production hardening task.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Preparing Vercel/production release | Yes | Enforces release gates and rollback plan |
| Changing env vars/secrets | Yes | Validates required/optional runtime config |
| Fixing TLS/cert bypass in scraper/runtime code | Yes | Prevents insecure production behavior |
| Pure UI copy/style tweak with no release activity | No | Use workflow/UI skills only |

## Workflow

1. Identify runtime targets (local, preview, production) and required secrets.
2. Validate environment contract and create/update `.env.example`.
3. Run readiness gates (`pnpm lint`, `pnpm build`) and check critical routes/APIs.
4. Audit security-sensitive release blockers (TLS bypass, service-role exposure, debug leakage).
5. Produce go/no-go decision with explicit blockers and rollback steps.

## Guardrails

- Never deploy with `NODE_TLS_REJECT_UNAUTHORIZED = "0"` active for production code paths.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-facing code.
- Never rely on undocumented env vars; keep a checked-in env template.
- Do not mark release-ready if build/lint gates fail.

## Implementation Assets

### Required Env Contract (minimum)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL` (defaults to `gemini-3.1-flash-lite`), `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CARTO_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Acceptance Checklist

- [ ] Node.js runtime meets baseline (`>=24.0.0` LTS).
- [ ] `.env.example` exists and documents required/optional keys.
- [ ] No insecure TLS bypass in production paths.
- [ ] Server-only secrets are not referenced in client bundles.
- [ ] `pnpm lint` and `pnpm build` pass.
- [ ] Rollback steps are documented (previous deployment or config revert path).

## Do Not Use When

- The task is only DB schema/query optimization (use `supabase` + `supabase-postgres-best-practices`).
- The task is only component architecture cleanup (use `resilientph-development-workflow`).
