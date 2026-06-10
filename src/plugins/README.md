# Loci Plugin System

Plugins extend Loci Lite without modifying core code.

## Creating a plugin

1. Create a folder: `src/plugins/your-plugin/`
2. Create `index.ts` that calls `registerPlugin()`
3. Import it in `src/plugins/index.ts`
4. Add the slug to `plugin_entitlements` in Supabase for Modern Writer users

## Available hooks

- `onInstall` — called when plugin is first enabled
- `onUninstall` — called when plugin is removed
- `onNoteOpen(fileId)` — called when a note is opened
- `onNoteClose(fileId, wordCount)` — called when a note is closed
- `onBookmark({ text, type })` — called when a bookmark is created

## Tiers

- `standard` — available to all users
- `modern_writer` — requires active Modern Writer subscription
