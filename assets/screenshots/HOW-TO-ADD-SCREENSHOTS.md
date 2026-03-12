# How to add screenshot files

The docs page loads image **paths** from `data/screenshot-metadata.json`. Those paths can point to files in **any folder** in the project or to **full URLs** (e.g. CDN, Confluence). You don’t have to use `assets/screenshots`.

---

## Option A: Store in a different folder (not assets)

1. Create a folder anywhere under the project, e.g. `screenshots/` or `images/slack-to-chat/`.
2. In `data/screenshot-metadata.json`, set the **base path** for fallback images (optional):
   ```json
   "_basePath": "screenshots"
   ```
   Then fallback images are expected at `screenshots/<combo>/<slug>.png` (e.g. `screenshots/slack-to-chat/public-channels.png`).
3. In each feature’s `images` array, use paths relative to the **project root**:
   ```json
   { "path": "screenshots/slack-to-chat/public-channels_1.png", "label": "Slack" },
   { "path": "screenshots/slack-to-chat/public-channels_2.png", "label": "Google Chat" }
   ```
4. Put your PNG/JPG files in that folder with the same names.

## Option B: Use external URLs

Use full URLs in the `path` field. No local files needed:

```json
"images": [
  { "path": "https://your-cdn.com/screenshots/slack-public-channels.png", "label": "Slack" },
  { "path": "https://your-cdn.com/screenshots/chat-public-channels.png", "label": "Google Chat" }
]
```

## Option C: Use the default folder (assets/screenshots)

Keep `_basePath` as `assets/screenshots` (or omit it) and put files under `assets/screenshots/<combo>/` as below.

---

## Step-by-step (default folder)

### 1. Create the combo folder (if needed)

Under `assets/screenshots/`, create a folder for the migration combo, for example:

- `assets/screenshots/slack-to-chat/`
- `assets/screenshots/slack-to-teams/`
- etc.

The folder name must match the combo id (e.g. `slack-to-chat`).

### 2. Add your image files

Put your PNG or JPG files in that folder. **File names must match the paths in `data/screenshot-metadata.json`.**

**Example – Slack to Chat, Public Channels (current metadata):**

Your metadata says:

- `assets/screenshots/slack-to-chat/public-channels_1.png` (label: "Slack")
- `assets/screenshots/slack-to-chat/public-channels_2.png` (label: "Google Chat")

So you need these two files:

| Path (relative to project root) | What to put there |
|----------------------------------|-------------------|
| `assets/screenshots/slack-to-chat/public-channels_1.png` | Screenshot of **Slack** (e.g. public channel) |
| `assets/screenshots/slack-to-chat/public-channels_2.png` | Screenshot of **Google Chat** (same feature) |

**How to create the images:**

1. Take screenshots (e.g. Snipping Tool, Win+Shift+S, or your browser).
2. Save them (or copy) into:
   ```
   documentation\assets\screenshots\slack-to-chat\
   ```
3. Name them exactly: `public-channels_1.png` and `public-channels_2.png`.

### 3. Reload the screenshots page

Open the Screenshots page (or click the Screenshots link for that feature), and refresh. The images will replace the “No image yet” placeholders.

---

## Adding more features or combos

1. **Edit** `data/screenshot-metadata.json`: add an entry for the combo and feature with an `images` array (path + optional label).
2. **Add** the image files under `assets/screenshots/<combo>/` with the **same file names** as in the `path` (e.g. `public-channels_1.png`).
3. Paths in the JSON are relative to the **project root** (where `index.html` is), e.g. `assets/screenshots/slack-to-chat/public-channels_1.png`.

## Quick reference – folder on your machine

On your PC the folder is:

```
c:\Users\BhuvanaMosra\OneDrive - CloudFuze, Inc\Desktop\documentation\assets\screenshots\slack-to-chat\
```

Put `public-channels_1.png` and `public-channels_2.png` there to see them on the Slack to Chat → Public Channels screenshots page.

---

## Summary

| Want to…              | Do this |
|-----------------------|--------|
| Use another folder    | Set `_basePath` in the JSON (e.g. `"screenshots"`) and use paths like `screenshots/slack-to-chat/file.png` in `images`. |
| Use no local files    | Use full URLs in `path`, e.g. `"https://example.com/img.png"`. |
| Keep current setup    | Leave `_basePath` as `assets/screenshots` and put files in `assets/screenshots/<combo>/`. |
