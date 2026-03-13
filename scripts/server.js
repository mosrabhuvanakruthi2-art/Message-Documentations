/**
 * Serves the docs and provides POST /api/upload-pdf to upload a Limitations or
 * Supported Features PDF per combo and update section content (descriptions) only.
 * No screenshot extraction; screenshots are added via upload-image.html.
 * Run: node scripts/server.js
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { IncomingForm } = require('formidable');
const pdfParse = require('pdf-parse');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT, 'data');
const SCREENSHOTS_BASE = path.join(ROOT, 'assets', 'screenshots');
const META_PATH = path.join(DATA_DIR, 'screenshot-metadata.json');
const { exec } = require('node:child_process');

function toSlug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 50 * 1024 * 1024 }); // 50 MB
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

function loadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function loadMeta() {
  try {
    const raw = fs.readFileSync(META_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { _basePath: 'assets/screenshots' };
  }
}

function saveMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf8');
}

/** Extract text from PDF; returns { text, numpages }. */
async function extractPdfText(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  return { text: data.text || '', numpages: data.numpages || 1 };
}

/** Escape special regex chars in a string for use in RegExp. */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract one block of text per item: from each item's heading to the start of the next.
 * Uses JSON item order; for each item we take text from its first occurrence to the next item's occurrence.
 */
function extractSectionsByItemNames(fullText, itemNames) {
  const text = (fullText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sections = [];
  const positions = []; // index in text where each item name first appears (in item order)
  for (const name of itemNames) {
    if (!name || typeof name !== 'string') {
      positions.push(-1);
      continue;
    }
    const re = new RegExp(escapeRegex(name), 'i');
    const m = text.match(re);
    positions.push(m ? m.index : -1);
  }
  for (let i = 0; i < itemNames.length; i++) {
    const start = positions[i];
    if (start < 0) {
      sections.push('');
      continue;
    }
    let end = text.length;
    for (let j = 0; j < positions.length; j++) {
      if (j !== i && positions[j] > start && positions[j] < end) end = positions[j];
    }
    sections.push(text.slice(start, end));
  }
  return sections;
}

/**
 * Clean extracted section into a single description: remove the heading line,
 * "Screenshot:" lines, leading numbers, and normalize whitespace.
 */
function cleanSectionDescription(raw, itemName) {
  let t = (raw || '').trim();
  if (!t) return undefined;
  const nameRe = new RegExp('^' + escapeRegex(itemName) + '[\\s.•:]*', 'i');
  t = t.replace(nameRe, '').trim();
  t = t.replace(/\nScreenshot\s*:.*$/gim, '');
  t = t.replace(/Screenshot\s*:.*/gim, '');
  t = t.replace(/^\s*\d+\s+\d+\.\s*/gm, '');
  t = t.replace(/^\s*\d+\.\s*/gm, '');
  // Remove lines that are only a page number (standalone digit)
  t = t.replace(/^\s*\d+\s*$/gm, '');
  // Remove bullet points (•) from PDF content
  t = t.replace(/•/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  // Remove leading "number. " or "number • " at start (section/page number from PDF)
  t = t.replace(/^\s*\d+\s*[.•]\s*/, '').trim();
  if (t.length < 10) return undefined;
  return t;
}

/**
 * Update section JSON from PDF text by matching document sections to item names.
 * Each item's description is set from the PDF section that starts with that item's name.
 */
function updateSectionContentFromPdf(combo, sectionType, fullText) {
  const fileName = sectionType === 'features' ? 'supported-features.json' : 'limitations.json';
  const jsonPath = path.join(DATA_DIR, combo, fileName);
  const items = loadJson(jsonPath);
  if (!Array.isArray(items) || items.length === 0) return 0;
  const names = items.map((it) => it.name);
  const sectionTexts = extractSectionsByItemNames(fullText, names);
  let updated = 0;
  for (let i = 0; i < items.length; i++) {
    const desc = cleanSectionDescription(sectionTexts[i], names[i]);
    if (desc !== undefined) {
      items[i] = { ...items[i], description: desc };
      updated++;
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(items, null, 2), 'utf8');
  return updated;
}

async function handleUploadPdf(req, res) {
  let tmpPath = null;
  try {
    const { fields, files } = await parseMultipart(req);
    const combo = Array.isArray(fields.combo) ? fields.combo[0] : fields.combo;
    const section = Array.isArray(fields.section) ? fields.section[0] : fields.section;
    const file = files.pdf && (Array.isArray(files.pdf) ? files.pdf[0] : files.pdf);
    if (!combo || !file || !file.filepath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing combo or PDF file' }));
      return;
    }
    const validCombos = ['slack-to-chat', 'slack-to-slack', 'slack-to-teams', 'teams-to-teams', 'teams-to-chat', 'chat-to-chat', 'chat-to-teams'];
    if (!validCombos.includes(combo)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid combo' }));
      return;
    }
    const sectionType = section === 'limitations' ? 'limitations' : 'features';

    tmpPath = file.filepath;
    const { text, numpages } = await extractPdfText(tmpPath);
    const updated = updateSectionContentFromPdf(combo, sectionType, text);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pages: numpages, combo, section: sectionType, updated }));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Upload failed' }));
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

const VALID_COMBOS = ['slack-to-chat', 'slack-to-slack', 'slack-to-teams', 'teams-to-teams', 'teams-to-chat', 'chat-to-chat', 'chat-to-teams'];

async function handleUploadScreenshot(req, res) {
  let tmpPath = null;
  try {
    const { fields, files } = await parseMultipart(req);
    const combo = Array.isArray(fields.combo) ? fields.combo[0] : fields.combo;
    const section = Array.isArray(fields.section) ? fields.section[0] : fields.section;
    const slug = (Array.isArray(fields.slug) ? fields.slug[0] : fields.slug) || '';
    const file = files.image && (Array.isArray(files.image) ? files.image[0] : files.image);
    if (!combo || !slug || !file || !file.filepath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing combo, feature (slug), or image file' }));
      return;
    }
    if (!VALID_COMBOS.includes(combo)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid combo' }));
      return;
    }
    const sectionType = section === 'limitations' ? 'limitations' : 'features';
    if (!/^[a-z0-9-]+$/.test(slug)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid feature slug' }));
      return;
    }

    tmpPath = file.filepath;
    const outDir = path.join(SCREENSHOTS_BASE, combo);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const ext = (file.originalFilename && path.extname(file.originalFilename).toLowerCase()) || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) ? ext : '.png';
    const outFileName = slug + safeExt;
    const outPath = path.join(outDir, outFileName);
    fs.copyFileSync(tmpPath, outPath);

    const relativePath = 'assets/screenshots/' + combo + '/' + outFileName;
    const meta = loadMeta();
    if (!meta[combo]) meta[combo] = { features: {}, limitations: {} };
    if (!meta[combo][sectionType]) meta[combo][sectionType] = {};
    meta[combo][sectionType][slug] = { images: [{ path: relativePath }] };
    saveMeta(meta);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, path: relativePath }));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Upload failed' }));
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

