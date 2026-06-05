# DuckDNS Dynamic IP Update Script for NARI
# Save your subdomain and token here.
# Run this script every 5-10 minutes via Windows Task Scheduler.

$Domain = "nari-home"  # Replace with your DuckDNS subdomain name (excluding .duckdns.org)
$Token = "c9db1f2f-e12d-421a-a687-73e4dcbcc029"  # Replace with your actual DuckDNS Token from the website

$LogPath = "$PSScriptRoot\duckdns_update.log"
$Url = "https://www.duckdns.org/update?domains=$Domain&token=$Token"

try {
    # Call DuckDNS update endpoint
    $Result = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Result -eq "OK") {
        Write-Output "[$Timestamp] SUCCESS: DuckDNS IP updated to current public IP." | Out-File -FilePath $LogPath -Append
    } else {
        Write-Output "[$Timestamp] ERROR: DuckDNS update failed. Response: $Result" | Out-File -FilePath $LogPath -Append
    }
} catch {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "[$Timestamp] ERROR: Network exception occurred. Details: $_" | Out-File -FilePath $LogPath -Append
}
