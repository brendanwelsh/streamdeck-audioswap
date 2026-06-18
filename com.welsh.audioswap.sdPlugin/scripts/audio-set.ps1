param([Parameter(Mandatory = $true)][string]$Id)
# Make the playback device with this exact endpoint ID the Windows default output.
# Set-AudioDevice with no role switch sets BOTH the default device AND the default
# *communication* device. That second part matters: apps whose own Output Device is
# "Default" (e.g. Discord, which follows the communication role) switch along with it.
# So a single call moves the system default + everything pinned to "Default" — no
# per-app routing needed. IDs come from audio-list.ps1, so a match should always exist.
Import-Module AudioDeviceCmdlets -ErrorAction Stop
$dev = Get-AudioDevice -List | Where-Object { $_.Type -eq 'Playback' -and $_.ID -eq $Id } | Select-Object -First 1
if ($dev) {
  Set-AudioDevice -ID $dev.ID | Out-Null
  "set -> $($dev.Name)"
}
else { "device not found: $Id" }
