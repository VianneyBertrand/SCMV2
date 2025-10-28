# Kill any process using port 3012
$port = 3012
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($processId in $processes) {
        Write-Host "Killing process $processId on port $port..."
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port $port is now free"
} else {
    Write-Host "Port $port is already free"
}
