import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3010";
const log = (...a) => console.log(...a);
const wd = setTimeout(() => { log("WATCHDOG"); process.exit(3); }, 80000);
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.goto(`${BASE}/biomed`, { waitUntil: "domcontentloaded" });
try { await p.waitForFunction(() => document.querySelectorAll("canvas").length >= 2, { timeout: 40000 }); }
catch { log("canvas wait TIMEOUT"); }
await p.waitForTimeout(7000);
log("canvases:", await p.locator("canvas").count());
await p.screenshot({ path: "scripts/rc-biomed.png" });
const rel = errs.filter((e) => !/favicon|404|net::ERR_|ResizeObserver loop/i.test(e));
log("ERRORS:", rel.length); rel.slice(0, 15).forEach((e) => log("  -", e));
await b.close(); clearTimeout(wd); log("DONE");
process.exit(0);
