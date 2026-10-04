---
name: resilientph-alerting-and-notifications
description: Notification architecture for hazard alerts including subscriptions, deduplication, priority routing, throttling, and anti-fatigue controls.
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Alerting and Notifications

Use this skill for alert subscriptions, event-to-notification routing, and delivery safety controls.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Building hazard subscription features | Yes | Defines model for location + hazard preferences |
| Implementing notification dispatch rules | Yes | Enforces dedupe, priority, and throttling |
| Adding reminder/escalation channels | Yes | Keeps anti-fatigue protections |
| Pure ingestion parser changes only | No | Use `resilientph-hazard-data-ingestion` |

## Workflow

1. Define subscription key model (user, location, hazard type, channel).
2. Normalize events into dispatchable alert payloads.
3. Apply dedupe window and idempotency keys.
4. Route by severity and user preferences with throttling.
5. Persist delivery attempts and surface failure/retry status.

## Guardrails

- Never send duplicate alerts inside dedupe window.
- Never notify on `low` confidence events without explicit policy.
- Never block critical (`severe`) alerts behind non-critical queue delays.
- Always persist delivery outcomes for debugging and trust.

## Implementation Assets

### Alert Priority Model (guideline)

- `critical`: immediate dispatch, minimal throttling
- `high`: quick dispatch, bounded repeat
- `medium`: batched/controlled dispatch
- `low`: digest or optional only

### Acceptance Checklist

- [ ] Subscription schema supports hazard + geo preferences.
- [ ] Dispatch path has idempotency key and dedupe logic.
- [ ] Severity-based routing policy is explicit.
- [ ] Throttling/quiet-hour behavior is defined.
- [ ] Delivery outcomes are logged with retry state.

## Do Not Use When

- Task is moderation policy for user-generated reports (use `resilientph-incident-moderation`).
- Task is map rendering/performance only (use `resilientph-map-ux-and-geospatial`).
