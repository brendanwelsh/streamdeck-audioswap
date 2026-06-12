param(
  [string]$DeviceA = '',
  [string]$DeviceB = '',
  [string]$PinApp = '',
  [string]$DeviceAId = '',
  [string]$DeviceBId = ''
)
# Each device is identified by its exact endpoint ID (preferred) and/or a name fragment.
# Toggle the Windows DEFAULT playback device between Device A and Device B.
# Targeting prefers the exact endpoint ID (handles duplicate device NAMES, e.g. a monitor that
# exposes several identically-named HDMI/DP audio endpoints) and falls back to a partial,
# case-insensitive NAME match when no ID is given or the ID has drifted (IDs can change across
# driver reinstalls). If currently on A -> switch to B, otherwise -> A.
# Swapping the Windows default also moves any app whose output is set to "Default".
Import-Module AudioDeviceCmdlets -ErrorAction Stop
$play = Get-AudioDevice -List | Where-Object { $_.Type -eq 'Playback' }
$cur  = $play | Where-Object { $_.Default } | Select-Object -First 1

function Resolve($id, $name) {
  if ($id) { $byId = $play | Where-Object { $_.ID -eq $id } | Select-Object -First 1; if ($byId) { return $byId } }
  if ($name) { return $play | Where-Object { $_.Name -like "*$name*" } | Select-Object -First 1 }
  return $null
}
$a = Resolve $DeviceAId $DeviceA
$b = Resolve $DeviceBId $DeviceB

# Are we currently on A? (match by ID first, then by name fragment)
$onA = $false
if ($cur) {
  if     ($a -and $cur.ID -eq $a.ID)      { $onA = $true }
  elseif ($DeviceA -and $cur.Name -like "*$DeviceA*") { $onA = $true }
}
if ($onA) { $target = $b } else { $target = $a }

if ($target) {
    Set-AudioDevice -ID $target.ID | Out-Null
    # Optionally PIN a specific app's output to the same device (Windows per-app routing), so it
    # follows the swap and stays immune to default-device drift. Requires the app's own Output Device
    # to be set to "Default". Needs SoundVolumeView.exe placed next to this script (see README).
    if ($PinApp) {
        $svv = Join-Path $PSScriptRoot 'SoundVolumeView.exe'
        if (Test-Path $svv) { & $svv /SetAppDefault $target.ID all $PinApp 2>$null }
    }
    "switched -> $($target.Name)"
}
else { "no target device found (cur=$($cur.Name))" }
