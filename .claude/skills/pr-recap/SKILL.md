---
name: pr-recap
description: >-
  Builds a structured recap of the current branch vs the repo base (what
  changed, packages touched, add/fix/update bullets). Shared foundation for
  pr-review and pr-title-and-description. Use when summarizing branch changes,
  preparing a PR recap, or when another skill instructs you to run pr-recap.
---

# PR Recap (training-planning)

Produce a **read-only** factual recap of the current branch. Do not edit files, commit, push, or open/update a PR unless a calling skill or the user explicitly asks.

## Repo context

- npm workspaces monorepo: `auths/*`, `planner/*`
- Packages: `auths/service`, `auths/front`, `planner/service`, `planner/front`, root config
- Never print secrets from `.env`

## Workflow

```
PR recap:
- [ ] 1. Scope the branch
- [ ] 2. Read the changes
- [ ] 3. Emit the recap
```

### 1. Scope the branch

Run in parallel:

```bash
git status
git branch -vv
git rev-parse --abbrev-ref HEAD
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || true
git log --oneline --decorate -20
```

Determine base (`main`, `master`, or `origin/HEAD`). Then:

```bash
git merge-base HEAD <base>
git log --oneline <merge-base>..HEAD
git diff --stat <merge-base>...HEAD
git diff <merge-base>...HEAD
git diff
git diff --cached
```

Include committed and uncommitted work unless the caller scopes otherwise. If the working tree is dirty, note that. If there is no meaningful diff, stop and say there is nothing to recap.

### 2. Read the changes

- Skim changed files enough to name intent accurately (not line-by-line review).
- Map to packages: `auths/service`, `auths/front`, `planner/service`, `planner/front`, root, other.
- Prefer evidence from the diff and commit subjects over speculation.

### 3. Emit the recap

Use this exact structure:

```markdown
# PR recap

**Branch:** <name>
**Base:** <base>
**Dirty working tree:** yes | no

## Packages touched
- <auths/service | auths/front | planner/service | planner/front | root | other>

## Change bullets
- Adds ...
- Fixes ...
- Updates ...
- Removes ...
- Refactors ...

## Notes
- <scope caveats, e.g. uncommitted files, or "None">
```

### Change bullet rules

- One bullet per distinct outcome; start with a past-tense verb: **Adds**, **Fixes**, **Updates**, **Removes**, **Refactors**, **Migrates**, **Documents**, etc.
- Be specific enough that a reviewer knows what landed; no filler ("various improvements").
- Group related file edits into one bullet when they serve one outcome.
- Do not invent behavior that is not in the diff.

## After the recap

Stop unless a calling skill continues (e.g. merge review, title/description) or the user asks for a next step.
