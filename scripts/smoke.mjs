import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3007";
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const watchdog = setTimeout(() => {
  log("WATCHDOG: hard timeout, exiting");
  process.exit(3);
}, 90000);

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

log("goto landing");
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
const h1 = await page.locator("h1").first().innerText();
log("landing h1:", JSON.stringify(h1));
await page.screenshot({ path: "scripts/landing.png", fullPage: true });

log("goto rapt");
await page.goto(`${BASE}/rapt`, { waitUntil: "domcontentloaded" });
log("waiting for >=2 canvases");
try {
  await page.waitForFunction(
    () => document.querySelectorAll("canvas").length >= 2,
    { timeout: 40000 }
  );
} catch {
  log("canvas wait TIMED OUT");
}
await page.waitForTimeout(5000);
const canvases = await page.locator("canvas").count();
const banner = await page.locator("text=live original").count();
const captionRight = await page.locator("text=Re-styled live").count();
log("rapt canvases:", canvases, "banner:", banner, "rightCaption:", captionRight);
await page.screenshot({ path: "scripts/rapt.png" });

log("click Harbor scheme");
await page.locator("text=Harbor").first().click().catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "scripts/rapt-harbor.png" });

const relevant = errors.filter(
  (e) => !/favicon|404|net::ERR_|Download the React|ResizeObserver loop/i.test(e)
);
log("CONSOLE ERRORS:", relevant.length);
relevant.slice(0, 20).forEach((e) => log("  -", e));

await browser.close();
clearTimeout(watchdog);
log("DONE");
process.exit(relevant.length > 0 ? 2 : 0);
