# streamdeck-audioswap

> Elgato **Stream Deck+** dial plugin (`com.welsh.audioswap`) — **press to swap the Windows default
> audio output** between two devices, **rotate for master volume**. Optionally pins a chosen app
> (e.g. Discord) to follow the swap.

A no-build, raw-WebSocket Stream Deck plugin (Node 24). The two device names and the optional pinned
app are **configurable** (Property Inspector or `config.json`), so anyone can use it.

> This was split out of the `streamdeck-cameradials` plugin's "Audio Output" dial action.

## What it does
- **Push** → toggle the Windows default playback device between **Device A** and **Device B** (matched
  by name fragment, partial & case-insensitive — IDs drift across reboots, names don't).
- **Rotate** → Windows master volume up/down (`vol.exe` sends real `VK_VOLUME` keys, so the native
  Windows volume slider appears).
- **Optional** → pin an app (e.g. `Discord.exe`) to the same device via SoundVolumeView, so per-app
  routing follows the swap. The dial LCD shows the current device.

## Install
1. Copy the `com.welsh.audioswap.sdPlugin` folder into
   `%APPDATA%\Elgato\StreamDeck\Plugins\` and restart the Stream Deck app.
   (No `npm install` / build step — Node 24 ships a global `WebSocket`.)
2. Add the **Audio Output** action to a Stream Deck+ dial.
3. Configure it (below) and install the dependencies.

## Configure
Two ways — pick either (Property Inspector wins if both are set):

### A. Property Inspector (recommended)
Select the dial in the Stream Deck app and fill in:
- **Device A name** / **Device B name** — fragments of your two playback device names
  (e.g. `Shure MV7`, `M28U`).
- **Pin app** (optional) — an executable name like `Discord.exe`, or leave empty.

### B. config.json
Copy `com.welsh.audioswap.sdPlugin/config.json.example` to `config.json` in the same folder:
```json
{
  "deviceA": "Shure MV7",
  "deviceB": "M28U",
  "pinApp": "Discord.exe"
}
```
`config.json` is gitignored. Tip: run `Get-AudioDevice -List` (after installing AudioDeviceCmdlets)
to see your exact playback device names.

## Dependencies
- **AudioDeviceCmdlets** PowerShell module — does the actual device switching:
  ```powershell
  Install-Module -Name AudioDeviceCmdlets -Scope CurrentUser
  ```
- **SoundVolumeView.exe** (NirSoft) — **only** needed if you set a pinned app. Download from
  <https://www.nirsoft.net/utils/sound_volume_view.html> and place `SoundVolumeView.exe` in
  `com.welsh.audioswap.sdPlugin/scripts/`. It is **not** vendored here (third-party license) and is
  gitignored. For the pin to take effect, set the app's own Output Device to **Default** in Windows
  Sound settings.
- `vol.exe` (master volume helper) **is** bundled. Source is `scripts/vol.cs`; rebuild with
  `csc vol.cs` if you ever need to.
- Windows 10/11, Stream Deck software 6.4+, a Stream Deck+ (encoder/dial hardware).

## ⚠️ Before making this repo public
This repo is **private** for now. The working tree is de-personalized (real device names live in the
gitignored `config.json`; `config.json.example` ships placeholders), and the seed script's hard-coded
personal device-endpoint ID has been removed. But earlier **git history still contains that personal
device-endpoint ID**. Before going public:
- **Scrub history** (e.g. `git filter-repo`) to purge it, **or**
- **Re-init** a fresh repo from the current tree (drop history) and re-create the remote.

Then audit once more before flipping visibility.

## Layout
- `com.welsh.audioswap.sdPlugin/plugin.js` — config load + swap/volume logic
- `com.welsh.audioswap.sdPlugin/manifest.json` — the Audio Output encoder action
- `com.welsh.audioswap.sdPlugin/pi/audio.html` — Property Inspector (settings UI)
- `com.welsh.audioswap.sdPlugin/config.json.example` — config template
- `com.welsh.audioswap.sdPlugin/scripts/audio-swap.ps1` — toggle default device + optional app pin
- `com.welsh.audioswap.sdPlugin/scripts/audio-current.ps1` — report the current device
- `com.welsh.audioswap.sdPlugin/scripts/vol.exe` (+ `vol.cs`) — master-volume key helper

## Related
- **[streamdeck-cameradials](https://github.com/brendanwelsh/streamdeck-cameradials)** — the UniFi
  Protect camera-scroller sibling this was split from.
- See [DESIGN.md](DESIGN.md) for the original split/extraction notes.
