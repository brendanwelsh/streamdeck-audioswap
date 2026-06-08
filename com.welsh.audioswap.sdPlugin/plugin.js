"use strict";
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const DIR = __dirname;

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }
const PORT = arg("-port");
const PLUGIN_UUID = arg("-pluginUUID");
const REGISTER_EVENT = arg("-registerEvent");

// ---------------------------------------------------------------------------
// Config. Source of truth (highest priority first):
//   1. Per-action Stream Deck settings (set in the Property Inspector)
//   2. config.json next to this file
//   3. built-in safe defaults (empty -> dial shows "SET UP")
// deviceA / deviceB are name fragments matched against the playback device list
// (partial, case-insensitive). pinApp is optional (e.g. "Discord.exe"); empty = don't pin.
// ---------------------------------------------------------------------------
let DEVICE_A = "", DEVICE_B = "", PIN_APP = "";

function readFileConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, "config.json"), "utf8")); }
  catch (e) { return {}; }
}
function applyConfig(settings) {
  const file = readFileConfig();
  DEVICE_A = ((settings && settings.deviceA) || file.deviceA || "").trim();
  DEVICE_B = ((settings && settings.deviceB) || file.deviceB || "").trim();
  PIN_APP  = ((settings && settings.pinApp)  || file.pinApp  || "").trim();
}
const CONFIGURED = () => DEVICE_A && DEVICE_B;

const SWAP_PS = path.join(DIR, "scripts", "audio-swap.ps1");
const CUR_PS = path.join(DIR, "scripts", "audio-current.ps1");
const VOLEXE = path.join(DIR, "scripts", "vol.exe");

function dataUri(file) {
  try { return "data:image/png;base64," + fs.readFileSync(path.join(DIR, file)).toString("base64"); }
  catch (e) { return ""; }
}
const ICON_AUD = dataUri("imgs/speaker.png");

const AUDIO = "com.welsh.audioswap.output";

let audioLabel = "AUDIO";
const audioCtx = new Set();
let ws;

function send(o) { try { ws.send(JSON.stringify(o)); } catch (e) {} }
function setLayout(ctx) { send({ event: "setFeedbackLayout", context: ctx, payload: { layout: "layouts/audiodial.json" } }); }
function setDial(ctx, name, sub, icon) { send({ event: "setFeedback", context: ctx, payload: { name, sub, icon } }); }
function renderAudio() {
  if (!CONFIGURED()) { audioCtx.forEach(c => setDial(c, "SET UP", "open settings", ICON_AUD)); return; }
  audioCtx.forEach(c => setDial(c, audioLabel, "output", ICON_AUD));
}

// map a full device name to the short configured label that matched it
function labelFor(name) {
  const u = (name || "").toLowerCase();
  if (DEVICE_A && u.includes(DEVICE_A.toLowerCase())) return DEVICE_A.toUpperCase();
  if (DEVICE_B && u.includes(DEVICE_B.toLowerCase())) return DEVICE_B.toUpperCase();
  return (name || "").toUpperCase().slice(0, 14);
}
function q(s) { return '"' + String(s).replace(/"/g, '') + '"'; }
function psSwap() { return 'powershell -NoProfile -ExecutionPolicy Bypass -File ' + q(SWAP_PS) +
  " -DeviceA " + q(DEVICE_A) + " -DeviceB " + q(DEVICE_B) + " -PinApp " + q(PIN_APP); }

function swapAudio() {
  if (!CONFIGURED()) return;
  exec(psSwap(), (e, out) => {
    const m = /->\s*(.+)\s*$/.exec((out || "").trim());
    if (m) { audioLabel = labelFor(m[1]); renderAudio(); }
  });
}
function queryAudio() {
  exec('powershell -NoProfile -ExecutionPolicy Bypass -File ' + q(CUR_PS), (e, out) => {
    const name = (out || "").trim();
    if (name) { audioLabel = labelFor(name); renderAudio(); }
  });
}

// rotate = Windows master volume (debounced; vol.exe sends real VK_VOLUME keys -> native volume slider)
let volTicks = 0, volTimer = null;
function adjustVolume(t) {
  volTicks += t;
  if (volTimer) clearTimeout(volTimer);
  volTimer = setTimeout(() => {
    const n = volTicks; volTicks = 0; volTimer = null;
    if (!n) return;
    const dir = n > 0 ? "up" : "down";
    try { exec(q(VOLEXE) + " " + dir + " " + Math.min(Math.abs(n), 15), () => {}); } catch (e) {}
  }, 80);
}

applyConfig(null);

ws = new WebSocket("ws://127.0.0.1:" + PORT);
ws.addEventListener("open", () => send({ event: REGISTER_EVENT, uuid: PLUGIN_UUID }));
ws.addEventListener("message", (ev) => {
  let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
  const a = m.action, ctx = m.context;
  const settings = m.payload && m.payload.settings;
  switch (m.event) {
    case "willAppear":
      if (a === AUDIO) { applyConfig(settings); setLayout(ctx); audioCtx.add(ctx); renderAudio(); queryAudio(); }
      break;
    case "didReceiveSettings":
      if (a === AUDIO) { applyConfig(settings); renderAudio(); queryAudio(); }
      break;
    case "willDisappear":
      audioCtx.delete(ctx);
      break;
    case "dialRotate":
      if (a === AUDIO) {
        const t = m.payload && m.payload.ticks ? m.payload.ticks : 0;
        adjustVolume(t);
      }
      break;
    case "dialDown":
      if (a === AUDIO) swapAudio();
      break;
  }
});
