param(
  [Parameter(Mandatory=$true)][string]$DeviceA,
  [Parameter(Mandatory=$true)][string]$DeviceB,
  [string]$PinApp = ''
)
# Toggle the Windows DEFAULT playback device between Device A and Device B.
# Devices are matched by NAME (partial, case-insensitive) because device IDs drift across reboots /
# driver updates. If currently on A -> switch to B, otherwise -> A.
# Swapping the Windows default also moves any app whose output is set to "Default".
Import-Module AudioDeviceCmdlets -ErrorAction Stop
$play = Get-AudioDevice -List | Where-Object { $_.Type -eq 'Playback' }
$cur  = ($play | Where-Object { $_.Default }).Name
function Find($pat) { $play | Where-Object { $_.Name -like "*$pat*" } | Select-Object -First 1 }

if ($cur -like "*$DeviceA*") { $target = Find $DeviceB } else { $target = Find $DeviceA }

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
else { "no target device found (cur=$cur)" }
