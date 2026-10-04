---
name: resilientph-observability-slo
description: Observability and service-level governance for ResilientPH including telemetry standards, error budgets, incident signals, and operational runbooks.
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Observability and SLO

Use this skill when defining logs/metrics/alerts, reliability targets, and incident response readiness.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Adding operational metrics/telemetry | Yes | Standardizes useful signal collection |
| Defining reliability targets for APIs/features | Yes | Introduces SLO/error-budget discipline |
| Investigating recurring production instability | Yes | Enforces incident-oriented diagnostics |
| Pure visual polish work | No | Use UI/workflow skills |

## Workflow

1. Define service scope and user-impacting objectives (availability, latency, freshness).
2. Instrument structured logs and key metrics at critical boundaries.
3. Define SLOs and error budgets per service domain.
4. Create actionable alerts tied to symptom-based thresholds.
5. Document runbook steps for triage, mitigation, and post-incident learning.

## Guardrails

- Do not rely on unstructured logs only; include machine-queryable fields.
- Do not alert on noisy low-signal events without suppression strategy.
- Do not define SLOs without identifying how to measure them.
- Do not omit incident ownership and escalation path.

## Implementation Assets

### Core Signals (minimum)

- API error rate and p95 latency
- Hazard-feed freshness lag
- Notification delivery success/failure rate
- Moderation queue backlog and age

### Acceptance Checklist

- [ ] Structured log schema defined for core services.
- [ ] Service-level objectives are measurable and documented.
- [ ] Error budget policy exists (burn-rate interpretation).
- [ ] Alerts map to user-impacting symptoms.
- [ ] Runbook includes triage, rollback/mitigation, and escalation owner.

## Do Not Use When

- Task is specific auth/RLS policy work (use `resilientph-security-and-rls`).
- Task is parser normalization and ingestion contract work (use `resilientph-hazard-data-ingestion`).
