/**
 * Exports the presentation as a self-contained folder that opens by
 * double-clicking index.html — no Node, no build, no network.
 *
 *   npm run deck:export
 *
 * The slides are rendered from the same `SLIDES` array the application serves at
 * /presentation, so the export cannot drift from the real deck. Navigation,
 * fullscreen and print are re-implemented in a few lines of vanilla JS, since
 * React is not shipped.
 *
 * Output: dist/deck/ — index.html, assets/, and a printed PDF of the same file,
 * so the folder can be opened, presented, or emailed without this repository.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { SLIDES } from "../src/app/presentation/slides";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "dist", "deck");
const ASSETS_DIR = path.join(OUT_DIR, "assets");

const TITLE = "CRM Terintegrasi dengan Intelijen Harga Batubara";
const SUBTITLE = "Usulan sistem untuk bisnis batubara · Rightjet";

/** Keyboard navigation, fullscreen and slide scaling, without a framework. */
const SHELL_SCRIPT = `
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll(".deck-slide"));
  var stage = document.querySelector(".deck-stage");
  var counter = document.getElementById("deck-counter");
  var titleEl = document.getElementById("deck-slide-title");
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-dot]"));
  var index = 0;

  var SLIDE_WIDTH = 1280;
  var SLIDE_HEIGHT = 720;

  function fit() {
    if (!stage) return;
    var rect = stage.getBoundingClientRect();
    var scale = Math.min(rect.width / SLIDE_WIDTH, rect.height / SLIDE_HEIGHT);
    slides.forEach(function (slide) {
      slide.style.transform = "scale(" + scale + ")";
    });
  }

  function render() {
    slides.forEach(function (slide, i) {
      // A class, not the [hidden] attribute: Chromium's UA stylesheet marks
      // [hidden] display:none !important, which no print rule can override,
      // and that silently collapsed the PDF to a single page.
      if (i === index) {
        slide.classList.remove("deck-slide-off");
        slide.removeAttribute("aria-hidden");
      } else {
        slide.classList.add("deck-slide-off");
        slide.setAttribute("aria-hidden", "true");
      }
    });
    dots.forEach(function (dot, i) {
      dot.className = i === index ? "deck-dot deck-dot-active" : "deck-dot";
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    if (counter) counter.textContent = index + 1 + " / " + slides.length;
    if (titleEl) titleEl.textContent = slides[index].getAttribute("data-title") || "";
    if (location.hash !== "#" + (index + 1)) {
      history.replaceState(null, "", "#" + (index + 1));
    }
    fit();
  }

  function go(next) {
    index = Math.max(0, Math.min(next, slides.length - 1));
    render();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  document.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ":
        event.preventDefault(); go(index + 1); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp":
        event.preventDefault(); go(index - 1); break;
      case "Home": event.preventDefault(); go(0); break;
      case "End": event.preventDefault(); go(slides.length - 1); break;
      case "f": case "F": event.preventDefault(); toggleFullscreen(); break;
      default: break;
    }
  });

  var prev = document.getElementById("deck-prev");
  var next = document.getElementById("deck-next");
  var full = document.getElementById("deck-fullscreen");
  var print = document.getElementById("deck-print");
  if (prev) prev.addEventListener("click", function () { go(index - 1); });
  if (next) next.addEventListener("click", function () { go(index + 1); });
  if (full) full.addEventListener("click", toggleFullscreen);
  if (print) print.addEventListener("click", function () { window.print(); });
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () { go(i); });
  });

  window.addEventListener("resize", fit);

  function slideFromHash() {
    var n = parseInt((location.hash || "").replace("#", ""), 10);
    return !isNaN(n) && n >= 1 && n <= slides.length ? n - 1 : null;
  }

  // Deep links work on load and on later hash changes, so a slide can be shared
  // as deck.html#8 and also jumped to in an already-open tab.
  window.addEventListener("hashchange", function () {
    var target = slideFromHash();
    if (target !== null && target !== index) go(target);
  });

  var initial = slideFromHash();
  if (initial !== null) index = initial;
  render();
})();
`;

