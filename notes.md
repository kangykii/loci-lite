# Loci Lite — editor notes (non-canonical)

Scratch pad for what the markdown editor can do **today**. For product rules use `RULES.md`, `DESIGN LOCILITE.md`, and `ARCHITECTURE LOCILITE.md`.

Last checked: 2026-06-05 · Lexical **0.45.0**

---

## How you open the editor

- **Home → New note** (Tauri only) calls `useCreateDocument`, registers the file in SQLite, and opens `EditorView` with `activeFileId`.
- **Editor** loads markdown from disk via `useDocument(fileId)`; edits auto-save after **800ms** debounce (`PersistPlugin` → `useDocument.save`).
- **Vite-only** (`pnpm dev` in browser): New note is **disabled** — `isTauri()` is false in a normal browser tab. Use **`corepack pnpm tauri dev`** and the **desktop window** (not http://localhost:1420 in Chrome/Edge).
- **Shell chrome sign-off:** judge **see-through** titlebar, browse cards, editor bar, and outline panel in the **Tauri desktop window** only (`corepack pnpm tauri dev`). Low-alpha `--shell-chrome-*` + blur; no panel shadows. `html.is-tauri` is present but does not raise opacity.
- **First launch:** empty registry gets two seeded notes — *Welcome to Loci Lite* and *What works today* — from [`src/lib/seedDocuments.ts`](src/lib/seedDocuments.ts) (flag `settings.seed.docs_v1`).
- If `tauri dev` fails with **port 1420 in use**, stop the other Vite process first, then run `tauri dev` again.
- **Home → Recent** uses `useSearchableDocuments` — empty search shows 10 most recent; typing searches all `.md` files (title + body).
- **Documents** uses `useSearchableDocuments`; live global search on title + body. **Filter** button remains a disabled shell.
- **Bookmarks** lists all atoms via `useAtoms`; live search on highlighted `sourceText` only. Type filter popover (All · Definitions · Notes · Reminders) composes with search.
- **Search:** case-insensitive substring via `matchesSearch`; filters on every keystroke (no Enter). Home filter chips (`Recent`, `Markdown`) remain disabled shells.

## Stage 1 — Tauri file I/O (done)

- Commands: `get_notes_dir`, `create_note`, `read_file`, `write_file` (Rust + [`src/lib/tauri.ts`](src/lib/tauri.ts)).
- Notes live under app data: `{appDataDir}/notes/*.md`.
- Helpers: [`src/lib/documentMeta.ts`](src/lib/documentMeta.ts) (slug, title from H1, default new-note body).
- **Smoke test** (in `pnpm tauri dev` webview console):

```js
import('/src/lib/stage1FileSmoke.ts').then((m) => m.runStage1FileSmoke())
```

Requires Vite dev server (`pnpm dev`) running alongside Tauri.

## Stage 2 — SQLite file registry (done)

- DB: `sqlite:loci.db` via `@tauri-apps/plugin-sql` ([`src/store/db.ts`](src/store/db.ts)).
- Schema: [`001_initial.sql`](src/store/migrations/001_initial.sql) + [`002_atom_type.sql`](src/store/migrations/002_atom_type.sql) applied from Rust migrations in `src-tauri/src/lib.rs`.
- Registry: [`src/store/files.store.ts`](src/store/files.store.ts) — metadata only; markdown stays on disk.
- Atoms: [`src/store/atoms.store.ts`](src/store/atoms.store.ts) — bookmark CRUD; `type` column `definition` | `note` | `reminder`.
- `App.tsx` calls `initDb()` when running in Tauri.
- **Smoke test** (after Stage 1 smoke, in `pnpm tauri dev` console):

```js
import('/src/lib/stage2RegistrySmoke.ts').then((m) => m.runStage2RegistrySmoke())
```

---

## Lexical plugins active in `Editor.tsx`

| Plugin | What it does now |
|--------|------------------|
| `RichTextPlugin` | Editable writing surface (`ContentEditable`, class `editor-root`) |
| `HistoryPlugin` | Undo / redo |
| `AutoFocusPlugin` | Focuses the editor on mount |
| `ListPlugin` | Required for bullet and numbered lists |
| `MarkdownPlugin` | Markdown **shortcuts while typing** (see below) |
| `PersistPlugin` | Debounced markdown export → `onSave` → `useDocument` |
| `SelectionSyncPlugin` | Reports selection to `EditorChromeContext` (bookmark bar visibility) |
| `ContextMenuPlugin` | Right-click **Bookmark** on selected text; range-scoped **Mark as mine** for paste provenance |
| `AuthorshipPlugin` | Paste intercept + markdown-span reconciliation for annotations |
| `AuthorshipOverlayPlugin` | Non-mutating runtime overlay for SQLite authorship ranges |
| `AtomDecorationPlugin` | Wraps saved atoms with `AtomNode` + CSS classes |
| `DefinitionScanPlugin` | Debounced **1200ms** scan for definition terms in document text |
| `AtomHoverPlugin` | Tooltip on decorated spans; delete via context callback |
| `FocusModePlugin` | Caret-driven `data-focus` on active Lexical block (dimming when `focus-active` on root) |

**Not mounted yet:** `AtomUnderlinePlugin` (superseded stub), `SelectionBarPlugin`.

**Layer rule:** editor plugins read from context only — never from `store/` directly. `EditorView` wires [`useEditorAtomBridge`](src/hooks/useEditorAtomBridge.ts) and [`useEditorAuthorshipBridge`](src/hooks/useEditorAuthorshipBridge.ts).

---

## Atom bookmarks (manual — live)

### Create

1. Select text in the editor.
2. **Right-click → Bookmark** or click **Bookmark** on the editor bar (always visible; disabled when nothing is selected).
3. Choose type: **Definition · Note · Reminder** (default Note).
4. Enter content → Save.

**Definition shortcut (live):** type `{term | definition}` then closing `}` — collapses to the term as a definition bookmark (no popup). Saved `.md` stores the term only; answer lives in SQLite. Does not run on file import. Max term **120** chars; max definition **2000** chars. Skips fenced code blocks and inline code.

Spans: context menu uses live markdown export; bar bookmark uses last saved markdown from `useDocument` (`findSpanInMarkdown`). Definition shortcut resolves spans after the Lexical replace via markdown export.

### Types

| Type | Decoration | Scope |
|------|------------|--------|
| Definition | Accent half-height wash (when highlight on) | Scanned globally after debounce — same `sourceText` decorates any document |
| Note | Neutral half-height wash (when highlight on) | Exact text match in owning document |
| Reminder | Softer accent half-height wash (when highlight on) | Same as note; future AI resurfacing in Atoms tab |

### Browse (Bookmarks tab)

- All bookmarks in one **Anki-style fixed-size flashcard grid** (no per-document scope). See `DESIGN LOCILITE.md` **Bookmarks tab**.
- Filter via Filter button popover; live search on `sourceText` (matches any member in a stack).
- Each card shows **document title only** at the bottom of front and back faces — no timestamps.
- **Stacks:** drop bookmark onto card/folder to merge (`group_label` UUID); grid shows **rounded folder tile** with golden-ratio fringes (opaque top-edge strips, not a filled blurb) + count (default name `Stack`, double-click label to rename); single click opens popup flashcard at same 20:12 shape scaled up (prev/next, flip, pen edit on back).

### Delete (confirm first — live)

| What | How |
|------|-----|
| Note | Editor bar ⋮ → **Delete note** (→ Home), or drag whole document row to bin on **Documents** |
| Bookmark | Drag whole flashcard/folder to bin on **Bookmarks**, or editor decoration tooltip delete. Browse card-back **pen** opens edit popup (type + answer) — not delete. |

Shared [`ConfirmDialog`](src/components/ui/ConfirmDialog.tsx); notes via [`useDeleteDocument`](src/hooks/useDeleteDocument.ts), bookmarks via [`useAtoms.removeAtom`](src/hooks/useAtoms.ts). Drag: whole row/card body (not a grip handle); [`writeDragPayload`](src/lib/deletePayload.ts) + [`browseDrag.ts`](src/lib/browseDrag.ts). Drag shows a **solid mini panel follower** ([`browseDragGhost.ts`](src/lib/browseDragGhost.ts)) anchored at the pointer — Chromium’s faded native drag image is suppressed; not the full row or flashcard. Stack merge: [`useBookmarkStacks`](src/hooks/useBookmarkStacks.ts) + [`bookmarkStacks.ts`](src/lib/bookmarkStacks.ts) (no confirm). Tauri requires `dragDropEnabled: false` on the main window for HTML5 DnD.

### Not wired yet

- AI atomise — not on editor bar; future via `ai/actions/atomise.ts`.
- AI-driven reminder resurfacing.
- Fuzzy/regex search; SQLite full-text index.

---

## Markdown shortcuts (while typing)

Triggered by `MarkdownShortcutPlugin` + transformers in `src/editor/config/markdownTransformers.ts`. Most block styles need a **trailing space** after the marker (Lexical default).

### Block elements

| You type | Result |
|----------|--------|
| `# ` … `###### ` | Heading h1–h6 (`#` = h1, `##` = h2, etc.) |
| `> ` | Blockquote |
| `- ` / `* ` / `+ ` | Unordered list |
| `1. ` | Ordered list |
| ` ``` ` (+ optional language line) | Fenced code block (close with ` ``` `) |
| `---` or `***` or `___` (line alone; Enter also works) | Horizontal rule |

