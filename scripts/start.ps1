Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -Path (Join-Path $PSScriptRoot "..")

docker build -t pm-main .
docker run -d --name pm-main -p 8000:8000 `
	-e OPENROUTER_API_KEY `
	-e OPENROUTER_BASE_URL `
	-e OPENROUTER_MODEL `
	pm-main
