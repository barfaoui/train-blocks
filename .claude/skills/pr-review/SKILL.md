---
name: pr-review
description: >-
  Read-only merge readiness review for the training-planning monorepo (auths +
  planner). Checks regression risk and code quality on the current branch and
  reports Ready / Ready with nits / Not ready. Use when asking if the branch is
  ready to merge, for a pre-merge review, regression check, or branch quality
  assessment without making changes.
---

# Merge Readiness Review (training-planning)

Perform a **read-only** review of the current branch in this repo and deliver a final merge verdict. Do not edit files, commit, push, rebase, or apply fixes unless the user explicitly asks after the report.

## Shared foundation

1. Read and follow [pr-recap](../pr-recap/SKILL.md) first (scope, packages, change bullets).
2. Reuse that recap for branch/base/packages and the report Summary; do not re-gather the same git scope unless the tree changed.
3. Continue with evidence, regression, quality, and the final report below.

## Repo context

- npm workspaces monorepo: `auths/*`, `planner/*`
- Services of interest: `auths/service`, `planner/service` (and fronts under `auths/front`, `planner/front`)
- Root `tsconfig.json` project references currently include `auths/service` and `planner/service`
- Safe verify command: `make build` (`tsc -b`)
- Dev runners (`make run-*`) start servers — do **not** use them for this review
- Do not run Prisma migrate/generate, DB seed, deploy, or anything that mutates data/env as part of the review
- Never commit or print secrets from `.env`

## Hard rules

- **Read-only**: inspect and report only. No code or config changes.
- Review **branch changes** vs the repo default base (`main` / `master` / tracked upstream), including committed + uncommitted work unless the user scopes otherwise.
- Prefer evidence from diff, `make build`, and surrounding code over speculation.
- If the working tree is dirty, include uncommitted changes and call that out in the report.

## Workflow

Copy and track:

```
Merge readiness:
- [ ] 1. PR recap (shared)
- [ ] 2. Gather evidence
- [ ] 3. Review for regressions
- [ ] 4. Review code quality
- [ ] 5. Deliver final report
```

### 1. PR recap (shared)

Follow [pr-recap](../pr-recap/SKILL.md). If there is no meaningful diff, stop and report that there is nothing to merge-review.

### 2. Gather evidence

Without changing anything:

- Read changed files and nearby call sites / types needed to judge behavior (deeper than the recap).
- Map findings to packages from the recap: `auths/service`, `auths/front`, `planner/service`, `planner/front`, root config (`package.json`, `tsconfig.json`, `Makefile`).
- Run safe verification when TypeScript/service/front/config files changed:

```bash
make build
```

- If `make build` is unavailable, fall back to `npx tsc -b` from the repo root.
- Skip `make run-*`, install/publish, DB migrations, and any mutating commands.
- Note skipped checks and lower confidence accordingly; treat a failed `make build` on touched TS packages as a merge blocker.

### 3. Review for regressions

Focus on behavioral risk introduced by the diff, especially across this monorepo:

- Broken Express routes/handlers, middleware order, CORS, or env loading (`dotenv`)
- Auth vs planner contract drift (shared assumptions, ports, response shapes)
- Workspace/tsconfig reference mismatches (package exists but not in root references, or build graph broken)
- Prisma / DB client usage that can fail at runtime if schema and code diverge (flag; do not migrate)
- Missing updates to callers, types, or Makefile entrypoints implied by the change
- Edge cases: null/empty input, error paths, invalid env
- Partial refactors leaving old and new paths inconsistent

Severity:

| Level | Meaning |
|-------|---------|
| Critical | Likely break in production or security/data integrity risk |
| High | Plausible user-facing or correctness regression |
| Medium | Edge-case or maintainability risk that could become a bug |
| Low | Minor / unlikely |

### 4. Review code quality

Assess only what the diff touches (and necessary context):

- Clarity, naming, structure, duplication
- Error handling consistent with existing `auths` / `planner` service style
- Match existing patterns (no drive-by rearchitecture)
- Dead code, leftover debug, merge-blocking TODOs
- Consistency with TypeScript `strict` and Node16 module settings already in-repo
- Avoid committing `node_modules` or generated noise; flag if the branch adds that

Do not nitpick style already enforced by tooling unless the diff clearly violates project norms.

### 5. Deliver final report

Use this exact structure:

```markdown
# Merge readiness report

**Repo:** training-planning
**Branch:** <name>
**Base:** <base>
**Verdict:** Ready to merge | Ready with nits | Not ready to merge
**Confidence:** High | Medium | Low

## Summary
<2-4 sentences: what the branch does and the overall risk>

## Packages touched
- <auths/service | auths/front | planner/service | planner/front | root | other>

## Regression risk
**Level:** None | Low | Medium | High | Critical

- <finding or "No material regression risks identified.">

## Code quality
**Level:** Good | Acceptable | Needs work

- <finding or "Quality is consistent with the codebase.">

## Findings
| Severity | Area | Location | Finding |
|----------|------|----------|---------|
| Critical/High/Medium/Low | Regression/Quality/Tests/Build/Other | `path:line` | ... |

(If none: "No blocking findings.")

## Checks run
- <command or inspection> → pass / fail / skipped (why)

## Verdict rationale
- **Blockers:** <must fix before merge, or "None">
- **Nits:** <optional follow-ups, or "None">
- **Why this verdict:** <1-3 bullets>
```

### Verdict rules

- **Not ready to merge**: any Critical/High regression, failed `make build` / `tsc -b` on relevant changes, or missing essential safety for a risky change.
- **Ready with nits**: no High/Critical issues; only Medium/Low quality gaps acceptable as follow-up.
- **Ready to merge**: no meaningful regression risk; quality acceptable; relevant checks passed or reasonably justified.

## After the report

Stop. Do not implement fixes unless the user asks. If asked to fix, address blockers first.
