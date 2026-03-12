/**
 * Extract each PDF page as an image and save to assets/screenshots/slack-to-chat/
 * Usage: node scripts/extract-pdf-screenshots.js [path-to.pdf]
 * Default PDF: Slack To Chat Supported Features.pdf (Cursor workspace storage path)
 */
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_PDF = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'AppData', 'Roaming', 'Cursor', 'User', 'workspaceStorage',
  '1bee0e2f9793eb02b956b88e747d3e41', 'pdfs', '5b66222f-c4ff-4c1b-a4d7-7e48d7d1a8bf',
  'Slack To Chat Supported Features.pdf'
);

const OUT_DIR = path.join(__dirname, '..', 'assets', 'screenshots', 'slack-to-chat');

async function main() {
  const pdfPath = process.argv[2] || DEFAULT_PDF;
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found:', pdfPath);
    if (process.argv[2]) {
      console.error('(You passed a path — use the full path to your PDF, e.g. in Cursor workspaceStorage or your Desktop.)');
    } else {
      console.error('Default path used. To use a different PDF, run:');
      console.error('  node scripts/extract-pdf-screenshots.js "C:\\full\\path\\to\\Slack To Chat Supported Features.pdf"');
    }
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const { pdf } = await import('pdf-to-img');
  const document = await pdf(pdfPath, { scale: 2 });
  let counter = 1;

  for await (const image of document) {
    const outPath = path.join(OUT_DIR, `page_${counter}.png`);
    fs.writeFileSync(outPath, image);
    console.log('Saved', outPath);
    counter++;
  }

  console.log('Done. Extracted', counter - 1, 'page(s) to', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
