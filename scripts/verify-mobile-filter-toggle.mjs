import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const port = 9227;
const chromium = spawn("/usr/bin/chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/atlas-flux-mobile-toggle-profile",
  "about:blank",
], { stdio: "ignore" });

async function browserVersion() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    } catch {
      await sleep(100);
    }
  }
  throw new Error("Chrome CDP indisponible");
}

const version = await browserVersion();
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let messageId = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params, sessionId }));
});

try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  await send("Page.navigate", { url: "http://127.0.0.1:3000/" }, sessionId);
  await sleep(1800);

  const expression = `(() => {
    const control = document.querySelector('.map-filter-visibility-toggle');
    const panel = document.querySelector('.world-filter-panel');
    const stage = document.querySelector('.world-map-stage');
    if (!control || !panel || !stage) return { ok: false, control: !!control, panel: !!panel, stage: !!stage };
    const snapshot = () => ({
      mobile: matchMedia('(max-width: 680px)').matches,
      width: innerWidth,
      filtersHidden: stage.classList.contains('filters-hidden'),
      panelOpacity: getComputedStyle(panel).opacity,
      panelPointerEvents: getComputedStyle(panel).pointerEvents,
      controlVisible: getComputedStyle(control).visibility,
    });
    const before = snapshot();
    control.click();
    return new Promise(resolve => setTimeout(() => {
      const hidden = snapshot();
      control.click();
      setTimeout(() => resolve({ ok: true, before, hidden, restored: snapshot() }), 800);
    }, 800));
  })()`;
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
  console.log(JSON.stringify(result.result.value, null, 2));
} finally {
  socket.close();
  chromium.kill("SIGTERM");
}