const SHELL_STYLES = `
  .deck-root {
    display: flex; height: 100vh; flex-direction: column;
    background-color: var(--color-ink-100);
  }
  .deck-stage {
    position: relative; display: flex; min-height: 0; flex: 1 1 0%;
    align-items: center; justify-content: center; padding: 1rem;
  }
  .deck-slide {
    width: 1280px; height: 720px; overflow: hidden; border-radius: 8px;
    background-color: white; transform-origin: center;
    box-shadow: 0 0 0 1px rgb(10 37 64 / 0.05), 0 2px 5px rgb(10 37 64 / 0.06),
      0 8px 16px rgb(10 37 64 / 0.04);
  }
  .deck-slide-off { display: none; }

  .deck-controls {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    border-top: 1px solid var(--color-ink-200); background: white;
    padding: 0.625rem 1rem; font-size: 13px;
  }
  .deck-controls button {
    border: 0; background: transparent; cursor: pointer; color: var(--color-ink-600);
    border-radius: 6px; padding: 0.25rem 0.5rem; font: inherit;
  }
  .deck-controls button:hover { background: var(--color-ink-100); color: var(--color-ink-900); }
  .deck-dots { display: flex; align-items: center; gap: 6px; }
  .deck-dot {
    height: 6px; width: 6px; border-radius: 999px; border: 0; padding: 0;
    background: var(--color-ink-300); cursor: pointer;
  }
  .deck-dot-active { width: 24px; background: var(--color-brand-500); }

  @page { size: landscape; margin: 0; }

  @media print {
    .deck-controls { display: none !important; }
    .deck-root { display: block; height: auto; background: white; }
    .deck-stage { display: block; padding: 0; }
    /* Every slide prints, including the ones hidden on screen. */
    .deck-slide, .deck-slide-off {
      display: block !important;
      width: 100%; height: 100vh;
      border-radius: 0; box-shadow: none;
      transform: none !important;
      page-break-after: always; break-after: page;
    }
    .deck-slide:last-of-type { page-break-after: auto; break-after: auto; }
  }
`;

function buildCss() {
  const input = path.join(ROOT, "scripts", "deck-export.css");
  const output = path.join(ASSETS_DIR, "deck.css");
  execFileSync(
    "npx",
    ["--yes", "@tailwindcss/cli", "-i", input, "-o", output, "--minify"],
    { stdio: ["ignore", "ignore", "inherit"], cwd: ROOT }
  );
  return output;
}

/**
 * Copies only the assets the rendered HTML actually references.
 *
 * public/deck/ holds more captures than the deck uses — `deck:capture` grabs a
 * few spares. Shipping all of them would put unused megabytes in the
 * distributable folder.
 */
