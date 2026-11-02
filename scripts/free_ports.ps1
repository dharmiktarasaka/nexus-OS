$ports = @(5000, 5001, 5002, 5050, 5180, 5182)

Write-Host "Freeing Nexus OS platform ports ($($ports -join ', '))..."

foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -and $pidToKill -ne $PID) {
                    Write-Host "[Port Manager] Found active process $pidToKill on port $port. Terminating..."
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # Ignore errors
    }
}

Write-Host "All ports cleaned and ready."

