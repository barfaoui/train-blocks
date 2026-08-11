ROOT := ..

.PHONY: run reset reset-db run-service build clean

# Start planner service (DB up, no seed)
run: run-service

run-service:
	$(MAKE) -C $(ROOT) generate-env db-up
	ts-node-dev --respawn --transpile-only service/src/index.ts

# Wipe schema + reseed, then run
reset: reset-db run

# Wipe this service's schema and apply default_data.sql
reset-db:
	$(MAKE) -C $(ROOT) db-up
	node $(ROOT)/scripts/reset-service-db.mjs planner

build:
	$(MAKE) -C $(ROOT) generate-env
	npx tsc -b service

clean:
	rm -rf service/dist front/dist
