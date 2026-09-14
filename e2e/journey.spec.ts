import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end coverage of the demo journeys in specification §8.
 *
 * These run against the seeded demo database. They avoid mutating records the
 * other tests depend on, and where they do write, they create new records
 * rather than editing seeded ones.
 */

const PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";

/** Kept in step with SLIDES in src/app/presentation/slides.tsx. */
const SLIDE_COUNT = 18;

const ACCOUNTS = {
  marketing: "dewi.anggraini@demo-batubara.co.id",
  salesManager: "bagus.setiawan@demo-batubara.co.id",
  management: "hendra.wijaya@demo-batubara.co.id",
};

async function login(page: Page, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL("/");
}

test.describe("authentication", () => {
  test("rejects a wrong password without revealing whether the account exists", async ({
    page,
  }) => {
    await page.goto("/masuk");
    await page.getByLabel("Email").fill(ACCOUNTS.marketing);
    await page.getByLabel("Kata Sandi").fill("salah-sekali");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Email atau kata sandi tidak sesuai.")).toBeVisible();
    await expect(page).toHaveURL(/\/masuk/);
  });

  test("redirects an anonymous visitor to the login page", async ({ page }) => {
    await page.goto("/kontrak");
    await expect(page).toHaveURL(/\/masuk/);
  });
});

test.describe("J-4 executive dashboard", () => {
  test("renders every KPI and links through to the underlying records", async ({ page }) => {
    await login(page, ACCOUNTS.management);

    await expect(page.getByRole("heading", { name: "Dashboard Eksekutif" })).toBeVisible();
    await expect(page.getByText("Nilai Pipeline")).toBeVisible();
    await expect(page.getByText("Menunggu Persetujuan").first()).toBeVisible();
    await expect(page.getByText("Realisasi Pengiriman")).toBeVisible();

    // The price strip: all four sources present on the dashboard.
    for (const code of ["ICI-3", "ICI-4", "CCI-5500", "QHD-5500"]) {
      await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
    }

    // KPIs are links, not dead-end numbers (specification §9.1).
    await page.getByRole("link", { name: /Realisasi Pengiriman/ }).click();
    await page.waitForURL(/\/delivery-order/);
    await expect(page.getByRole("heading", { name: "Delivery Order" })).toBeVisible();
  });

  test("shows the synthetic-data marker in the application chrome", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await expect(page.getByText("Data demo — sintetis")).toBeVisible();
  });
});

test.describe("J-1 prospect through to delivery order", () => {
  test("creates a prospect, logs a meeting note and opens an opportunity", async ({ page }) => {
    await login(page, ACCOUNTS.marketing);

    const stamp = Date.now();
    const company = `PT Uji Otomatis ${stamp}`;

    await page.goto("/prospek/baru");
    await page.getByLabel("Nama perusahaan").fill(company);
    await page.getByLabel("Negara").fill("Indonesia");
    await page.getByLabel("Kota").fill("Banjarmasin");
    await page.getByLabel("Nama kontak").fill("Budi Santoso");
    await page.getByRole("button", { name: "Simpan Prospek" }).click();

    await page.waitForURL(/\/prospek\/[0-9a-f-]{36}/);
    await expect(page.getByRole("heading", { name: company })).toBeVisible();

    // Meeting note on the new prospect.
    await page.getByRole("button", { name: "Tambah Catatan Meeting" }).click();
    await page.getByLabel("Peserta").fill("Budi Santoso (buyer), Dewi Anggraini");
    await page
      .getByLabel("Ringkasan diskusi")
      .fill("Pembahasan awal kebutuhan pasokan GAR 4200 untuk kuartal depan.");
    await page.getByRole("button", { name: "Simpan Catatan" }).click();

    await expect(
      page.getByText("Pembahasan awal kebutuhan pasokan GAR 4200 untuk kuartal depan.")
    ).toBeVisible();

    // Opportunity from that prospect.
    await page.getByRole("link", { name: "Opportunity Baru" }).first().click();
    await page.waitForURL(/\/opportunity\/baru/);
    await page.getByLabel("Judul opportunity").fill(`Uji otomatis — pasokan ${stamp}`);
    await page.getByLabel("Estimasi volume (MT)").fill("50000");
    await page.getByLabel("Estimasi harga (USD/MT)").fill("52.5");
    await page.getByRole("button", { name: "Simpan Opportunity" }).click();

    await page.waitForURL(/\/opportunity\/[0-9a-f-]{36}/);
    // 50,000 MT × USD 52.50 = USD 2,625,000, computed by the database.
    await expect(page.getByText("USD 2.625.000")).toBeVisible();
  });

  test("records a status change with its reason on the timeline", async ({ page }) => {
    await login(page, ACCOUNTS.marketing);
    await page.goto("/opportunity?status=on_progress");

    await page.getByRole("link", { name: /^OPP-/ }).first().click();
    await page.waitForURL(/\/opportunity\/[0-9a-f-]{36}/);

    await page.getByRole("button", { name: "Ubah Status" }).click();
    await page.getByLabel("Status baru").selectOption("pending");
    await page
      .getByLabel("Alasan perubahan")
      .fill("Uji otomatis: menunggu konfirmasi jadwal dari buyer.");
    await page.getByRole("button", { name: "Simpan Status" }).click();

    await expect(
      page.getByText("Uji otomatis: menunggu konfirmasi jadwal dari buyer.")
    ).toBeVisible();
    await expect(page.getByText("Pending").first()).toBeVisible();
  });
});

