param(
  [string]$RepoUrl,
  [string]$Message = "Mise à jour du portfolio"
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "La commande git a échoué : git $($Arguments -join ' ')"
  }
}

function Get-RepositoryInfo {
  param([string]$RemoteUrl)

  $normalized = $RemoteUrl.Trim()
  if ($normalized -match '^https://github\.com/(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?/?$' -or
      $normalized -match '^git@github\.com:(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
    return [pscustomobject]@{
      Owner = $Matches.owner
      Repo = $Matches.repo
      WebUrl = "https://github.com/$($Matches.owner)/$($Matches.repo)"
    }
  }

  throw "L’URL doit désigner un dépôt GitHub, par exemple https://github.com/utilisateur/portfolio.git"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git n’est pas installé ou n’est pas accessible dans le PATH."
}

if (-not (Test-Path -LiteralPath '.\index.html' -PathType Leaf)) {
  throw "index.html est introuvable. Lance ce script depuis le dossier du portfolio."
}

if (-not (Test-Path -LiteralPath '.\.git' -PathType Container)) {
  Write-Host "Initialisation du dépôt Git..." -ForegroundColor Cyan
  Invoke-Git init
}

$remoteNames = @(& git remote)
if ($LASTEXITCODE -ne 0) {
  throw "Impossible de lire la liste des dépôts distants Git."
}

$currentRemote = $null
if ($remoteNames -contains 'origin') {
  $currentRemote = (& git remote get-url origin).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "Le dépôt distant origin existe mais son URL est inaccessible."
  }
}

if ([string]::IsNullOrWhiteSpace($RepoUrl) -and [string]::IsNullOrWhiteSpace($currentRemote)) {
  $RepoUrl = Read-Host "Colle l’URL de ton dépôt GitHub vide"
}

if (-not [string]::IsNullOrWhiteSpace($RepoUrl)) {
  $repoInfo = Get-RepositoryInfo -RemoteUrl $RepoUrl
  if ([string]::IsNullOrWhiteSpace($currentRemote)) {
    Invoke-Git remote add origin $RepoUrl
  } elseif ($currentRemote -ne $RepoUrl) {
    Write-Host "Mise à jour du dépôt distant origin." -ForegroundColor Yellow
    Invoke-Git remote set-url origin $RepoUrl
  }
  $currentRemote = $RepoUrl
} else {
  $repoInfo = Get-RepositoryInfo -RemoteUrl $currentRemote
}

$configuredRemote = (& git remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($configuredRemote)) {
  throw "Le dépôt distant origin n’a pas pu être configuré."
}
Write-Host "Dépôt distant : $configuredRemote" -ForegroundColor DarkGray

Write-Host "Préparation des fichiers..." -ForegroundColor Cyan
Invoke-Git add --all

& git diff --cached --quiet
$hasChanges = $LASTEXITCODE -ne 0

if ($hasChanges) {
  & git commit -m $Message
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Git a besoin de ton identité pour créer le commit." -ForegroundColor Yellow
    Write-Host 'Configure-la avec :' -ForegroundColor Yellow
    Write-Host '  git config --global user.name "Prénom Nom"'
    Write-Host '  git config --global user.email "ton-email@example.com"'
    throw "Le commit n’a pas pu être créé."
  }
} else {
  Write-Host "Aucune nouvelle modification à committer." -ForegroundColor DarkGray
}

Invoke-Git branch -M main
Write-Host "Envoi vers GitHub..." -ForegroundColor Cyan
Invoke-Git push -u origin main

$pagesUrl = if ($repoInfo.Repo -ieq "$($repoInfo.Owner).github.io") {
  "https://$($repoInfo.Owner).github.io/"
} else {
  "https://$($repoInfo.Owner).github.io/$($repoInfo.Repo)/"
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
$pagesConfigured = $false

if ($gh) {
  & gh auth status 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Configuration de GitHub Pages..." -ForegroundColor Cyan
    & gh api "repos/$($repoInfo.Owner)/$($repoInfo.Repo)/pages" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      & gh api --method PUT "repos/$($repoInfo.Owner)/$($repoInfo.Repo)/pages" -f 'build_type=legacy' -f 'source[branch]=main' -f 'source[path]=/' | Out-Null
    } else {
      & gh api --method POST "repos/$($repoInfo.Owner)/$($repoInfo.Repo)/pages" -f 'build_type=legacy' -f 'source[branch]=main' -f 'source[path]=/' | Out-Null
    }
    if ($LASTEXITCODE -eq 0) { $pagesConfigured = $true }
  }
}

Write-Host ""
Write-Host "Code publié avec succès." -ForegroundColor Green

if ($pagesConfigured) {
  Write-Host "GitHub Pages est configuré sur la branche main, dossier racine." -ForegroundColor Green
  Write-Host "Le site sera disponible dans quelques minutes : $pagesUrl" -ForegroundColor Green
} else {
  $settingsUrl = "$($repoInfo.WebUrl)/settings/pages"
  Write-Host "Il reste un réglage à faire une seule fois sur GitHub :" -ForegroundColor Yellow
  Write-Host "  1. Ouvre $settingsUrl"
  Write-Host "  2. Source : Deploy from a branch"
  Write-Host "  3. Branche : main"
  Write-Host "  4. Dossier : / (root), puis Save"
  Write-Host "Le site sera ensuite disponible ici : $pagesUrl"
}
