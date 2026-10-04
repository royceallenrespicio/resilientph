---
name: resilientph-security-and-rls
description: Security and Supabase RLS governance for ResilientPH: auth boundaries, policy templates, service-role constraints, and secret handling.
license: MIT
metadata:
  author: resilientph-team
  version: "1.0.0"
---

# ResilientPH Security and RLS

Use this skill for any auth, RLS policy, data access boundary, or secret exposure concern.

## Trigger Matrix

| Situation | Invoke? | Why |
|---|---|---|
| Adding/modifying Supabase tables and policies | Yes | Enforces secure default access model |
| Debugging unauthorized/over-permissive data access | Yes | Applies policy and auth validation workflow |
| Touching service-role usage in API routes/actions | Yes | Prevents privilege leakage |
| Pure frontend animation/layout tasks | No | Use UI/react skills |

## Workflow

1. Identify data classification and intended readers/writers.
2. Enable/verify RLS and define minimal policies per role.
3. Validate server/client auth boundary (`getUser` for trusted checks).
4. Ensure service-role usage is server-only and narrowly scoped.
5. Validate negative cases (blocked access) and positive cases (allowed access).

## Guardrails

- Never trust client-only session state for authorization decisions.
- Never expose `service_role` keys in browser bundles or `NEXT_PUBLIC_*` vars.
- Never ship tables in exposed schemas without RLS + explicit policies.
- Avoid broad catch-all policies that grant more than required.

## Implementation Assets

### Policy Design Baseline

- Read policy by ownership/visibility
- Insert policy with authenticated ownership checks
- Update/Delete policies scoped by owner or privileged role
- Explicit admin-only pathways where required

### Acceptance Checklist

- [ ] RLS enabled on exposed tables.
- [ ] Policies exist for SELECT/INSERT/UPDATE/DELETE as needed.
- [ ] Auth checks on server use `supabase.auth.getUser()`.
- [ ] Service-role key is only used in server contexts.
- [ ] Unauthorized access paths are explicitly denied.

## Do Not Use When

- Task is query/index performance only (use `supabase-postgres-best-practices`).
- Task is deployment release checklist with no policy/auth changes (use `resilientph-deployment-readiness`).
