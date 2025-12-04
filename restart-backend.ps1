# Restart Backend Script
Write-Host "Stopping old backend processes..." -ForegroundColor Yellow

# Stop all node processes running server.cjs
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        if ($cmdLine -like "*server.cjs*") {
            Write-Host "Stopping process $($_.Id)..." -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force
        }
    }
    catch {
        # Ignore errors
    }
}

Start-Sleep -Seconds 2
Write-Host "Old processes stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting backend with fixed code..." -ForegroundColor Cyan

# Start new process
Start-Process -FilePath "node" -ArgumentList "backend/server.cjs" -WorkingDirectory $PWD -NoNewWindow

Start-Sleep -Seconds 3
Write-Host "Backend restarted successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now test by generating an image." -ForegroundColor Yellow
Write-Host "You should see the counter change from 0/3 to 1/3!" -ForegroundColor Green
