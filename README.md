# Train Blocks 🏗️

A calendar-based training planner for athletes: plan your sessions across sports, organize your weeks, and keep your sessions synced.

**Live:** [trainblocks.app](https://trainblocks.app)

## Stack

TypeScript · React · Vite · Node.js / Express · PostgreSQL · Prisma · Zod · Vitest · Docker · Caddy · GitHub Actions

## Architecture

Monorepo with two services, each with its own front end:

- **Auths**: accounts, sessions (JWT), email verification and password flows, rate-limited endpoints
- **Planner**: training sessions, recurrence and the calendar

Both share one PostgreSQL database, with a separate schema per service. In production, a single server runs everything with Docker Compose: Caddy (HTTPS and routing), both services, Postgres, and a migration container that must succeed before the services start. Nightly jobs purge deleted data and back up the database.

Every push to `main` runs CI (build, tests, Prettier, ESLint) and then deploys automatically.


## Run locally

### Prerequisites

| Tool | Notes |
| --- | --- |
| **Node.js** | v20+ recommended |
| **Docker** | For local Postgres and Mailpit |
| **Make** | Optional; used for all run/build targets |

### Setup

```bash
git clone https://github.com/barfaoui/train-blocks.git
cd train-blocks
npm install
cp .env.example .env
```

### Database

```bash
docker compose up -d
# or: make db-up
```

Also starts Mailpit, which catches every email the services send locally: <http://localhost:8025>.

Stops with `docker compose down` / `make db-down`.

### Run

| Command | What it starts |
| --- | --- |
| `make -C auths run` | Auths service + front |
| `make -C planner run` | Planner service + front |
| `make run` | Both apps |

Each `run` / `run-service` target brings Postgres up and regenerates `common/environment.ts` from `common/environment.json`.

Seed / reset a service DB:

```bash
make -C auths reset-db
make -C planner reset-db
```

### URLs & ports

Ports = `basePort + index + 1` from [`common/environment.json`](common/environment.json) (`basePort: 3000`).

| App | URL |
| --- | --- |
| Auths service | <http://localhost:3001> |
| Auths front | <http://localhost:3002/auth/> |
| Planner service | <http://localhost:3003> |
| Planner front | <http://localhost:3004> |

### Connect with DataGrip / DBeaver

Use values from `.env` (defaults from `.env.example`):

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `training_planning` |
| User | `app` |
| Password | `app` |
| URL | `postgresql://app:app@localhost:5432/training_planning` |

## Deploying (production)

One server runs everything with Docker Compose (project `train-blocks`), from [`docker-compose.prod.yml`](docker-compose.prod.yml).

| Container | Role |
| --- | --- |
| `web` | Caddy: HTTPS certificates, routing, serves both built fronts ([`deploy/Caddyfile`](deploy/Caddyfile)) |
| `auths-service` | Auths API |
| `planner-service` | Planner API |
| `postgres` | Database, reachable only from the other containers |
| `migrate` | Runs `prisma migrate deploy` for both schemas, then exits; the services start only if it succeeds |

| Path | Served by |
| --- | --- |
| `/api/auth/*` | `auths-service` |
| `/api/events/*` | `planner-service` |
| `/auth/*` | Auths front |
| `/*` | Planner front |

### First deploy

The server needs Docker, and DNS for the domain must point to it (ports 80 and 443 open).

```bash
git clone https://github.com/barfaoui/train-blocks.git
cd train-blocks
cp .env.production.example .env.production
```

Replace every `<...>` in `.env.production` (see the comments in [`.env.production.example`](.env.production.example)), then:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Deploy a new version

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Check and debug

```bash
docker compose -f docker-compose.prod.yml ps -a
docker compose -f docker-compose.prod.yml logs --tail 50
```

`migrate` should show `Exited (0)`; the other four containers should be up.

### Scheduled tasks

Run nightly from the server's crontab:

| Task | Command (prefix with `docker compose -f docker-compose.prod.yml exec -T`) |
| --- | --- |
| Purge accounts deleted more than 7 days ago | `auths-service node auths/service/scripts/purge-deleted-users.mjs` |
| Purge expired email links | `auths-service node auths/service/scripts/purge-expired-email-tokens.mjs` |
| Purge events deleted more than 14 days ago | `planner-service node planner/service/scripts/purge-deleted-events.mjs` |
| Back up the database | `postgres pg_dump -U app training_planning \| gzip > backup.sql.gz` |

## License

[GPL-3.0](LICENSE)
