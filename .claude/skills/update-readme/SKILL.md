---
name: update-readme
description: >-
  Syncs the root README.md local setup guide with the current training-planning
  monorepo (prereqs, setup, Make targets, ports, DB credentials). Use when the
  project grows or changes, after Makefile/env/docker/port updates, or when
  asked to update/refresh/sync the README.
---

# Update README (training-planning)

Keep root [`README.md`](../../../README.md) accurate and short. Edit the file in place; do not invent workflows that are not in the repo.

## When to run

- New package/app, Make target, env var, Compose service, or port
- Setup flow changed (install, generate-env, db, run)
- User asks to update / refresh / sync the README

## Sources of truth (read these; do not guess)

| Topic | Read |
| --- | --- |
| Prereqs / deps | root `package.json` (engines if present) |
| Env + DB defaults | `.env.example`, `docker-compose.yml` |
| Root commands | root `Makefile` |
| App commands | `auths/Makefile`, `planner/Makefile` (+ any new `*/Makefile`) |
| Ports | `common/environment.json` (+ generated `common/environment.ts` if present) |
| Generate-env | `scripts/generate-environment.mjs` |

Port formula: `basePort + index + 1` for each entry in `apps` (order matters).

## Required sections (keep this outline)

Preserve heading order and table-heavy style. Add a section only when a new first-class setup concern appears; remove sections that no longer apply.

1. **Title + one-line blurb** — product name; packages listed only if still accurate
2. **Prerequisites** — Node, Docker, Make (optional unless Make becomes required)
3. **Setup** — clone → `npm install` → copy `.env.example` → `.env`
4. **Database** — Compose / `make db-up` / `db-down`
5. **Run** — Make targets for each app + root `make run`; note generate-env / db side effects; reset-db if targets exist
6. **URLs & ports** — table from `environment.json`; link the JSON file
7. **DataGrip / DBeaver** — host, port, db, user, password, URL from `.env.example` defaults

## Style rules

- Concise; short tables and fenced bash over prose
- Commands must match Makefiles exactly (`make -C <pkg> …`, `make db-up`, etc.)
- No secrets beyond `.env.example` defaults; never paste real `.env`
- No nested `package.json` / npm scripts inventing; workflows live in Make
- Do not document Cursor skills, CI, or internals unless the user asks

## Workflow

```
Update README:
- [ ] 1. Read current README.md
- [ ] 2. Diff against sources of truth above
- [ ] 3. Patch only stale rows/commands/sections
- [ ] 4. Recheck ports and DB credentials against JSON / .env.example
```

If nothing is stale, say so and stop without editing.

## After update

Do not commit, push, or open a PR unless asked. Summarize what changed in the README in one short bullet list.
