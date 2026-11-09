# Installe une version publiee du CLI Yadra (GitHub Release ou tarball local).
#
# Usage :
#   .\scripts\install-yadra-version.ps1 [version] [options]
#   .\scripts\install-yadra-version.cmd 0.1.12
#
# Exemples :
#   .\scripts\install-yadra-version.ps1                 # derniere release yadra-cli-v*
#   .\scripts\install-yadra-version.ps1 0.1.12
#   .\scripts\install-yadra-version.ps1 latest
#   .\scripts\install-yadra-version.ps1 -List
#   .\scripts\install-yadra-version.ps1 0.1.12 -Local   # tgz deja package dans cli\
#
# Options :
#   -List / --list          Liste les releases CLI GitHub disponibles
#   -Local / --local        Installe le .tgz local (cli\yadral-yadra-<ver>.tgz)
#   -Prefix / --prefix DIR  Prefixe npm (sinon installation globale)
#   -DryRun / --dry-run     Affiche les etapes sans installer
#
# Prerequis : Node >= 18, npm. Pour GitHub : gh (recommande, depot prive) ou HTTPS.

param(
  [Parameter(Position = 0)]
  [string]$Version = "",
  [switch]$List,
  [switch]$Local,
  [string]$Prefix = "",
  [switch]$DryRun,
  [Alias("h")]
  [switch]$Help,
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Remaining = @()
)

$ErrorActionPreference = "Stop"
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
  # ignore on newer runtimes
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path (Join-Path $ScriptDir "..\yadra\cli")) {
  $Root = (Resolve-Path (Join-Path $ScriptDir "..\yadra")).Path
} else {
  $Root = (Resolve-Path (Join-Path $ScriptDir "..")).Path
}
$Cli = Join-Path $Root "cli"
$Repo = if ($env:YADRA_GH_REPO) { $env:YADRA_GH_REPO } else { "yadral/yadra" }
$ScopedTgzBase = "yadral-yadra"
$TagPrefix = "yadra-cli-v"

function Show-Usage {
  param([int]$Code = 0)
  Get-Content -LiteralPath $PSCommandPath -TotalCount 21 | Select-Object -Skip 1
  exit $Code
}

function Write-Fail {
  param([string]$Message)
  Write-Host $Message -ForegroundColor Red
  exit 1
}

