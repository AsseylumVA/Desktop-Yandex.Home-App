# Сборка и предзагрузка Docker-образов MCP-серверов (см. AGENTS.md)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $ProjectRoot

Write-Host "Pulling official MCP images..." -ForegroundColor Cyan
docker pull mcp/sequentialthinking

Write-Host "Building custom MCP images..." -ForegroundColor Cyan
docker compose -f docker-compose.mcp.yml build

$MemoriesDir = Join-Path $env:USERPROFILE ".config\memories"
if (-not (Test-Path $MemoriesDir)) {
    New-Item -ItemType Directory -Path $MemoriesDir -Force | Out-Null
    Write-Host "Created memories store: $MemoriesDir" -ForegroundColor Green
}

Write-Host "Done. Restart Cursor and enable MCP servers in Settings -> MCP." -ForegroundColor Green
