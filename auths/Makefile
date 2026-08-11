ROOT := ..

.PHONY: run reset reset-db run-service run-front build clean

# Start service + front (DB up, no seed)
run:
	concurrently "make run-service" "make run-front"

run-service:
	$(MAKE) -C $(ROOT) generate-env db-up
	ts-node-dev --respawn --transpile-only service/src/index.ts

run-front:
	ts-node-dev --respawn --transpile-only front/src/index.tsx

# Wipe schema + reseed, then run
reset: reset-db run

# Wipe this service's schema and apply default_data.sql
reset-db:
	$(MAKE) -C $(ROOT) db-up
	node $(ROOT)/scripts/reset-service-db.mjs auths

build:
	$(MAKE) -C $(ROOT) generate-env
	npx tsc -b service

clean:
	rm -rf service/dist front/dist
