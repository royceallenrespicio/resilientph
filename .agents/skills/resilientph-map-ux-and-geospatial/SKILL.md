---
name: resilientph-map-ux-and-geospatial
description: Geospatial and map UX standards for ResilientPH: layer strategy, clustering, viewport performance, interaction accessibility, and mobile map behavior.
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Map UX and Geospatial

Use this skill for map-heavy tasks involving data layers, interactions, rendering performance, and accessibility.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Editing map layers/styles/filters | Yes | Enforces consistent geospatial semantics |
| Tuning map performance on low-end/mobile devices | Yes | Applies clustering and viewport constraints |
| Building map interaction controls (drawer, focus, legends) | Yes | Preserves usability and accessibility |
| Backend-only auth/RLS change | No | Use security/supabase skills |

## Workflow

1. Define layer taxonomy (base, hazard overlays, user reports, reference boundaries).
2. Apply scale-aware rendering (cluster/aggregate at broader zooms).
3. Keep interactions predictable (selection model, filter state, reset behavior).
4. Validate keyboard/screen-reader path for non-pointer users.
5. Measure viewport updates for responsiveness during pan/zoom/filter operations.

## Guardrails

- Do not render dense point layers unclustered at country-wide zooms.
- Do not make map-only controls inaccessible by keyboard.
- Avoid heavy recomputation on every viewport tick; memoize derived data.
- Preserve visual hierarchy between critical hazards and secondary overlays.

## Implementation Assets

### Geospatial UX Baseline

- Cluster thresholds by zoom level
- Clear legend + severity color semantics
- Deterministic filter precedence
- Mobile-safe drawer behavior for details

### Acceptance Checklist

- [ ] Layer definitions are explicit and non-overlapping.
- [ ] Large datasets are clustered or aggregated.
- [ ] Interaction flows work on keyboard and touch.
- [ ] Hazard severity is visually distinguishable and consistent.
- [ ] Map updates remain responsive during interaction.

## Do Not Use When

- Task is notification channel logic (use `resilientph-alerting-and-notifications`).
- Task is external feed parsing/normalization (use `resilientph-hazard-data-ingestion`).
