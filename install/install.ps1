# install/install.ps1 — NoahLang installer for Windows
# Usage:
#   iwr -useb https://raw.githubusercontent.com/NoahKahenge/noahlang-debugger/main/install/install.ps1 | iex

$ErrorActionPreference = "Stop"
$Version = "2.0.2"
$Repo = "NoahKahenge/noahlang-debugger"

Write-Host ""
Write-Host "  NoahLang installer" -ForegroundColor Cyan
Write-Host "  ──────────────────" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------
# 1. Check for Node.js
# ------------------------------------------------------------------
$NodeOk = $false
try {
    $nodeVersion = (node --version) 2>$null
    if ($nodeVersion -match '^v(\d+)\.') {
        $major = [int]$matches[1]
        if ($major -ge 16) {
            Write-Host "  ✓ Node.js $nodeVersion found" -ForegroundColor Green
            $NodeOk = $true
        } else {
            Write-Host "  ⚠ Node.js $nodeVersion is too old (need 16+)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ⚠ Node.js not found" -ForegroundColor Yellow
}

# ------------------------------------------------------------------
# 2. Install Node.js if needed
# ------------------------------------------------------------------
if (-not $NodeOk) {
    Write-Host ""
    Write-Host "  Installing Node.js..." -ForegroundColor Cyan
    Write-Host ""

    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $nodeVersion = "20.11.0"
    $nodeUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-$arch.msi"
    $installer = Join-Path $env:TEMP "node-installer.msi"

    Write-Host "  Downloading $nodeUrl..."
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installer -UseBasicParsing
    } catch {
        Write-Host "  ❌ Failed to download Node.js installer." -ForegroundColor Red
        Write-Host "     Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "  Running Node.js installer (this may take a minute)..."
    try {
        Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installer`" /quiet /norestart"
    } catch {
        Write-Host "  ❌ Node.js installation failed." -ForegroundColor Red
        exit 1
    }

    Remove-Item $installer -Force -ErrorAction SilentlyContinue

    # Refresh PATH so node is found
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    try {
        $nodeVersion = (node --version) 2>$null
        Write-Host "  ✓ Node.js $nodeVersion installed" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Node.js installation failed." -ForegroundColor Red
        Write-Host "     Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# ------------------------------------------------------------------
# 3. Install noahlang
# ------------------------------------------------------------------
Write-Host ""
Write-Host "  Installing NoahLang..." -ForegroundColor Cyan
Write-Host ""

npm install -g noahlang

# ------------------------------------------------------------------
# 4. Verify
# ------------------------------------------------------------------
Write-Host ""

$noahFound = $false
try {
    $noahVersion = (noah --version) 2>$null
    if ($noahVersion) {
        Write-Host "  ✓ NoahLang installed" -ForegroundColor Green
        Write-Host "    $noahVersion"
        $noahFound = $true
    }
} catch {
    Write-Host "  ❌ Installation failed. Could not find 'noah' command." -ForegroundColor Red
    Write-Host "     Try running 'npm install -g noahlang' manually." -ForegroundColor Yellow
    exit 1
}

if (-not $noahFound) {
    Write-Host "  ❌ Could not verify NoahLang installation." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------
# 5. Done
# ------------------------------------------------------------------
Write-Host ""
Write-Host "  ────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Try it:"
Write-Host ""
Write-Host '    echo write "Hello, world!" > hello.noah'
Write-Host "    noah hello.noah"
Write-Host ""
Write-Host "  For web pages:"
Write-Host ""
Write-Host '    echo pull "Forge.noah" > site.noah'
Write-Host '    echo page("My Site") >> site.noah'
Write-Host '    echo head1("Welcome") >> site.noah'
Write-Host '    echo done() >> site.noah'
Write-Host '    echo serve(3000) >> site.noah'
Write-Host "    noah --watch site.noah"
Write-Host ""
Write-Host "  Documentation: https://github.com/$Repo"
Write-Host ""