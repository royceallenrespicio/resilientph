---
name: resilientph-incident-moderation
description: Moderation workflow and policy controls for community incident reports: spam/abuse filtering, confidence scoring, escalation paths, and reviewer actions.
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Incident Moderation

Use this skill when building or refining community report validation and moderation systems.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Editing `/api/reports` moderation logic | Yes | Keeps anti-abuse and review flow consistent |
| Adding trust-score or verification tiers | Yes | Applies policy and escalation standards |
| Building moderator dashboard queues/actions | Yes | Standardizes review lifecycle |
| Static content update with no moderation effect | No | Use workflow skill only |

## Workflow

1. Classify report input risks (spam, duplicate, malicious, low-confidence).
2. Score report confidence and determine state (`pending`, `verified`, `rejected`, `needs_review`).
3. Route high-risk items to moderation queue with clear reason codes.
4. Record moderator actions with audit metadata (who, when, decision reason).
5. Expose user-safe feedback without leaking moderation internals.

## Guardrails

- Never auto-publish reports flagged as high-risk without review.
- Never silently discard user submissions; return explicit validation outcome.
- Keep moderation reason taxonomy consistent for analytics.
- Preserve auditability for all reviewer actions.

## Implementation Assets

### Suggested Moderation Fields

- `report_status`
- `risk_level` (`low` | `medium` | `high`)
- `confidence_score` (0-1)
- `review_reason_code`
- `reviewed_by`
- `reviewed_at`

### Acceptance Checklist

- [ ] Moderation states are explicit and finite.
- [ ] Duplicate/spam heuristics are deterministic and documented.
- [ ] Escalation rules exist for high-risk submissions.
- [ ] Moderator decisions are auditable.
- [ ] User response surfaces a clear outcome state.

## Do Not Use When

- Task is alert routing/delivery preferences (use `resilientph-alerting-and-notifications`).
- Task is data ingestion/parsing from external hazard sources (use `resilientph-hazard-data-ingestion`).