function copyReferencedAssets(html: string) {
  // Only the directories mirrored from public/ — assets/deck.css is generated
  // by Tailwind, not copied.
  const referenced = new Set(
    [...html.matchAll(/(?:src|href)="(assets\/(?:deck|brand)\/[^"]+)"/g)].map(
      (match) => match[1]
    )
  );

  let copied = 0;
  for (const relative of referenced) {
    const source = path.join(ROOT, "public", relative.replace(/^assets\//, ""));
    if (!fs.existsSync(source)) {
      throw new Error(`Deck references ${relative} but ${source} does not exist.`);
    }
    const destination = path.join(OUT_DIR, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
    copied += 1;
  }
  return copied;
}

function renderSlides() {
  return SLIDES.map((slide, index) => {
    const markup = renderToStaticMarkup(slide.render() as React.ReactElement);
    const off = index === 0 ? "" : " deck-slide-off";
    const ariaHidden = index === 0 ? "" : ' aria-hidden="true"';
    return `      <section class="deck-slide${off}" data-title="${escapeAttribute(
      slide.title
    )}" aria-label="${escapeAttribute(
      `Slide ${index + 1}: ${slide.title}`
    )}"${ariaHidden}>${markup}</section>`;
  }).join("\n");
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildHtml(slidesMarkup: string) {
  const dots = SLIDES.map(
    (slide, index) =>
      `<button class="deck-dot" data-dot type="button" aria-label="${escapeAttribute(
        `Slide ${index + 1}: ${slide.title}`
      )}"></button>`
  ).join("");

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${TITLE}</title>
    <meta name="description" content="${SUBTITLE}. Prototipe demonstrasi, seluruh data bersifat sintetis." />
    <link rel="icon" href="assets/brand/rightjet-logo.png" />
    <link rel="stylesheet" href="assets/deck.css" />
    <style>${SHELL_STYLES}</style>
  </head>
  <body>
    <div class="deck-root">
      <div class="deck-stage">
${slidesMarkup}
      </div>

      <div class="deck-controls">
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <strong id="deck-counter" style="font-variant-numeric:tabular-nums;color:var(--color-ink-900)">1 / ${SLIDES.length}</strong>
          <span id="deck-slide-title" style="color:var(--color-ink-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
        </div>

        <div class="deck-dots">${dots}</div>

        <div style="display:flex;align-items:center;gap:2px">
          <button id="deck-prev" type="button" aria-label="Slide sebelumnya">&larr;</button>
          <button id="deck-next" type="button" aria-label="Slide berikutnya">&rarr;</button>
          <button id="deck-fullscreen" type="button" aria-label="Layar penuh" title="Layar penuh (F)">Layar penuh</button>
          <button id="deck-print" type="button" aria-label="Cetak atau simpan sebagai PDF">Cetak / PDF</button>
        </div>
      </div>
    </div>

    <script>${SHELL_SCRIPT}</script>
  </body>
</html>
`;
}

/**
 * Prints the exported file itself — not the Next route — so the PDF is proof
 * that the shipped artifact paginates correctly.
 */
async function buildPdf(indexPath: string) {
  const out = path.join(OUT_DIR, "crm-batubara-deck.pdf");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`file://${indexPath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);
  const pdf = await page.pdf({ path: out, landscape: true, printBackground: true });
  await browser.close();

  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pages !== SLIDES.length) {
    throw new Error(
      `PDF has ${pages} pages but the deck has ${SLIDES.length} slides — print CSS is wrong.`
    );
  }
  return { out, pages };
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  let html = buildHtml(renderSlides());
  // Components reference /deck/... and /brand/... because they normally run
  // under Next's public/ root. Rewrite to relative paths so the folder works
  // from the filesystem, with no server.
  //
  // This must cover href= as well as src=: React 19 emits
  // <link rel="preload" as="image" href="..."> alongside each <img> during
  // server rendering, and those carry the original absolute path.
  html = html.replace(/(src|href)="\/deck\//g, '$1="assets/deck/');
  html = html.replace(/(src|href)="\/brand\//g, '$1="assets/brand/');

  const assetCount = copyReferencedAssets(html);
  buildCss();

  // The folder ships with its own instructions. Kept in scripts/deck-assets/
  // rather than written into dist/, which every export wipes.
  fs.copyFileSync(
    path.join(ROOT, "scripts", "deck-assets", "README.md"),
    path.join(OUT_DIR, "README.md")
  );

  const indexPath = path.join(OUT_DIR, "index.html");
  fs.writeFileSync(indexPath, html);

  const pdf = await buildPdf(indexPath);

  const sizeKb = (file: string) => Math.round(fs.statSync(file).size / 1024);
  console.log(`deck exported to ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`  index.html               ${sizeKb(indexPath)} KB`);
  console.log(`  assets/deck.css          ${sizeKb(path.join(ASSETS_DIR, "deck.css"))} KB`);
  console.log(`  crm-batubara-deck.pdf    ${sizeKb(pdf.out)} KB · ${pdf.pages} pages`);
  console.log(`  ${SLIDES.length} slides · ${assetCount} assets`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
