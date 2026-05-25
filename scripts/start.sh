#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

docker build -t pm-main .
docker run -d --name pm-main -p 8000:8000 pm-main
echo "Container started. Streaming logs (Ctrl+C to stop):"
docker logs -f pm-main
