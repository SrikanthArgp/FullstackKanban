Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -Path (Join-Path $PSScriptRoot "..")

docker build -t pm-main .
docker run -d --name pm-main -p 8000:8000 pm-main
