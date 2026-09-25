# Services and migrations: compiled code, run with `node -r tsconfig-paths/register`.
FROM node:20-bookworm-slim AS app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl make \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema=auths/service/prisma/schema.prisma \
  && npx prisma generate --schema=planner/service/prisma/schema.prisma \
  && make build

ENV NODE_ENV=production

# Reverse proxy serving the built fronts.
FROM caddy:2 AS web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=app /app/auths/front/dist /srv/auths
COPY --from=app /app/planner/front/dist /srv/planner
