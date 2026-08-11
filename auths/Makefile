ROOT := ..

.PHONY: run reset reset-db run-service run-front preview-front build clean

# Start service + front (DB up, no seed)
run:
	concurrently "make run-service" "make run-front"

run-service:
	$(MAKE) -C $(ROOT) generate-env db-up
	cd $(ROOT) && ts-node-dev -r tsconfig-paths/register --respawn --transpile-only auths/service/src/index.ts

run-front:
	$(MAKE) -C $(ROOT) generate-env
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js --config auths/front/vite.config.ts

preview-front:
	$(MAKE) -C $(ROOT) generate-env
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js preview --config auths/front/vite.config.ts

# Wipe schema + reseed, then run
reset: reset-db run

# Wipe this service's schema and apply default_data.sql
reset-db:
	$(MAKE) -C $(ROOT) db-up
	node $(ROOT)/scripts/reset-service-db.mjs auths

build:
	$(MAKE) -C $(ROOT) generate-env
	npx tsc -b service
	npx tsc -p front
	cd $(ROOT) && node -r tsconfig-paths/register node_modules/vite/bin/vite.js build --config auths/front/vite.config.ts

clean:
	rm -rf service/dist front/dist