### Inline text formats

| You type | Result |
|----------|--------|
| `**text**` | Bold |
| `*text*` | Italic |
| `***text***` | Bold + italic |
| `~~text~~` | Strikethrough |
| `{term \| definition}` + `}` | Definition bookmark — collapses to `term` (live typing only; not re-imported from disk) |

### Import on load

The same transformer set is used when `createEditorConfig(initialMarkdown)` runs `$convertFromMarkdownString` (e.g. opening a saved note). What you can type live is roughly what imports cleanly.

---

## Not supported in the editor yet

| Feature | Notes |
|---------|--------|
| Inline `` `code` `` shortcut | `INLINE_CODE` transformer not registered — only **fenced** code blocks |
| `__bold__` / `_italic_` | Underscore variants not in transformer list |
| Links `[text](url)` | `LINK` not registered |
| Task / checkbox lists `- [ ]` | `CHECK_LIST` not registered |
| Images, tables, footnotes | Out of product scope / custom node stubs not wired |
| Custom `editor/nodes/*` stubs (except `AtomNode`, `AuthorshipNode`) | Runtime uses `@lexical/rich-text`, `@lexical/list`, `@lexical/code`, `@lexical/extension` + `AtomNode` + `AuthorshipNode` |

---

## Plain editing (no markdown shortcut)

