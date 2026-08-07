.PHONY: run-auths run-auths-service run-front build clean

# Run both auths service and front in parallel
run-auths:
	concurrently "make run-auths-service" "make run-front"

# Run the auths service in dev mode
run-auths-service:
	ts-node-dev --respawn --transpile-only auths/service/src/index.ts

# Run the front in dev mode
run-front:
	ts-node-dev --respawn --transpile-only auths/front/src/index.tsx

# Build all TypeScript projects
build:
	tsc -b

# Clean build artifacts
clean:
	rm -rf dist/