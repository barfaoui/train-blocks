---
name: pr-title-and-description
description: >-
  Drafts a concise PR title and bullet-point description for the current branch
  in training-planning. Use when writing or updating a PR title/body, opening a
  PR, or when asked for pr-title-and-description / PR copy.
---

# PR Title and Description (training-planning)

Draft a **title** and **description** for the current branch. Read-only unless the user asks to create or update the PR.

## Shared foundation

1. Read and follow [pr-recap](../pr-recap/SKILL.md) first.
2. Use that recap as the only source of truth for what changed.
3. Then produce title + description below (do not paste the full recap as the PR body).

## Title

- Concise and **more general** than the description: one theme for the whole branch.
- Specific enough to distinguish the change (not vague: avoid "Update stuff", "Fixes", "Improvements").
- **Must not** restate or concatenate the description bullets.
- Prefer ~50–72 characters when practical; no trailing period.
- No conventional-commit prefix unless the user asks (`feat:`, `fix:`, etc.).

**Good:** `Harden auth service env loading`  
**Bad (vague):** `Auth updates`  
**Bad (description repeat):** `Adds dotenv loading, Fixes missing CORS, Updates index bootstrap`

## Description

Bullet list only. Each line:

- Starts with a verb in this style: **Adds…**, **Fixes…**, **Updates…**, **Removes…**, **Refactors…**, etc.
- One outcome per bullet; concrete, not a file laundry list unless the file *is* the outcome.
- Derived from the recap’s change bullets; tighten wording for PR readers.
- No summary paragraph above or below the list unless the user asks.

Example shape:

```markdown
- Adds shared environment helpers for service bootstrap
- Fixes planner service startup when env files are missing
- Updates Makefile targets to reset service databases safely
```

## Output format

Deliver exactly:

```markdown
## Title
<one line>

## Description
- …
- …
```

If the user asks to open or update a PR, reuse this title and description with `gh` (create or `gh pr edit`). Otherwise stop after the draft.

## After delivery

Do not push, commit, or open a PR unless asked.
