# Slack to Chat screenshots

These images were extracted from **Slack To Chat Supported Features.pdf** (one image per PDF page).

- **page_1.png … page_23.png** – Full PDF pages in order.
- **public-channels_1.png** / **public-channels_2.png** – Copies of page 1 and 2, used by the docs for the “Public Channels” feature (Slack | Google Chat).

To use other pages for other features, add entries in `data/screenshot-metadata.json` with paths like:

`assets/screenshots/slack-to-chat/page_3.png`

To re-run extraction:

**Option 1 – Use default PDF path** (Cursor workspace storage, if the PDF was opened in Cursor):

```bash
node scripts/extract-pdf-screenshots.js
```

**Option 2 – Use your PDF path** (run from the `documentation` folder; use the real path, not a placeholder):

```bash
node scripts/extract-pdf-screenshots.js "C:\Users\YourName\...\Slack To Chat Supported Features.pdf"
```

If `npm run extract-pdf-screenshots` fails (e.g. PowerShell execution policy), use the `node scripts/...` commands above instead.
