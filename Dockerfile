# Builds everything: Prisma clients, compiled services and both fronts.
FROM node:20-bookworm-slim AS build
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

# Services and migrations: compiled code and production dependencies only, run with
# `node -r tsconfig-paths/register`.
FROM node:20-bookworm-slim AS app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY auths/service/prisma auths/service/prisma
COPY planner/service/prisma planner/service/prisma
RUN npx prisma generate --schema=auths/service/prisma/schema.prisma \
  && npx prisma generate --schema=planner/service/prisma/schema.prisma \
  && rm -rf /root/.cache /root/.npm

COPY auths/service/scripts auths/service/scripts
COPY planner/service/scripts planner/service/scripts
COPY --from=build /app/common/dist common/dist
COPY --from=build /app/auths/service/dist auths/service/dist
COPY --from=build /app/planner/service/dist planner/service/dist

# The files stay root-owned, so the running process can read them but not change them.
USER node

# Reverse proxy serving the built fronts.
FROM caddy:2 AS web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/auths/front/dist /srv/auths
COPY --from=build /app/planner/front/dist /srv/planner
