# Design — streamdeck-audioswap

## Goal
A standalone Stream Deck+ encoder plugin for choosing the Windows default audio output — extracted
from the "Audio Output" action of `com.welsh.cameradials`.

## Behavior (v2 — output switcher)
- **Rotate** → scroll a highlight through the live playback-device list (wraps at the ends). Nothing
  is applied; the LCD just shows the highlighted device, with the active one marked "● current".
- **Push** (or tap the LCD) → set the highlighted device as the Windows default output.
- The device list is read live from Windows (`audio-list.ps1`), cached in the plugin, and refreshed
  on appear and after every switch. No configuration — there's nothing to set up.

## Why setting the default also sets the *communication* device
`audio-set.ps1` calls `Set-AudioDevice -ID` with no role switch, which sets **both** the default
device and the default **communication** device. That's deliberate: it's what makes "Default"-
following apps move with the swap (see the Discord note).

## Discord / per-app routing (why v1's app-pin was removed)
v1 had an optional app-pin that used SoundVolumeView's `/SetAppDefault` to route a named app (e.g.
`Discord.exe`) to the swapped device. It didn't reliably work, and the investigation showed why:

- **Discord ignores Windows per-application output routing.** It's Chromium/Electron: its audio
  render session is owned by a child "Chromium" process (not `Discord.exe`), and it (re)binds its
  WebRTC/WASAPI output stream to the endpoint *it* chose, so a per-app override doesn't stick.
- **Discord's "Default" output = the Windows default _communication_ device**, not the multimedia
  default — a second reason naive per-app routing misses.
- The v1 pin also swallowed errors (`2>$null`), so the failure was silent.

**Fix (shipped in v2):** drop per-app routing entirely. Just switch the system default — which
`Set-AudioDevice -ID` already applies to both the default *and* communication roles — and tell the
user to set Discord's own Output Device to **Default**. Then Discord follows the swap automatically.
This removed the SoundVolumeView dependency.

## What changed from v1 → v2
- Rotate: master volume → scroll outputs. (`vol.exe`/`vol.cs` removed — no more volume control.)
- Push: A/B toggle → set highlighted device. (`audio-swap.ps1` toggle replaced by `audio-set.ps1`.)
- Removed: per-app pin + SoundVolumeView, Device A/B config, `config.json`/`.example`,
  `audio-current.ps1` (current device now comes from `audio-list.ps1`'s `default` flag).
- Property Inspector: device dropdowns + pin field → a static usage/Discord note (no settings).

## Dependencies
- PowerShell module **AudioDeviceCmdlets** (`Install-Module AudioDeviceCmdlets`) — enumerate + switch.

## Notes
- No AI-assistant mentions in code or commits.
- Private repo. The working tree is de-personalized, but **git history still contains an old personal
  device-endpoint ID** (from the seed `audio-swap.ps1`) — scrub history or re-init from the current
  tree before going public.
