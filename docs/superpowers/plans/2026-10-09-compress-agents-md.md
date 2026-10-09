# Compress AGENTS.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compress `AGENTS.md` by ~50% (~2,500 prompt tokens saved per turn) using High-Density Structured Constraints while preserving 100% of architectural, security, and coding guardrails.

**Architecture:** Consolidate triple-redundant skill dispatch sections into a unified precedence matrix, replace the 67-line static file tree with a compact boundary map, merge duplicate workflow rules into direct imperative directives, and preserve the Next.js 16 auto-generated block.

**Tech Stack:** Markdown (`AGENTS.md`).

**Spec:** In-chat approved design brief (Approach 2: High-Density Structured Constraints).

## Global Constraints

- Never drop Supabase `getUser()` requirement over `getSession()`.
- Never drop client vs server Supabase import paths (`@/lib/supabase/client` vs `@/lib/supabase/server`).
- Never drop domain directory boundaries (`components/<domain>`, `hooks/<domain>`, `lib/<domain>`).
- Never drop AI domain guardrails (sliding window, 5-minute cache, prompt injection rejection).
- Never modify or remove the Next.js 16 auto-generated section (`<!-- BEGIN:nextjs-agent-rules -->`).
- Preserve all remaining 11 workspace skills in the dispatch matrix.

## Review Focus

1. Ensure all 11 active workspace skills are correctly documented with their exact relative paths.
2. Ensure no security rules (RLS, CSRF, rate limits, AbortController) are omitted.
3. Verify the Next.js 16 auto-block remains bit-for-bit identical at the end of the file.
4. Verify all code symbol imports and naming conventions match existing codebase patterns.
5. Check that total file size is reduced from ~20.7 KB to ~9-10 KB.

---

### Task 1: Create Backup and Draft Compressed AGENTS.md Content

**Files:**
- Modify: `c:/Users/royce/Desktop/resilientph/AGENTS.md`
- Backup reference: `c:/Users/royce/Desktop/resilientph/scratch/AGENTS.backup.md`

**Interfaces:**
- Consumes: Current `AGENTS.md` contents (278 lines, 20.7 KB).
- Produces: Streamlined, high-density `AGENTS.md` (~140-160 lines, ~9.5-10.5 KB).

- [x] **Step 1: Save backup of original AGENTS.md in scratch directory**

Copy current `AGENTS.md` to `scratch/AGENTS.backup.md` to ensure instant rollback capability.

- [x] **Step 2: Construct high-density AGENTS.md content**

Structure:
1. Header & Unified Skill Precedence Matrix (11 active skills).
2. Quick Reference, Commands & Tech Stack.
3. Codebase Architecture & Domain Directory Boundaries.
4. Naming Conventions (7-row table).
5. Frontend, Design & UI Primitives (tokens, icons, images, PortalProviders).
6. Supabase & Database Architecture (`getUser()`, client vs server, migrations).
7. Error Handling, Resilience & AI Safety (boundaries, rate-limits, sliding window, caching).
8. Agent Workflow & Quality Rules (planning gate, zero breaking changes, a11y, lint/build).
9. Next.js 16 Auto-Block (exact preserved block).

- [x] **Step 3: Write the compressed content to AGENTS.md**

Overwrite `AGENTS.md` with the high-density version using `write_to_file`.

- [x] **Step 4: Verify file size, line count, and content completeness**

Verify:
- Size decreased from ~20.7 KB to ~9-10.5 KB.
- Next.js auto-block matches original.
- All 11 active skills are present and clickable.
- All security and architectural constraints are present.

- [x] **Step 5: Commit changes**

```bash
git add AGENTS.md
git commit -m "docs: compress AGENTS.md to high-density structured constraints"
```
