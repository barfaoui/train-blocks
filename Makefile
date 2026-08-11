.PHONY: generate-env db-up db-down run build clean lint

generate-env:
	node scripts/generate-environment.mjs
	npx tsc -b common

# Shared local Postgres (Compose reads credentials from .env)
db-up:
	docker compose up -d --wait

db-down:
	docker compose down

run:
	concurrently "make -C auths run" "make -C planner run"

build: generate-env
	$(MAKE) -C auths build
	$(MAKE) -C planner build

lint:
	npx prettier --write .
	npx eslint . --fix

clean:
	$(MAKE) -C auths clean
	$(MAKE) -C planner clean
	rm -rf common/dist

