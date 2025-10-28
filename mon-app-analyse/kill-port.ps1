$port = 3012

# Trouver tous les processus utilisant le port
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Arrêt des processus sur le port $port..."
    foreach ($processId in $processes) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Processus $processId arrêté"
        } catch {
            # Ignorer les erreurs si le processus n'existe plus
        }
    }
    Start-Sleep -Seconds 1
}

Write-Host "Port $port libéré"
