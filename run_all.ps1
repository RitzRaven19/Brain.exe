param(
    [switch]$Stop,
    [switch]$SkipDbCheck
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$tmpDir = Join-Path $root ".tmp"
$stateFile = Join-Path $tmpDir "stack_processes.json"
$psExe = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"

function Ensure-TmpDir {
    if (-not (Test-Path $tmpDir)) {
        New-Item -ItemType Directory -Path $tmpDir | Out-Null
    }
}

function Stop-Stack {
    if (-not (Test-Path $stateFile)) {
        Write-Host "No running stack state file found at $stateFile"
        return
    }

    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    foreach ($proc in @($state.processes)) {
        if (-not $proc.id) { continue }
        try {
            $p = Get-Process -Id $proc.id -ErrorAction Stop
            Stop-Process -Id $p.Id -Force
            Write-Host "Stopped $($proc.name) (PID $($p.Id))"
        }
        catch {
            Write-Host "$($proc.name) already stopped (PID $($proc.id))"
        }
    }

    Remove-Item $stateFile -Force
    Write-Host "Stack stopped."
}

function Test-DbPort {
    try {
        $tcp = Test-NetConnection -ComputerName "127.0.0.1" -Port 5432 -WarningAction SilentlyContinue
        return [bool]$tcp.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

function Ensure-PostgresRunning {
    if (Test-DbPort) {
        Write-Host "PostgreSQL port 5432 is reachable."
        return
    }

    Write-Host "PostgreSQL port 5432 is not reachable. Attempting to start a PostgreSQL service..."
    $services = Get-Service | Where-Object { $_.Name -like "postgres*" -or $_.DisplayName -like "*PostgreSQL*" }
    $target = $services | Where-Object { $_.Status -ne "Running" } | Select-Object -First 1
    if (-not $target) {
        $target = $services | Select-Object -First 1
    }

    if ($target) {
        try {
            Start-Service -Name $target.Name
            Start-Sleep -Seconds 2
            Write-Host "Started service: $($target.Name)"
        }
        catch {
            Write-Host "Could not start service $($target.Name). You may need to run this terminal as Administrator."
        }
    }
    else {
        Write-Host "No PostgreSQL service found. Please start PostgreSQL manually."
    }

    if (-not (Test-DbPort)) {
        throw "Database is still not reachable on 127.0.0.1:5432. Start PostgreSQL first."
    }
}

function Start-Stack {
    Ensure-TmpDir

    if (-not $SkipDbCheck) {
        Ensure-PostgresRunning
    }

    $backendPy = Join-Path $root ".venv\Scripts\python.exe"
    if (-not (Test-Path $backendPy)) {
        throw "Python venv not found at $backendPy"
    }

    $frontendDir = Join-Path $root "frontend"
    if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
        throw "frontend/package.json not found."
    }

    $backendDir = Join-Path $root "backend"
    $backendCmd = "& '$backendPy' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
    $frontendCmd = "npm run dev"

    $backendProc = Start-Process -FilePath $psExe `
        -ArgumentList @("-NoExit", "-Command", $backendCmd) `
        -WorkingDirectory $backendDir `
        -PassThru

    $frontendProc = Start-Process -FilePath $psExe `
        -ArgumentList @("-NoExit", "-Command", $frontendCmd) `
        -WorkingDirectory $frontendDir `
        -PassThru

    $state = @{
        started_at = (Get-Date).ToString("s")
        processes  = @(
            @{ name = "backend"; id = $backendProc.Id },
            @{ name = "frontend"; id = $frontendProc.Id }
        )
    } | ConvertTo-Json -Depth 5
    Set-Content -Path $stateFile -Value $state

    Write-Host ""
    Write-Host "Stack started:"
    Write-Host "  Backend  : http://127.0.0.1:8000"
    Write-Host "  Frontend : http://127.0.0.1:8080"
    Write-Host ""
    Write-Host "To stop everything:"
    Write-Host "  .\run_all.ps1 -Stop"
}

if ($Stop) {
    Stop-Stack
}
else {
    Start-Stack
}
