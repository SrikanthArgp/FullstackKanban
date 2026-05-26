#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

if [ -f .env ]; then
	set -a
	. ./.env
	set +a
fi

docker build -t pm-main .
docker run -d --name pm-main \
	-p 8000:8000 \
	-e OPENROUTER_API_KEY \
	-e OPENROUTER_BASE_URL \
	-e OPENROUTER_MODEL \
	pm-main
echo "Container started. Streaming logs (Ctrl+C to stop):"
docker logs -f pm-main
