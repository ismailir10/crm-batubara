/**
 * Captures product screenshots used by the presentation deck.
 *
 *   npm run deck:capture
 *
 * Regenerable on purpose: the deck shows the real application, so when the UI
 * changes the slides can be refreshed by re-running this rather than by
 * hand-editing images. Requires the dev server on :3000 and a seeded database.
 *
 * Captures are tight — a single card, or the main column without the sidebar —
 * because a full 1440px screen shrunk into a slide column is unreadable on a
 * projector. Output: public/deck/*.png at 2× for crisp projection.
 */
import { chromium, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env";

loadEnv();

const BASE_URL = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";
const OUT_DIR = path.join(process.cwd(), "public", "deck");
const VIEWPORT = { width: 1440, height: 1000 };

async function login(page: Page, email: string) {
  await page.goto(`${BASE_URL}/masuk`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(`${BASE_URL}/`);
}

/** Settle layout and let Recharts finish drawing before capturing. */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(800);
}

function report(name: string, file: string) {
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`  ${name}.png  ${kb} KB`);
}

/** The card element that contains a given heading. */
function card(page: Page, heading: string): Locator {
  return page
    .getByRole("heading", { name: heading })
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]')
    .first();
}

async function shootCard(page: Page, name: string, heading: string) {
  await settle(page);
  const target = card(page, heading);
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const file = path.join(OUT_DIR, `${name}.png`);
  await target.screenshot({ path: file });
  report(name, file);
}

/** The main column (no sidebar), clipped to `height` from its top. */
async function shootMain(page: Page, name: string, height: number) {
  await settle(page);
  const box = await page.locator("main").boundingBox();
  if (!box) throw new Error(`no main element on ${page.url()}`);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({
    path: file,
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: Math.min(height, VIEWPORT.height - box.y),
    },
  });
  report(name, file);
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "id-ID",
  });
  const page = await context.newPage();

  console.log("capturing:");

  // --- Management view -------------------------------------------------------
  await login(page, "hendra.wijaya@demo-batubara.co.id");
  await shootMain(page, "dashboard", 560);
  await shootCard(page, "dashboard-harga", "Indeks Harga Batubara");

  await page.goto(`${BASE_URL}/harga-batubara`);
  await shootCard(page, "harga-7hari", "Hari Ini dan 7 Hari Sebelumnya");
  await shootCard(page, "harga-tren", "Tren Harga");

  await page.goto(`${BASE_URL}/harga-batubara?view=tahun`);
  await shootCard(page, "harga-tahun", "Perbandingan Antar Tahun");

  await page.goto(`${BASE_URL}/harga-batubara?view=periode`);
  await shootCard(page, "harga-periode", "Perbandingan Periode");

  await page.goto(`${BASE_URL}/harga-batubara?view=sumber`);
  await shootCard(page, "harga-sumber", "Sumber Data");
  await shootCard(page, "harga-ingestion", "Riwayat Pengambilan Data");

  // Sales Approval Form: the frozen market reference is the point of this one.
  await page.goto(`${BASE_URL}/persetujuan?status=menunggu_persetujuan`);
  await settle(page);
  await page.getByRole("link", { name: /^SAF-/ }).first().click();
  await page.waitForURL(/\/persetujuan\/[0-9a-f-]{36}/);
  await shootMain(page, "persetujuan", 620);
  await shootCard(page, "persetujuan-referensi", "Referensi Harga Pasar");

  // Opportunity with its status timeline.
  await page.goto(`${BASE_URL}/opportunity`);
  await settle(page);
  await page.getByRole("link", { name: /^OPP-/ }).first().click();
  await page.waitForURL(/\/opportunity\/[0-9a-f-]{36}/);
  await shootMain(page, "opportunity", 600);
  await shootCard(page, "opportunity-riwayat", "Riwayat Status");

  // --- Sales manager view ----------------------------------------------------
  await context.clearCookies();
  await login(page, "bagus.setiawan@demo-batubara.co.id");

  await page.goto(`${BASE_URL}/kontrak?status=ditandatangani_penuh`);
  await settle(page);
  await page.getByRole("link", { name: /^CTR\// }).first().click();
  await page.waitForURL(/\/kontrak\/[0-9a-f-]{36}/);
  await shootCard(page, "kontrak-realisasi", "Realisasi Pengiriman");

  await page.goto(`${BASE_URL}/delivery-order`);
  await shootMain(page, "delivery-order", 560);

  await browser.close();
  console.log(`\ndone — ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
