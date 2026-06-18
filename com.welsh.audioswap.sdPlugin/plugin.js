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
// Output switcher. The dial is a scroller over the live Windows playback devices:
//   rotate  -> move the highlight through the device list (no change applied yet)
//   push    -> make the highlighted device the Windows default output
// Nothing to configure — the device list comes straight from Windows. Setting the
// default also sets the default *communication* device, so apps whose output is
// "Default" (e.g. Discord) follow the switch. See audio-set.ps1 / README.
// ---------------------------------------------------------------------------
const LIST_PS = path.join(DIR, "scripts", "audio-list.ps1");
const SET_PS = path.join(DIR, "scripts", "audio-set.ps1");

function dataUri(file) {
  try { return "data:image/png;base64," + fs.readFileSync(path.join(DIR, file)).toString("base64"); }
  catch (e) { return ""; }
}
const ICON_AUD = dataUri("imgs/speaker.png");

const AUDIO = "com.welsh.audioswap.output";

// Device model — one machine, shared across any number of dials.
let devices = [];          // [{ name, id, default }]
let currentId = "";        // endpoint ID of the active default output
const cursors = new Map(); // ctx -> highlighted index into devices
const audioCtx = new Set();
let ws;

function send(o) { try { ws.send(JSON.stringify(o)); } catch (e) {} }
function setLayout(ctx) { send({ event: "setFeedbackLayout", context: ctx, payload: { layout: "layouts/audiodial.json" } }); }
function setDial(ctx, name, sub, icon) { send({ event: "setFeedback", context: ctx, payload: { name, sub, icon } }); }

function q(s) { return '"' + String(s).replace(/"/g, '') + '"'; }
function psBase(file) { return 'powershell -NoProfile -ExecutionPolicy Bypass -File ' + q(file); }

// short, tidy label from a full device name: drop the " (driver…)" suffix, cap width
function cleanLabel(name) {
  const n = (name || "").trim();
  const i = n.indexOf(" (");
  return (i > 0 ? n.slice(0, i) : n).toUpperCase().slice(0, 14);
}

function currentIndex() {
  const i = devices.findIndex(d => d.id === currentId);
  return i >= 0 ? i : 0;
}
function cursorOf(ctx) {
  const c = cursors.get(ctx);
  return Number.isInteger(c) ? Math.min(c, Math.max(devices.length - 1, 0)) : currentIndex();
}

function renderDial(ctx) {
  if (!devices.length) { setDial(ctx, "NO DEVICES", "check audio", ICON_AUD); return; }
  const d = devices[cursorOf(ctx)];
  const sub = d.id === currentId ? "● current" : "press to set";
  setDial(ctx, cleanLabel(d.name), sub, ICON_AUD);
}
function renderAll() { audioCtx.forEach(renderDial); }

// Re-read the live playback devices, refresh the cached model, re-render every dial.
// Cursors are cleared so each dial parks on the current default at rest (mid-scroll
// state is local and short-lived, and we only refresh on appear / after a switch).
function refreshDevices(done) {
  exec(psBase(LIST_PS), (e, out) => {
    let list = [];
    try { list = JSON.parse((out || "").trim() || "[]"); } catch (_) {}
    devices = Array.isArray(list) ? list : [];
    const def = devices.find(d => d.default);
    currentId = def ? def.id : "";
    cursors.clear();
    renderAll();
    if (done) done();
  });
}

// rotate -> move the highlight (wraps around); applies nothing until pushed
function scroll(ctx, ticks) {
  if (!devices.length || !ticks) return;
  const len = devices.length;
  const idx = (((cursorOf(ctx) + ticks) % len) + len) % len;
  cursors.set(ctx, idx);
  renderDial(ctx);
}

// push -> set the highlighted device as the Windows default output
let lastApply = 0;
function applySelected(ctx) {
  if (!devices.length) return;
  const now = Date.now();
  if (now - lastApply < 350) return;   // debounce double-fire / rapid press
  lastApply = now;
  const d = devices[cursorOf(ctx)];
  if (!d) return;
  exec(psBase(SET_PS) + " -Id " + q(d.id), () => refreshDevices());
}

ws = new WebSocket("ws://127.0.0.1:" + PORT);
ws.addEventListener("open", () => send({ event: REGISTER_EVENT, uuid: PLUGIN_UUID }));
ws.addEventListener("message", (ev) => {
  let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
  const a = m.action, ctx = m.context;
  switch (m.event) {
    case "willAppear":
      if (a === AUDIO) { setLayout(ctx); audioCtx.add(ctx); refreshDevices(); }
      break;
    case "willDisappear":
      audioCtx.delete(ctx); cursors.delete(ctx);
      break;
    case "dialRotate":
      if (a === AUDIO) scroll(ctx, (m.payload && m.payload.ticks) || 0);
      break;
    // Push to apply. dialDown is the modern (SD 6.5+) event; dialPress is the legacy
    // (<=6.4) event and fires for press AND release, so guard on payload.pressed.
    // touchTap = tap the LCD. applySelected() is debounced, so overlap can't double-apply.
    case "dialDown":
      if (a === AUDIO) applySelected(ctx);
      break;
    case "dialPress":
      if (a === AUDIO && m.payload && m.payload.pressed) applySelected(ctx);
      break;
    case "touchTap":
      if (a === AUDIO) applySelected(ctx);
      break;
  }
});