function Test-HasCommand {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Maybe {
  if ($DryRun) {
    Write-Host ("[dry-run] " + ($args -join " "))
    return
  }
  & $args[0] @($args[1..($args.Length - 1)])
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

function Get-NormalizedVersion {
  param([string]$Raw)
  if ($Raw.StartsWith($TagPrefix)) { $Raw = $Raw.Substring($TagPrefix.Length) }
  if ($Raw.StartsWith("v") -and $Raw -match '^v\d') { $Raw = $Raw.Substring(1) }
  return $Raw
}

function Get-GitHubJson {
  param([string]$Uri)
  $headers = @{ "User-Agent" = "yadra-install-yadra-version" }
  if ($env:GITHUB_TOKEN) {
    $headers["Authorization"] = "Bearer $($env:GITHUB_TOKEN)"
  }
  return Invoke-RestMethod -Uri $Uri -Headers $headers
}

function Show-Releases {
  if (Test-HasCommand "gh") {
    & gh release list --repo $Repo --limit 50
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    return
  }
  $releases = Get-GitHubJson "https://api.github.com/repos/$Repo/releases"
  if ($releases -isnot [System.Array] -and $null -ne $releases) {
    $releases = @($releases)
  }
  foreach ($r in $releases) {
    $tag = [string]$r.tag_name
    if (-not $tag.StartsWith($TagPrefix)) { continue }
    $title = if ($r.name) { $r.name } else { $tag }
    Write-Host ("{0}`t{1}`t{2}" -f $title, $tag, $r.published_at)
  }
}

function Get-LatestVersion {
  if (Test-HasCommand "gh") {
    $json = & gh release list --repo $Repo --limit 50 --json tagName,isDraft,isPrerelease | Out-String
    if ($LASTEXITCODE -ne 0) { throw "gh release list a echoue." }
    $rows = $json | ConvertFrom-Json
    $hit = $rows | Where-Object {
      -not $_.isDraft -and -not $_.isPrerelease -and ([string]$_.tagName).StartsWith($TagPrefix)
    } | Select-Object -First 1
    if (-not $hit) { throw "aucune release $TagPrefix*" }
    return ([string]$hit.tagName).Replace($TagPrefix, "")
  }
  $releases = Get-GitHubJson "https://api.github.com/repos/$Repo/releases"
  if ($releases -isnot [System.Array] -and $null -ne $releases) {
    $releases = @($releases)
  }
  $hit = $releases | Where-Object {
    -not $_.draft -and -not $_.prerelease -and ([string]$_.tag_name).StartsWith($TagPrefix)
  } | Select-Object -First 1
  if (-not $hit) { throw "aucune release $TagPrefix*" }
  return ([string]$hit.tag_name).Replace($TagPrefix, "")
}

$argv = @($Remaining)
$i = 0
while ($i -lt $argv.Count) {
  $a = [string]$argv[$i]
  switch -Regex ($a) {
    '^(--help|-h|/h|\?)$' { Show-Usage 0 }
    '^--dry-run$' { $DryRun = $true }
    '^--list$' { $List = $true }
    '^--local$' { $Local = $true }
    '^--prefix$' {
      if (($i + 1) -ge $argv.Count -or ([string]$argv[$i + 1]).StartsWith("-")) {
        Write-Fail "--prefix attend un repertoire (ex. --prefix C:\npm)."
      }
      $i++
      $Prefix = [string]$argv[$i]
    }
    '^--prefix=' {
      $Prefix = $a.Substring("--prefix=".Length)
      if (-not $Prefix) {
        Write-Fail "--prefix attend un repertoire."
      }
    }
    '^-' {
      Write-Host "Option inconnue: $a" -ForegroundColor Red
      Show-Usage 1
    }
    default {
      if ($Version) {
        Write-Fail "Une seule version attendue: $a"
      }
      $Version = $a
    }
  }
  $i++
}

if ($Help) { Show-Usage 0 }

if ($List) {
  Write-Host "==> Releases CLI ($Repo)"
  Show-Releases
  exit 0
}

if (-not $Version -or $Version -eq "latest") {
  if ($Local -and -not $Version) {
    if (-not (Test-HasCommand "node")) {
      Write-Fail "Node.js >= 18 est requis."
    }
    $pkgPath = (Join-Path $Cli "package.json").Replace("\", "/")
    $Version = (& node -p "require('$pkgPath').version").Trim()
    Write-Host "==> --local sans version : package.json -> $Version"
  } else {
    Write-Host "==> Resolution de la derniere release ${TagPrefix}* ($Repo)"
    try {
      $Version = Get-LatestVersion
    } catch {
      Write-Fail "Impossible de trouver une release ${TagPrefix}*. Utilise --list. $_"
    }
  }
}

$Version = Get-NormalizedVersion $Version
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
  Write-Fail "Version invalide (attendu semver X.Y.Z, latest, ou ${TagPrefix}X.Y.Z): $Version"
}

$Tag = "$TagPrefix$Version"
$Asset = "$ScopedTgzBase-$Version.tgz"
$LocalTgz = Join-Path $Cli $Asset
$TmpDir = $null
$Tgz = $null

Write-Host "==> Yadra CLI install $Version (tag $Tag)"

try {
  if ($Local) {
    $Tgz = $LocalTgz
    Write-Host "    source: $Tgz"
    if (-not (Test-Path -LiteralPath $LocalTgz)) {
      Write-Host "Tarball local introuvable: $LocalTgz" -ForegroundColor Red
      Write-Host "Lance d'abord: .\scripts\release-yadra-cli.sh $Version --no-commit" -ForegroundColor Yellow
      Write-Host "ou: cd cli ; npm run release:pack" -ForegroundColor Yellow
      if (-not $DryRun) { exit 1 }
    }
  } else {
    $TmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("yadra-cli-install-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $TmpDir | Out-Null
    $Tgz = Join-Path $TmpDir $Asset
    $Url = "https://github.com/$Repo/releases/download/$Tag/$Asset"
    Write-Host "    source: $Url"
    if ($DryRun) {
      Write-Host "[dry-run] download $Asset"
    } elseif (Test-HasCommand "gh") {
      & gh release download $Tag --repo $Repo --pattern $Asset --dir $TmpDir
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } else {
      try {
        Invoke-WebRequest -Uri $Url -OutFile $Tgz -UseBasicParsing
      } catch {
        Write-Fail "Telechargement echoue. Depot prive ? Installe gh et lance: gh auth login"
      }
    }
  }

  if (-not $DryRun -and -not (Test-Path -LiteralPath $Tgz)) {
    Write-Fail "Tarball introuvable: $Tgz"
  }

  if (-not (Test-HasCommand "npm")) {
    Write-Fail "npm est requis (Node.js >= 18)."
  }

  $npmArgs = @("install", "-g")
  if ($Prefix) { $npmArgs += @("--prefix", $Prefix) }
  $npmArgs += $Tgz
  Invoke-Maybe npm @npmArgs

  if ($Prefix) {
    Write-Host "OK - yadra $Version (PATH: $(Join-Path $Prefix 'bin'))"
  } else {
    Write-Host "OK - yadra $Version"
  }

  if (-not $DryRun -and (Test-HasCommand "yadra")) {
    try { & yadra version } catch { }
  }
} finally {
  if ($TmpDir -and (Test-Path -LiteralPath $TmpDir)) {
    Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