- Click and type in the document column.
- **Select** text with mouse or keyboard.
- **Copy / cut / paste** — standard browser behaviour; **paste** is recorded to `annotations` (SQLite) and rendered as non-persistent authorship decoration; toggle **Authorship** in ⋮ menu to show the authorship colour.
- **Undo / redo** — typically `Ctrl+Z` / `Ctrl+Shift+Z` (Windows) or `Cmd+Z` / `Cmd+Shift+Z` (macOS) via `HistoryPlugin`.
- **Line breaks** — `Enter` for new paragraph; `Shift+Enter` for soft line break (Lexical default).

---

## Editor chrome (UI only unless noted)

### Floating editor bar (`BottomBar`)

| Control | Status |
|---------|--------|
| **Bookmark** | Sole accent; always visible; disabled without selection; opens `AtomPopup` |
| **Outline** | Opens/closes overlay; headings parsed from saved markdown on load |
| **Prompt field** | Typable shell; no find/replace or AI |
| **⋮ menu → Focus** | `AppleToggle` wired to `useFocusMode` (chrome hide + block dimming) |
| **⋮ menu → Authorship** | `AppleToggle` wired to `useAuthorshipMode` — shows/hides authorship colour (session-only) |

### Titlebar (on editor view)

| Control | Status |
|---------|--------|
| **Loci / Workspace / Documents / Atoms** | Navigate away from editor |
| **Bookmarks** | Live flashcard grid (scoped by last `activeFileId`) |
| **Settings** | Opens settings page |
| **Sun / Moon** | Theme toggle (`useTheme` + `localStorage`) — works |
| **Profile** | Placeholder |

### Outline overlay

- Scrim click or **Outline** on bar closes panel.
- Header uses registry `title` (updated on save from H1).

---

## Styling

- Body: **Lora** (`--font-serif`) via `editor.css` + Lexical theme classes on `.editor-root`.
- Atom decorations: `.atom-definition`, `.atom-note`, `.atom-reminder` on decorated spans.
- Authorship paste colour: rendered from SQLite ranges by `AuthorshipOverlayPlugin`; visible when `.editor-root.authorship-visible` (overflow **Authorship** toggle). Authorship is visual-only and must not alter saved markdown or Lexical text nodes.
- Layout width: editor is fluid (`--editor-col-w` = viewport minus `--editor-gutter`, soft-capped at `64rem`); browse views use `--shell-content-max`.
- Shell chrome: `--shell-chrome-*` tokens in `tokens.css`; see `DESIGN LOCILITE.md` glassmorphism rules.

---

## Likely next wiring steps

1. `Atomise` → `ai/actions/atomise.ts` (AI flashcards — distinct from manual bookmarks)
2. AI authorship logging + rainbow wash (`source='ai'`)
3. `INLINE_CODE`, `LINK`, or task lists — only if product wants them
4. Outline driven from live Lexical heading nodes (today: parsed from saved markdown)
5. Fuzzy/regex browse search or SQLite FTS (v1 uses substring only)
