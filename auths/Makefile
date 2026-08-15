ROOT := ..
PRISMA_SCHEMA := auths/service/prisma/schema.prisma

.PHONY: run reset reset-db db-migrate db-studio run-service run-front preview-front build test clean

# Start service + front (DB up, no seed)
run:
	cd $(ROOT) && npx concurrently "make -C auths run-service" "make -C auths run-front"

run-service:
	$(MAKE) -C $(ROOT) generate-env db-up
	cd $(ROOT) && npx ts-node-dev -r tsconfig-paths/register --respawn --transpile-only auths/service/src/index.ts

run-front:
	$(MAKE) -C $(ROOT) generate-env
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js --config auths/front/vite.config.ts

preview-front:
	$(MAKE) -C $(ROOT) generate-env
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js preview --config auths/front/vite.config.ts

# Apply pending Prisma migrations (auth schema)
db-migrate:
	$(MAKE) -C $(ROOT) db-up
	cd $(ROOT) && npx prisma migrate deploy --schema=$(PRISMA_SCHEMA)
	cd $(ROOT) && npx prisma generate --schema=$(PRISMA_SCHEMA)

# Open Prisma Studio for auth.users
db-studio:
	cd $(ROOT) && npx prisma studio --schema=$(PRISMA_SCHEMA)

# Wipe schema + reseed, then run
reset: reset-db run

# Wipe auth schema, re-apply migrations, then seed default_data.sql
reset-db:
	$(MAKE) -C $(ROOT) db-up
	node $(ROOT)/scripts/reset-service-db.mjs auths --drop-only
	cd $(ROOT) && npx prisma migrate deploy --schema=$(PRISMA_SCHEMA)
	cd $(ROOT) && npx prisma generate --schema=$(PRISMA_SCHEMA)
	node $(ROOT)/scripts/reset-service-db.mjs auths --seed-only

test:
	cd $(ROOT) && npx vitest run --config auths/service/vitest.config.mts

build:
	$(MAKE) -C $(ROOT) generate-env
	npx tsc -b service/tsconfig.build.json
	npx tsc -p front
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js build --config auths/front/vite.config.ts

clean:
	rm -rf service/dist front/dist
