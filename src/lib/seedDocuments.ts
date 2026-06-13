import { titleFromMarkdown } from './documentMeta';
import { createNote } from './tauri';
import { initDb } from '../store/db';
import { insertFile, listAllFiles } from '../store/files.store';
import { isSeedDocsComplete, setSeedDocsComplete } from '../store/settings.store';

const SEED_DOCS = [
  {
    slug: 'welcome-to-loci-lite',
    markdown: `# Welcome to Loci Notepad

Loci Notepad is a **local-first** writing room. Your notes are plain Markdown files on disk; the app keeps a small SQLite registry for titles, recents, and future features like atoms.

## Move around the shell

- **Loci** (titlebar) — Home: create a note and open recent work.
- **Documents** — every registered file in one list.
- **Workspace** and **Atoms** — browse placeholders for later releases.
- **Settings** (gear) — preferences; **Sun / Moon** toggles light and Charcoal Claude dark.

## Open and save a note

1. On Home, choose **New note** (desktop app only).
2. Write in the editor column — serif body, calm width.
3. Edits save automatically after a short pause (~800 ms) to the \`.md\` file and registry title.

Use **Recent** on Home or a row on **Documents** to return to a note.

## Editor bar (bottom)

- **Outline** — headings from your saved markdown in a frosted panel over a dim scrim.
- **Atomise** — primary action (visual only until AI is wired).
- **Prompt field** — shell for future find, replace, or AI.
- **⋮ menu** — **Focus** dims non-active blocks and hides chrome; **Authorship** shows/hides paste-provenance colour (paste is always recorded).

> Tip: Run the desktop app with \`corepack pnpm tauri dev\`. Browser-only \`pnpm dev\` cannot create files or persist notes.
`,
  },
  {
    slug: 'what-works-today',
    markdown: `# What works today

This note summarizes behaviour in the current build. For exhaustive editor shortcuts see **notes.md** in the repo.

## Files and registry

| Piece | Status |
|-------|--------|
| Markdown on disk | \`{appData}/notes/*.md\` via Tauri |
| SQLite registry | Paths, titles, opened times |
| New note | Home or Documents → creates file + row |
| Auto-save | Debounced export from Lexical |

## Markdown while typing

Headings (\`# \` … \`###### \`), quotes, lists, fenced code, horizontal rules, and **bold** / *italic* / ~~strikethrough~~ shortcuts work. Inline \`code\`, links, and task lists are not wired yet.

## Chrome and theme

Shell panels (titlebar, cards, editor bar, outline) use transparent \`--shell-chrome-*\` glass with blur. Sign off visuals in the **Tauri window** — panels should look see-through over the page, not milky cards.

## Delete (with confirmation)

- **Notes:** editor overflow **Delete note**, or drag the **whole document row** to the bin on the Documents tab.
- **Bookmarks:** drag the **whole flashcard** to the bin on the Bookmarks tab, card-back X, or editor tooltip delete.
- All deletes open a confirm dialog first (solid red Delete button on the dialog).

**Drag tip:** grab anywhere on the row or card — no separate handle. A solid mini panel follows the cursor (not the whole card). If drag does not start in the desktop app, restart \`tauri dev\` after config changes (\`dragDropEnabled: false\` on the main window).

## Not wired yet

- Authorship paste wash (toggle in ⋮ menu), bookmark highlight toggle, AI atomise.
- Context menu and selection bar plugins.

Edit this note freely — it is yours like any other file.
`,
  },
] as const;

export async function seedBaseDocumentsIfNeeded(): Promise<void> {
  await initDb();

  if (await isSeedDocsComplete()) {
    return;
  }

  const existing = await listAllFiles();
  if (existing.length > 0) {
    await setSeedDocsComplete();
    return;
  }

  const baseOpenedAt = Date.now();

  for (const [index, doc] of SEED_DOCS.entries()) {
    const path = await createNote(doc.slug, doc.markdown);
    const title = titleFromMarkdown(doc.markdown);
    const timestamp = baseOpenedAt - index;

    await insertFile({
      id: crypto.randomUUID(),
      path,
      title,
      openedAt: timestamp,
      createdAt: timestamp,
      editedAt: timestamp,
      pinned: false,
    });
  }

  await setSeedDocsComplete();
}
