ROOT := ..
PRISMA_SCHEMA := planner/service/prisma/schema.prisma

.PHONY: run reset reset-db db-migrate db-studio purge-deleted-events run-service run-front preview-front test build clean

# Start service + front (DB up, no seed)
run:
	cd $(ROOT) && npx concurrently "make -C planner run-service" "make -C planner run-front"

run-service:
	$(MAKE) -C $(ROOT) generate-env db-up
	cd $(ROOT) && npx ts-node-dev -r tsconfig-paths/register --respawn --transpile-only planner/service/src/index.ts

run-front:
	$(MAKE) -C $(ROOT) generate-env
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js --config planner/front/vite.config.ts

preview-front:
	$(MAKE) -C $(ROOT) generate-env
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js preview --config planner/front/vite.config.ts

# Apply pending Prisma migrations (planner schema)
db-migrate:
	$(MAKE) -C $(ROOT) db-up
	cd $(ROOT) && npx prisma migrate deploy --schema=$(PRISMA_SCHEMA)
	cd $(ROOT) && npx prisma generate --schema=$(PRISMA_SCHEMA)

# Open Prisma Studio for planner.events
db-studio:
	cd $(ROOT) && npx prisma studio --schema=$(PRISMA_SCHEMA)

# Permanently delete events soft-deleted more than 14 days ago (see
# planner/service/scripts/purge-deleted-events.mjs). Intended to be wired
# into an OS-level cron in production, not run automatically here.
purge-deleted-events:
	cd $(ROOT) && node planner/service/scripts/purge-deleted-events.mjs

test:
	cd $(ROOT) && npx vitest run --config planner/service/vitest.config.mts

# Wipe schema + reseed, then run
reset: reset-db run

# Wipe planner schema, re-apply migrations, then seed default_data.sql
reset-db:
	$(MAKE) -C $(ROOT) db-up
	node $(ROOT)/scripts/reset-service-db.mjs planner --drop-only
	cd $(ROOT) && npx prisma migrate deploy --schema=$(PRISMA_SCHEMA)
	cd $(ROOT) && npx prisma generate --schema=$(PRISMA_SCHEMA)
	node $(ROOT)/scripts/reset-service-db.mjs planner --seed-only

build:
	$(MAKE) -C $(ROOT) generate-env
	npx tsc -b service
	npx tsc -p front
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js build --config planner/front/vite.config.ts

clean:
	rm -rf service/dist front/dist
