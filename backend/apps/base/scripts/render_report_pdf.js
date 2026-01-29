const fs = require("fs");
const puppeteer = require("puppeteer");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const url = process.argv[2];
  const outPath = process.argv[3];

  if (!url || !outPath) {
    console.error("Usage: node render_report_pdf.js <url> <outPath>");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Viewport grande para que el PDF salga bien
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // ✅ Tip: fuerza modo light/dark si quieres
  // await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);

  // Cargar y esperar a que deje de cargar red
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });

  // Espera a que exista el contenedor principal del informe
  await page.waitForSelector(".results-container", { timeout: 60000 });

  // ✅ OPCIÓN A (recomendada): esperar señal "PDF_READY" en el window
  // Si no existe, cae a la opción B.
  try {
    await page.waitForFunction(
      () => window.__PDF_READY__ === true,
      { timeout: 60000 }
    );
  } catch (e) {
    // ✅ OPCIÓN B: espera extra (recharts + fuentes)
    await sleep(1500);
  }

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  });

  await browser.close();
  fs.writeFileSync(outPath, pdfBuffer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
