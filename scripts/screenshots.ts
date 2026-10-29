// Regenerates the README screenshots from a running app (npm run dev) with seed data.
import { mkdir } from "node:fs/promises";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";

async function shot(page: Page, path: string, name: string, settle?: (page: Page) => Promise<void>) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
  await settle?.(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`saved ${name}.png`);
}

async function firstHref(page: Page, path: string, selector: string) {
  await page.goto(`${BASE}${path}`);
  return page.locator(selector).first().getAttribute("href");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  await shot(page, "/", "dashboard");
  await shot(page, "/clients", "clients");
  await shot(page, "/applications?view=board", "applications-board");
  await shot(page, "/deadlines?month=" + new Date().toISOString().slice(0, 7), "deadlines");
  await shot(page, "/map", "map", (p) => p.waitForSelector(".leaflet-interactive", { timeout: 20_000 }).then(() => p.waitForTimeout(1500)));

  const application = await firstHref(page, "/applications?status=GATHERING_DOCS", 'table a[href^="/applications/"]');
  if (application) await shot(page, application, "application");

  const invoice = await firstHref(page, "/invoices?tab=overdue", 'table a[href^="/invoices/"]');
  if (invoice) await shot(page, invoice, "invoice");

  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "/", "mobile-dashboard");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
