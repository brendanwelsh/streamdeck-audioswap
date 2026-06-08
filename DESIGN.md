# Design — streamdeck-audioswap

## Goal
A standalone, configurable Stream Deck+ encoder plugin for swapping the Windows default audio output
and controlling volume — extracted from the "Audio Output" action of `com.welsh.cameradials`.

## Behavior
- **Push** → toggle the Windows default playback device between **Device A** and **Device B**
  (both user-configured by name; currently hard-wired to "Shure MV7" ↔ "M28U").
- **Rotate** → master volume up/down (via `scripts/vol.exe`, which sends real VK_VOLUME keys so the
  native Windows volume slider appears).
- **Optional** → pin a configured app (currently hard-wired "Discord.exe") to the same device via
  SoundVolumeView so per-app routing follows the swap.
- Dial LCD shows the current device name.

## Source to port
- `streamdeck-cameradials/com.welsh.cameradials.sdPlugin/plugin.js` — the `AUDIO` action
  (`swapAudio`, `queryAudio`, `adjustVolume`, render).
- `scripts/audio-swap.ps1` (toggle + Discord pin), `scripts/audio-current.ps1` (report current),
  `scripts/vol.exe` (+ `vol.cs`).

## Make it configurable (the point of this repo)
- **Device A / Device B names** → Stream Deck **Property Inspector** settings (preferred), or a
  documented `config.json`. No hard-coded "Shure MV7" / "M28U".
- **Pinned app** (optional) → configurable; empty = don't pin anything.
- Pass the configured values into `audio-swap.ps1` (parameters) instead of constants in the script.
- Keep it self-contained — bundle the scripts here; don't depend on an external StreamDeckScripts path.

## Dependencies (document in README)
- PowerShell module **AudioDeviceCmdlets** (`Install-Module AudioDeviceCmdlets`).
- **SoundVolumeView.exe** (NirSoft) — only needed for the optional Discord/app pin. Do NOT vendor it
  (license); document the download + where to place it.

## Notes
- Keep PRIVATE until ready: the seed `audio-swap.ps1` contains a specific device endpoint ID; remove
  personal device IDs before any public release, and scrub history if needed.
- No AI-assistant mentions in code or commits.
