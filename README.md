<<<<<<< HEAD
# Migration Docs

Slack API docs–style viewer for **Supported Features** and **Limitations** across all migration combinations: Slack to Slack, Slack to Chat, Slack to Teams, Teams to Teams, Teams to Chat, Chat to Chat, Chat to Teams.

## Run locally

Because the app loads JSON with `fetch`, open it through a local server (not by double-clicking `index.html`).

**Option 1 – VS Code / Cursor**  
Use the “Live Server” extension: right-click `index.html` → “Open with Live Server”.

**Option 2 – Node**
```bash
npx serve .
```
Then open the URL shown (e.g. http://localhost:3000).

**Option 3 – Python**
```bash
python -m http.server 8080
```
Then open http://localhost:8080.

## Usage

- **Migration path**: use the dropdown in the header to select a combination (e.g. Slack to Chat, Teams to Teams).
- **Supported Features** / **Limitations**: switch via header nav or left sidebar.
- **Search**: type in the search box or press **Ctrl+K** to focus it. Filters the current list by name and description.
- **Filter by family**: click a tag (e.g. Channels, Files) to show only that category; click **All** or **Clear filters** to reset.
- **Screenshots**: the table has a Screenshots column. To show an image, set the `screenshot` field in the JSON to a path (e.g. `assets/screenshots/slack-to-chat/public-channels.png`) or a URL. Leave empty for "—".
=======
# Message-Documentations
>>>>>>> e34d448ad1d7999db18c69fd4cea88d81da97e43
