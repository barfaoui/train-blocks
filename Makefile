.PHONY: run-auths run-auths-service run-front run-planner run-planner-service build clean

# Run both auths service and front in parallel
run-auths:
	concurrently "make run-auths-service" "make run-front"

# Run the auths service in dev mode
run-auths-service:
	ts-node-dev --respawn --transpile-only auths/service/src/index.ts

# Run the front in dev mode
run-front:
	ts-node-dev --respawn --transpile-only auths/front/src/index.tsx

# Run the planner service in dev mode
run-planner-service:
	ts-node-dev --respawn --transpile-only planner/service/src/index.ts

# Alias for planner service (front tooling comes later)
run-planner: run-planner-service

# Build all TypeScript projects
build:
	tsc -b

# Clean build artifacts
clean:
	rm -rf dist/ */service/dist 