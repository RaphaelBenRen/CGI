const puppeteer = require('puppeteer');
const mammoth = require('mammoth');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Parse un fichier PDF ou Word.
 * Pour les PDF : screenshot via Puppeteer + retourne base64 pour GPT-4o Vision.
 * Pour les Word : extraction texte brut.
 */
async function parseFile(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return parsePDFToImage(buffer);
  } else if (
    mimetype.includes('wordprocessingml') ||
    mimetype.includes('msword')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return { type: 'text', content: result.value };
  }
  throw new Error('Format non supporté. Utilisez PDF ou Word (.docx).');
}

/**
 * Rend le PDF avec Puppeteer (Chrome) et le screenshote en haute résolution.
 * Retourne un tableau de base64 PNG (une image par page visible).
 */
async function parsePDFToImage(buffer) {
  const tmpFile = path.join(os.tmpdir(), `cv_parse_${Date.now()}.pdf`);
  fs.writeFileSync(tmpFile, buffer);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
      ],
    });

    const page = await browser.newPage();

    // Résolution haute pour une bonne lecture par GPT-4o Vision
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });

    const fileUrl = `file:///${tmpFile.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Laisser le PDF viewer de Chrome finir de rendre
    await new Promise((r) => setTimeout(r, 2500));

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    return {
      type: 'image',
      content: Buffer.from(screenshot).toString('base64'),
    };
  } finally {
    if (browser) await browser.close();
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

module.exports = { parseFile };
