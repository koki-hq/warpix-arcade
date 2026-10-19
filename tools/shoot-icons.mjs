// tools/icon.html を 撮影して icons/ に アイコンを 保存する（v0.1）
// 使い方: node tools/shoot-icons.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe"
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SIZES = [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]];
const chromePath = process.argv[2];
const root = resolve(import.meta.dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "arcade-icon-"));
const port = 9352;
spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--mute-audio", "about:blank"]);
// Windows の Chrome は 自分を 起動し直すので、プロファイル名で 探して 確実に 止める
const cleanup = () => {
  if (process.platform !== "win32") return;
  try {
    execFileSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${profile.split(/[\/]/).pop()}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore" });
  } catch {}
};
process.on("exit", cleanup);

let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

for (const [name, s] of SIZES) {
  await send("Emulation.setDeviceMetricsOverride", { width: s, height: s, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${pathToFileURL(join(root, "tools", "icon.html")).href}?s=${s}` });
  await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: s, height: s, scale: 1 } });
  writeFileSync(join(root, "icons", name), Buffer.from(shot.result.data, "base64"));
  console.log("saved", name);
}
await send("Browser.close");
await sleep(500);
cleanup();
process.exit(0);
