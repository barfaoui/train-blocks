#!/usr/bin/env bash
# Deploys the latest main on the production server. Run by hand and by the GitHub Actions
# deploy job. Pass --force to rebuild even when the current commit is already deployed.
set -euo pipefail

main() {
  cd "$(dirname "$0")/.."

  local marker=.git/deployed-commit
  local force="${1:-${SSH_ORIGINAL_COMMAND:-}}"

  git pull --ff-only
  local head
  head=$(git rev-parse HEAD)

  if [ "$force" != "--force" ] && [ -f "$marker" ] && [ "$(cat "$marker")" = "$head" ]; then
    echo "Nothing new to deploy."
    return
  fi

  docker compose -f docker-compose.prod.yml up -d --build
  echo "$head" > "$marker"
  docker image prune -f
  echo "Deployed $head."
}

# One line, so bash has read the whole file before `git pull` can replace it.
main "$@"; exit
