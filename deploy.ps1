# deploy.ps1 — Manual Vercel deployment trigger
# Usage: .\deploy.ps1
# Run from the monorepo root when you want to push to production.

$authFile = "$env:APPDATA\xdg.data\com.vercel.cli\auth.json"
if (-not (Test-Path $authFile)) {
  Write-Error "Not logged in. Run: npx vercel login"
  exit 1
}

$authContent = Get-Content $authFile | ConvertFrom-Json
$token = $authContent.token
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Get latest commit SHA on main
$sha = git rev-parse HEAD
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Deploying $branch @ $sha to production..." -ForegroundColor Cyan

$bodyObj = @{
  name      = "e-commerce-website-web"
  target    = "production"
  gitSource = @{ type = "github"; repoId = "1244322379"; ref = "main"; sha = $sha }
}
$body = $bodyObj | ConvertTo-Json -Depth 5

$resp = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments?teamId=team_3ORo4kdLcqLHoPJVWIQjvIAl&forceNew=1" -Headers $headers -Method POST -Body $body
$deployId = $resp.id
Write-Host "Queued: $deployId" -ForegroundColor Yellow
Write-Host "Inspect: https://vercel.com/kimanistanley45-5516s-projects/e-commerce-website-web/$deployId"

# Poll until done
$elapsed = 0
do {
  Start-Sleep -Seconds 15
  $elapsed += 15
  $status = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments/$deployId`?teamId=team_3ORo4kdLcqLHoPJVWIQjvIAl" -Headers $headers -Method GET
  Write-Host "[$($elapsed)s] $($status.readyState)"
} while ($status.readyState -notin @("READY","ERROR","CANCELED") -and $elapsed -lt 360)

if ($status.readyState -eq "READY") {
  Write-Host "`nDeployed! https://e-commerce-website-web.vercel.app" -ForegroundColor Green
} else {
  Write-Host "`nFailed: $($status.errorCode) — $($status.errorMessage)" -ForegroundColor Red
  exit 1
}
