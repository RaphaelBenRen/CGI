const mammoth = require('mammoth');
const PDFParser = require('pdf2json');

/**
 * Parse un fichier PDF ou Word vers du texte brut.
 */
async function parseFile(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return parsePDFText(buffer);
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
 * Extrait le texte brut d'un PDF via pdf2json.
 */
async function parsePDFText(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on('pdfParser_dataError', (errData) =>
      reject(new Error(errData.parserError || 'Erreur parsing PDF'))
    );

    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const raw = pdfParser.getRawTextContent();
        // Nettoyer les artefacts de parsing
        const text = raw
          .replace(/\r/g, '')
          .replace(/\f/g, '\n')
          .replace(/\n{4,}/g, '\n\n')
          .trim();
        resolve({ type: 'text', content: text });
      } catch (e) {
        reject(e);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

module.exports = { parseFile };
