import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3007";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage();
const msgs = [];
page.on("console", (m) => msgs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => msgs.push("PAGEERROR: " + (e.stack || e.message)));
page.on("requestfailed", (r) =>
  msgs.push(`REQFAIL ${r.url().slice(0, 90)} :: ${r.failure()?.errorText}`)
);

await page.goto(`${BASE}/rapt`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(28000);
const canvases = await page.locator("canvas").count();
const bodyText = (await page.locator("body").innerText()).slice(0, 400);
log("CANVASES:", canvases);
log("---- BODY TEXT ----\n" + bodyText);
log("---- MESSAGES (last 40) ----");
msgs.slice(-40).forEach((m) => log(m));
await browser.close();
process.exit(0);