function openScreenshotFolder(combo) {
  const dir = path.join(SCREENSHOTS_BASE, combo);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const absolutePath = path.resolve(dir);
  const plat = process.platform;
  const cmd = plat === 'win32' ? `explorer "${absolutePath}"` : plat === 'darwin' ? `open "${absolutePath}"` : `xdg-open "${absolutePath}"`;
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(absolutePath);
    });
  });
}

function handleOpenScreenshotFolder(req, res) {
  const url = new URL(req.url || '', 'http://localhost');
  const combo = url.searchParams.get('combo') || '';
  if (!VALID_COMBOS.includes(combo)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid combo' }));
    return;
  }
  if (process.env.RENDER === 'true') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Opening folder is not available when deployed. Add images using the upload form above.' }));
    return;
  }
  openScreenshotFolder(combo)
    .then((absolutePath) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, path: absolutePath }));
    })
    .catch((err) => {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Could not open folder' }));
    });
}

function serveStatic(req, res) {
  let urlPath = req.url.replace(/\?.*$/, '');
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (path.relative(ROOT, filePath).startsWith('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (!err && data) {
      const ext = path.extname(filePath);
      const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      if (req.url.split('?')[0].endsWith('screenshot-metadata.json')) {
        res.setHeader('Cache-Control', 'no-store');
      }
      res.end(data);
      return;
    }
    if (err && err.code === 'ENOENT' && !path.extname(filePath)) {
      return fs.readFile(filePath + '.html', (err2, data2) => {
        if (!err2 && data2) {
          res.setHeader('Content-Type', 'text/html');
          res.end(data2);
          return;
        }
        res.writeHead(404);
        res.end('Not found');
      });
    }
    if (err && err.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(500);
    res.end('Server error');
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/upload-pdf') {
    handleUploadPdf(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/upload-screenshot') {
    handleUploadScreenshot(req, res);
    return;
  }
  if (req.method === 'GET' && req.url.startsWith('/api/open-screenshot-folder')) {
    handleOpenScreenshotFolder(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('Migration Docs server at http://localhost:' + PORT);
  console.log('Upload PDF: http://localhost:' + PORT + '/upload.html');
  console.log('Upload screenshot (per feature): http://localhost:' + PORT + '/upload-image.html');
  console.log('Press Ctrl+C to stop.');
});
