---
name: resilientph-hazard-data-ingestion
description: Standards for ingesting and normalizing hazard feeds (PAGASA, PHIVOLCS, GDACS) including schema mapping, retries, caching, freshness windows, and failure handling.
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Hazard Data Ingestion

Use this skill whenever hazard-source parsing, normalization, freshness, or cache strategy is involved.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Adding/editing PAGASA/PHIVOLCS/GDACS scrapers | Yes | Ensures consistent normalization and reliability |
| Changing hazard feed API routes | Yes | Keeps response shape/freshness contracts stable |
| Investigating stale/incomplete hazard data | Yes | Applies freshness and fallback policies |
| Pure UI styling of already-available data | No | Use UI/workflow skills |

## Workflow

1. Define source contract (fields, timestamps, update cadence, known quirks).
2. Map source fields to canonical app schema in `lib/*` utilities.
3. Add resilience controls: timeout, bounded retries, and deterministic fallback.
4. Enforce freshness windows and cache invalidation policy.
5. Validate response consistency at API boundary (`app/api/*`).

## Guardrails

- Do not leak source-specific raw fields directly to frontend when canonical fields exist.
- Do not swallow ingestion errors silently; expose explicit error metadata.
- Do not allow unbounded retries or indefinite stale caches.
- Prefer UTC/ISO timestamps for canonical storage and responses.

## Implementation Assets

### Canonical Hazard Record (guideline)

- `id` (stable source+event identifier)
- `source` (`pagasa` | `phivolcs` | `gdacs`)
- `hazardType`
- `severity`
- `location` (name + optional lat/lng)
- `occurredAt` / `updatedAt` (ISO 8601)
- `status` (`active` | `resolved` | `unknown`)
- `rawUrl` (traceability)

### Acceptance Checklist

- [ ] Canonical mapping documented and implemented.
- [ ] Source parser has timeout + retry + deterministic fallback.
- [ ] Cache TTL and stale-data policy are explicit.
- [ ] API response shape remains consistent across sources.
- [ ] Errors include actionable context (source + failure reason).

## Do Not Use When

- Work is primarily RLS/auth security policy (use `resilientph-security-and-rls` / `supabase`).
- Work is primarily notification routing (use `resilientph-alerting-and-notifications`).
