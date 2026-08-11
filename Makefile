.PHONY: generate-env db-up db-down run build clean

generate-env:
	node scripts/generate-environment.mjs

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

clean:
	$(MAKE) -C auths clean
	$(MAKE) -C planner clean
	rm -rf common/dist
