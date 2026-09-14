.PHONY: generate-env db-up db-down run build test clean lint

generate-env:
	node scripts/generate-environment.mjs
	npx tsc -b common/tsconfig.build.json

# Shared local Postgres (Compose reads credentials from .env)
db-up:
	docker compose up -d --wait

db-down:
	docker compose down

run:
	cd $(CURDIR) && npx concurrently "make -C auths run" "make -C planner run"

build: generate-env
	$(MAKE) -C auths build
	$(MAKE) -C planner build

test:
	npx vitest run --config common/vitest.config.mts
	$(MAKE) -C auths test
	$(MAKE) -C planner test

lint:
	npx prettier --write .
	npx eslint . --fix

clean:
	$(MAKE) -C auths clean
	$(MAKE) -C planner clean
	rm -rf common/dist

