# Emit the available PLAYBACK devices as a JSON array for the Property Inspector dropdowns.
# Each item: { name, id, default }. Always emits a JSON array (even for 0 or 1 device).
Import-Module AudioDeviceCmdlets -ErrorAction SilentlyContinue
$play = @(Get-AudioDevice -List | Where-Object { $_.Type -eq 'Playback' })
$items = @(foreach ($d in $play) {
  [pscustomobject]@{ name = $d.Name; id = $d.ID; default = [bool]$d.Default }
})
# ConvertTo-Json collapses a single-element array to an object; force array form.
if     ($items.Count -eq 0) { '[]' }
elseif ($items.Count -eq 1) { '[' + ($items[0] | ConvertTo-Json -Compress) + ']' }
else                        { $items | ConvertTo-Json -Compress }
