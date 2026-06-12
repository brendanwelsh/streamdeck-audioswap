# streamdeck-audioswap

> Elgato **Stream Deck+** dial plugin (`com.welsh.audioswap`) — **press to swap the Windows default
> audio output** between two devices, **rotate for master volume**. Optionally pins a chosen app
> (e.g. Discord) to follow the swap.

A no-build, raw-WebSocket Stream Deck plugin (Node 24). The two device names and the optional pinned
app are **configurable** (Property Inspector or `config.json`), so anyone can use it.

> This was split out of the `streamdeck-cameradials` plugin's "Audio Output" dial action.

## What it does
- **Push** (or tap the LCD) → toggle the Windows default playback device between **Device A** and
  **Device B**. You pick the two devices from a **dropdown** of your real playback devices; the plugin
  targets the exact endpoint by ID and falls back to name matching if the ID ever drifts. This also
  cleanly handles **duplicate device names** (e.g. a monitor that exposes several identically-named
  HDMI/DP audio endpoints — only one of which actually plays sound).
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
Select the dial in the Stream Deck app and:
- **Device A** / **Device B** — choose each from the **dropdown** of your playback devices. The dropdown
  reads your live devices (hit **↻ Refresh** after plugging/unplugging). If a name appears more than
  once it's shown as `#1 / #2 / #3` — pick the one that actually plays sound.
- **Pin app** (optional) — an executable name like `Discord.exe`, or leave empty.

### B. config.json
Copy `com.welsh.audioswap.sdPlugin/config.json.example` to `config.json` in the same folder:
```json
{
  "deviceA": "Shure MV7",
  "deviceB": "M28U",
  "deviceAId": "",
  "deviceBId": "",
  "pinApp": "Discord.exe"
}
```
`deviceA`/`deviceB` are name fragments (partial, case-insensitive). `deviceAId`/`deviceBId` are
optional exact endpoint IDs that disambiguate duplicate names — normally you just pick these from the
dropdown instead of writing them by hand. `config.json` is gitignored. Tip: run `Get-AudioDevice -List`
(after installing AudioDeviceCmdlets) to see your exact playback device names and IDs.

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

## Layout
- `com.welsh.audioswap.sdPlugin/plugin.js` — config load + swap/volume logic
- `com.welsh.audioswap.sdPlugin/manifest.json` — the Audio Output encoder action
- `com.welsh.audioswap.sdPlugin/pi/audio.html` — Property Inspector (settings UI), built on
  Elgato's [sdpi-components](https://sdpi-components.dev) for the native Stream Deck look
- `com.welsh.audioswap.sdPlugin/pi/sdpi-components.js` — vendored sdpi-components library (BSD-3)
- `com.welsh.audioswap.sdPlugin/config.json.example` — config template
- `com.welsh.audioswap.sdPlugin/scripts/audio-swap.ps1` — toggle default device (ID-preferred) + optional app pin
- `com.welsh.audioswap.sdPlugin/scripts/audio-current.ps1` — report the current device
- `com.welsh.audioswap.sdPlugin/scripts/audio-list.ps1` — enumerate playback devices for the dropdown
- `com.welsh.audioswap.sdPlugin/scripts/vol.exe` (+ `vol.cs`) — master-volume key helper
- `tools/make-icons.py` — regenerates the icon set (speaker + swap arrows) via pycairo

## Related
- **[streamdeck-cameradials](https://github.com/brendanwelsh/streamdeck-cameradials)** — the UniFi
  Protect camera-scroller sibling this was split from.
- See [DESIGN.md](DESIGN.md) for the original split/extraction notes.
