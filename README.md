# streamdeck-audioswap

> Elgato **Stream Deck+** dial plugin (`com.welsh.audioswap`) — an **audio output switcher**:
> **rotate** the dial to scroll through your Windows playback devices, **push** to make the
> highlighted one the default output.

A no-build, raw-WebSocket Stream Deck plugin (Node 24). There's nothing to configure — the device
list is read live from Windows.

> This was split out of the `streamdeck-cameradials` plugin's "Audio Output" dial action.

## What it does
- **Rotate** → scroll the highlight through your live playback devices. The dial LCD shows the
  highlighted device name; the current default is marked **● current**. Rotating doesn't change
  anything yet — it just moves the highlight (and wraps around the ends).
- **Push** (or tap the LCD) → make the highlighted device the **Windows default output**. This sets
  both the default device *and* the default **communication** device, so apps whose output is set to
  "Default" follow the switch (see the Discord note below).
- Duplicate device names (e.g. a monitor that exposes several identically-named HDMI/DP audio
  endpoints) are each their own entry — scroll to the one that actually plays sound and push.

## Install
1. Copy the `com.welsh.audioswap.sdPlugin` folder into
   `%APPDATA%\Elgato\StreamDeck\Plugins\` and restart the Stream Deck app.
   (No `npm install` / build step — Node 24 ships a global `WebSocket`.)
2. Add the **Audio Output** action to a Stream Deck+ dial.
3. Install the one dependency (below). That's it — no per-action setup.

## Discord (and other "Default"-following apps)
Discord **can't be routed per-app** from Windows — it manages its own output stream and follows the
Windows default *communication* device. So don't try to route it; instead let it follow the swap:

- In **Discord → User Settings → Voice & Video → Output Device**, choose **Default**.

Now pushing the dial moves Discord's audio along with everything else, automatically. The same trick
works for any app that offers a "Default" output option. (See [DESIGN.md](DESIGN.md) for why per-app
routing was dropped.)

## Dependencies
- **AudioDeviceCmdlets** PowerShell module — does the device enumeration and switching:
  ```powershell
  Install-Module -Name AudioDeviceCmdlets -Scope CurrentUser
  ```
- Windows 10/11, Stream Deck software 6.4+, a Stream Deck+ (encoder/dial hardware).

## Layout
- `com.welsh.audioswap.sdPlugin/plugin.js` — device-list cache, scroll/highlight + push-to-set logic
- `com.welsh.audioswap.sdPlugin/manifest.json` — the Audio Output encoder action
- `com.welsh.audioswap.sdPlugin/pi/audio.html` — Property Inspector (usage + Discord note; no settings),
  built on Elgato's [sdpi-components](https://sdpi-components.dev) for the native Stream Deck look
- `com.welsh.audioswap.sdPlugin/pi/sdpi-components.js` — vendored sdpi-components library (BSD-3)
- `com.welsh.audioswap.sdPlugin/scripts/audio-list.ps1` — enumerate playback devices (JSON) for the scroller
- `com.welsh.audioswap.sdPlugin/scripts/audio-set.ps1` — set the default output (+ communication) by endpoint ID
- `tools/make-icons.py` — regenerates the icon set (speaker + swap arrows) via pycairo

## Related
- **[streamdeck-cameradials](https://github.com/brendanwelsh/streamdeck-cameradials)** — the UniFi
  Protect camera-scroller sibling this was split from.
- See [DESIGN.md](DESIGN.md) for the original split/extraction notes and the v2 switcher rework.
