# Training Planning

Monorepo for planning training sessions (`auths` + `planner`).

## Prerequisites

| Tool | Notes |
| --- | --- |
| **Node.js** | v20+ recommended |
| **Docker** | For local Postgres |
| **Make** | Optional; used for all run/build targets |

## Setup

```bash
git clone https://github.com/barfaoui/training-planning.git
cd training-planning
npm install
cp .env.example .env
```

## Database

```bash
docker compose up -d
# or: make db-up
```

Stops with `docker compose down` / `make db-down`.

## Run

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

## URLs & ports

Ports = `basePort + index + 1` from [`common/environment.json`](common/environment.json) (`basePort: 3000`).

| App | URL |
| --- | --- |
| Auths service | http://localhost:3001 |
| Auths front | http://localhost:3002 |
| Planner service | http://localhost:3003 |
| Planner front | http://localhost:3004 |

## Connect with DataGrip / DBeaver

Use values from `.env` (defaults from `.env.example`):

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `training_planning` |
| User | `app` |
| Password | `app` |
| URL | `postgresql://app:app@localhost:5432/training_planning` |
