#!/usr/bin/env bash
# Redeploy the admin frontend from the latest main branch.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "===== Admin deploy started: $(date -u '+%Y-%m-%d %H:%M:%S UTC') ====="

git fetch origin main
git reset --hard origin/main

docker compose up -d --build
docker image prune -f

echo "===== Admin deploy finished: $(date -u '+%Y-%m-%d %H:%M:%S UTC') ====="