test.describe("approval authority", () => {
  test("marketing sees no decision controls on a pending form", async ({ page }) => {
    await login(page, ACCOUNTS.marketing);
    await page.goto("/persetujuan?status=menunggu_persetujuan");

    const firstForm = page.getByRole("link", { name: /^SAF-/ }).first();
    await firstForm.click();
    await page.waitForURL(/\/persetujuan\/[0-9a-f-]{36}/);

    await expect(page.getByRole("button", { name: "Setujui" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tolak" })).toHaveCount(0);
    await expect(
      page.getByText("Peran Anda tidak dapat menyetujui atau menolak form ini.")
    ).toBeVisible();
  });

  test("the server refuses a decision posted directly by marketing", async ({ page }) => {
    // Hiding the button is not the mechanism. The guard is server-side and, at a
    // second layer, an RLS policy (specification §9.5, AC-09).
    await login(page, ACCOUNTS.marketing);
    await page.goto("/persetujuan?status=menunggu_persetujuan");

    const href = await page.getByRole("link", { name: /^SAF-/ }).first().getAttribute("href");
    const safId = href!.split("/").pop()!;

    const response = await page.request.post(`/persetujuan/${safId}`, {
      form: {
        safId,
        decision: "disetujui",
        decisionNote: "Percobaan tanpa kewenangan.",
      },
    });

    // A POST without a valid server-action payload is just served as a page
    // render, so the HTTP status is not the signal here. The signal is that the
    // decision did not take effect: the form is still awaiting one, and no
    // decision maker was recorded.
    expect(response.ok()).toBe(true);

    // Check the form itself rather than the list, whose filter <select> also
    // contains the words "Menunggu Persetujuan" in a hidden <option>.
    await page.goto(`/persetujuan/${safId}`);
    await expect(page.getByText("Status Persetujuan")).toBeVisible();
    await expect(page.getByText("Diputuskan oleh")).toHaveCount(0);
    await expect(
      page.getByText("Peran Anda tidak dapat menyetujui atau menolak form ini.")
    ).toBeVisible();
  });

  test("J-2 management rejects a form and the opportunity returns to Pending", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/persetujuan?status=menunggu_persetujuan");

    const pending = page.getByRole("link", { name: /^SAF-/ });
    const count = await pending.count();
    test.skip(count === 0, "no pending approval form left in the seeded data");

    await pending.first().click();
    await page.waitForURL(/\/persetujuan\/[0-9a-f-]{36}/);

    // The frozen market reference must be on the form before the decision.
    await expect(page.getByText("Referensi Harga Pasar")).toBeVisible();
    await expect(page.getByText("Terkunci").first()).toBeVisible();

    await page.getByRole("button", { name: "Tolak" }).click();
    await page
      .getByLabel("Catatan keputusan")
      .fill("Uji otomatis: margin belum memadai terhadap indeks acuan.");
    await page.getByRole("button", { name: "Tolak", exact: true }).last().click();

    await expect(page.getByText("Ditolak").first()).toBeVisible();

    // Follow the link to the opportunity and confirm it came back to Pending.
    await page.getByRole("link", { name: /^OPP-/ }).first().click();
    await page.waitForURL(/\/opportunity\/[0-9a-f-]{36}/);
    await expect(page.getByText("Pending").first()).toBeVisible();
    await expect(page.getByText(/Sales Approval Form ditolak/)).toBeVisible();
  });
});

test.describe("contracts and delivery orders", () => {
  test("shows planned versus delivered tonnage per stage", async ({ page }) => {
    await login(page, ACCOUNTS.salesManager);
    await page.goto("/kontrak?status=ditandatangani_penuh");

    await page.getByRole("link", { name: /^CTR\// }).first().click();
    await page.waitForURL(/\/kontrak\/[0-9a-f-]{36}/);

    await expect(page.getByText("Realisasi Pengiriman")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Rencana" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Terkirim" }).first()).toBeVisible();
    await expect(page.getByText("Tahap 1").first()).toBeVisible();
  });

  test("refuses a delivery order that exceeds the remaining stage quota", async ({ page }) => {
    // The mistake this module exists to prevent (specification §9.7, AC-15).
    await login(page, ACCOUNTS.salesManager);
    await page.goto("/delivery-order/baru");

    await page.getByLabel("Volume rencana (MT)").fill("99999999");
    await page.getByRole("button", { name: "Terbitkan Delivery Order" }).click();

    await expect(page.getByText("Volume melebihi sisa kuota tahap")).toBeVisible();
    await expect(page).toHaveURL(/\/delivery-order\/baru/);
  });

  test("navigates from a delivery order back up the chain", async ({ page }) => {
    await login(page, ACCOUNTS.salesManager);
    await page.goto("/delivery-order");

    await page.getByRole("link", { name: /^DO\// }).first().click();
    await page.waitForURL(/\/delivery-order\/[0-9a-f-]{36}/);

    await expect(page.getByText("Volume rencana")).toBeVisible();
    await page.getByRole("link", { name: /^CTR\// }).first().click();
    await page.waitForURL(/\/kontrak\/[0-9a-f-]{36}/);
    await expect(page.getByRole("link", { name: /^SAF-/ })).toBeVisible();
  });
});

test.describe("J-3 coal price intelligence", () => {
  test("shows today plus the previous seven days for all four sources", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/harga-batubara");

    await expect(page.getByText("Hari Ini dan 7 Hari Sebelumnya")).toBeVisible();
    for (const code of ["ICI-3", "ICI-4", "CCI-5500", "QHD-5500"]) {
      await expect(page.getByRole("cell", { name: new RegExp(code) }).first()).toBeVisible();
    }
    await expect(page.getByText("Data sintetis, bukan harga pasar")).toBeVisible();
  });

  test("filters history by a date range", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/harga-batubara?range=1095");

    await expect(page.getByText("Statistik Rentang")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Rata-rata" })).toBeVisible();
  });

  test("compares two periods three years apart and states the direction", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/harga-batubara?view=periode");

    await expect(page.getByText(/Perbandingan Periode — ICI-3/)).toBeVisible();
    // A bare signed number is ambiguous; the UI must say which way it runs.
    await expect(page.getByText("Periode A terhadap Periode B").first()).toBeVisible();
    await expect(page.getByText(/Periode A lebih (tinggi|rendah)/).first()).toBeVisible();
  });

  test("compares the same calendar window across years", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/harga-batubara?view=tahun");

    await expect(page.getByText(/Perbandingan Antar Tahun/)).toBeVisible();
    // Multi-year depth: at least a row three years back must exist.
    const currentYear = new Date().getFullYear();
    await expect(page.getByRole("cell", { name: String(currentYear - 3) })).toBeVisible();
  });

  test("traces an observation to its source and fetch timestamp", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/harga-batubara");

    await page.locator('a[href^="/harga-batubara/observasi/"]').first().click();
    await page.waitForURL(/\/harga-batubara\/observasi\//);

    await expect(page.getByText("Waktu pengambilan").first()).toBeVisible();
    await expect(page.getByText("Penyedia").first()).toBeVisible();
    await expect(page.getByText("Wilayah server").first()).toBeVisible();
    await expect(page.getByText("MockCoalPriceProvider").first()).toBeVisible();
  });

  test("declares every source as a mock adapter", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await page.goto("/harga-batubara?view=sumber");

    await expect(page.getByText("Mock adapter").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Jalankan Pengambilan Data/ })).toBeVisible();
  });
});

