# Screenshots by feature

Screenshots are stored as **image files** here and listed in the **JSON database**: `data/screenshot-metadata.json`.

## JSON database (metadata)

Edit **`data/screenshot-metadata.json`** to register screenshots for each combo and feature.

- **Unique key:** `combo` + `section` (`features` or `limitations`) + **feature slug** (e.g. `public-channels`).
- **Multiple images per feature:** use an `images` array with `path` and optional `label` (e.g. "Slack", "Google Chat") for side-by-side display.

Example for Slack to Chat, Public Channels (two images side-by-side):

```json
"slack-to-chat": {
  "features": {
    "public-channels": {
      "images": [
        { "path": "assets/screenshots/slack-to-chat/public-channels_1.png", "label": "Slack" },
        { "path": "assets/screenshots/slack-to-chat/public-channels_2.png", "label": "Google Chat" }
      ]
    }
  },
  "limitations": {}
}
```

## Folder structure

Place image files under:

```
assets/screenshots/
  slack-to-chat/
    public-channels_1.png    ← e.g. Slack UI
    public-channels_2.png   ← e.g. Google Chat UI
    one-time-migration.png  ← single image (no metadata entry: fallback path)
  slack-to-teams/
    ...
```

## Slug rules

- Slug = feature name in lowercase, spaces → hyphens, only letters/numbers/hyphens.
  - "Public Channels" → `public-channels`
  - "One Time Migration" → `one-time-migration`

## Fallback

If a feature has no entry in `screenshot-metadata.json`, the page looks for a single image at `assets/screenshots/<combo>/<slug>.png` (or .jpg).
