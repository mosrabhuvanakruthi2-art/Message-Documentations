# Migration Docs

Slack API docs–style viewer for **Supported Features** and **Limitations** across all migration combinations: Slack to Slack, Slack to Chat, Slack to Teams, Teams to Teams, Teams to Chat, Chat to Chat, Chat to Teams.

## Run locally

Because the app loads JSON with `fetch`, open it through a local server (not by double-clicking `index.html`).

**Option 1 – With upload support (PDF + screenshot upload)**  
```bash
npm install
npm start
```
Then open http://localhost:3000 (or the port shown). Upload pages: `/upload.html`, `/upload-image.html`.

**Option 2 – Static only**
```bash
npm run serve
```
Then open http://localhost:3000.

**Option 3 – VS Code / Cursor**  
Use the “Live Server” extension: right-click `index.html` → “Open with Live Server”.

**Option 4 – Python**
```bash
python -m http.server 8080
```
Then open http://localhost:8080.

## Usage

- **Migration path**: use the dropdown in the header to select a combination (e.g. Slack to Chat, Teams to Teams).
- **Supported Features** / **Limitations**: switch via header nav or left sidebar.
- **Search**: type in the search box or press **Ctrl+K** to focus it. Filters the current list by name and description.
- **Filter by family**: click a tag (e.g. Channels, Files) to show only that category; click **All** or **Clear filters** to reset.
- **Screenshots**: the table has a Screenshots column. Images are shown when listed in `data/screenshot-metadata.json` for that feature. Use the upload pages (with `npm start`) to add or replace screenshots.

## Deploy on Render (from GitHub)

### Option A – Static site (docs only, no uploads)

1. In Render, create a **Static Site** and connect your GitHub repo.
2. **Build command:** leave empty or `npm install`.
3. **Publish directory:** `.` (a single dot = project root).

Upload pages will not work; use this if you only need to publish the documentation.

### Option B – Web Service (docs + upload APIs)

1. In Render, create a **Web Service** and connect your GitHub repo.
2. **Build command:** `npm install`
3. **Start command:** `npm start` or `node scripts/server.js`
4. Leave **Publish directory** empty (not used for Web Services).

Render sets `PORT` automatically. Upload PDF and upload screenshot will work; note that on Render the filesystem is ephemeral, so uploaded files and metadata changes may be lost on redeploy unless you add persistent storage.

**Important:** Do not put `node scripts/server.js` in the Publish directory field. That field is only for Static Sites and must be a folder path (e.g. `.`), not a command.