test.describe("presentation deck", () => {
  test("navigates with the keyboard and reaches the last slide", async ({ page }) => {
    await page.goto("/presentation");
    // The keydown listener is attached on mount; pressing before hydration
    // completes silently drops the first key.
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Slide berikutnya" })).toBeEnabled();

    await expect(page.getByText(`1 / ${SLIDE_COUNT}`)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /CRM Terintegrasi dengan Intelijen Harga Batubara/ })
    ).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByText(`2 / ${SLIDE_COUNT}`)).toBeVisible();

    await page.keyboard.press("End");
    await expect(page.getByText(`${SLIDE_COUNT} / ${SLIDE_COUNT}`)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Mari kita coba langsung/ })).toBeVisible();

    await page.keyboard.press("Home");
    await expect(page.getByText(`1 / ${SLIDE_COUNT}`)).toBeVisible();
  });

  test("marks working features apart from proposals", async ({ page }) => {
    await page.goto("/presentation");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Slide berikutnya" })).toBeEnabled();

    // Slide 14 carries the integration-boundary distinction.
    for (let i = 0; i < 13; i += 1) await page.keyboard.press("ArrowRight");

    await expect(page.getByText("Berfungsi di demo").first()).toBeVisible();
    await expect(page.getByText("Usulan / tahap lanjut").first()).toBeVisible();
  });

  test("prints one page per slide, with no trailing blank", async ({ page, browserName }) => {
    // page.pdf() is Chromium-only; this is the projector/handout path in AC-25.
    test.skip(browserName !== "chromium", "PDF generation is Chromium-only");

    await page.goto("/presentation");
    await page.waitForLoadState("networkidle");
    await page.emulateMedia({ media: "print" });

    const pdf = await page.pdf({ landscape: true, printBackground: true });
    const pageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

    expect(pageCount).toBe(SLIDE_COUNT);
  });

  test("renders real product screenshots, not placeholders", async ({ page }) => {
    await page.goto("/presentation");
    await page.waitForLoadState("networkidle");

    // Every deck image must actually decode; a broken path would otherwise show
    // as an empty frame that nobody notices until the presentation.
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute("src"))
    );
    expect(broken).toEqual([]);
  });

  test("is reachable without signing in", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/presentation");
    await expect(page.getByText(`1 / ${SLIDE_COUNT}`)).toBeVisible();
  });
});
