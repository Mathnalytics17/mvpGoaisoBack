const puppeteer = require("puppeteer");

async function main() {
  const [url, outPath] = process.argv.slice(2);
  if (!url || !outPath) {
    console.error("Usage: node render_report_pdf.js <url> <outPath>");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

   await page.goto(url, { waitUntil: "networkidle0" });

// ✅ usa el CSS normal (como lo ves en el browser)
await page.emulateMediaType("screen");

// ✅ fuerza colores (esto sí ayuda)
await page.addStyleTag({
  content: `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `,
});

await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
});


    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
