# ARCHITECTURE.md — Loci Lite
> Version: 1.0.0 · Status: Partial build (editor + atoms bookmark live) · Last updated: 2026-06-05

---

## What Loci Lite is

Loci Lite is a local-first markdown editor for students. The user writes in `.md` files stored on disk. The app adds on top of raw markdown: focus mode (paragraph dimming), authorship mode (paste provenance wash — AI reserved), manual **atom bookmarks** (definition / note / reminder slices saved from selected text), and future **atomisation** (AI-generated flashcard Q&A from selection). There is no sync, no collaboration, no image support, no heavy tables. The editor is the product.

UI colours are token-driven from `src/styles/tokens.css`. Dark mode follows the Charcoal Claude palette in `DESIGN LOCILITE.md`. Components never hardcode palette hex values. Shell layout widths are tokenized (`--shell-inset-x`, `--shell-content-max`, `--editor-col-w`); components must not hardcode browse or titlebar `rem` caps.

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Tauri | 2.x |
| Frontend framework | React | 19.x |
| Build tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| Editor | Lexical (`lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/code`, `@lexical/markdown`, `@lexical/extension`, `@lexical/utils`) | 0.45.x |
| Database | SQLite via `@tauri-apps/plugin-sql` (`sqlite:loci.db`) | 2.x |
| AI provider | OpenAI | (Anthropic: future) |
| Package manager | pnpm | latest |

---

## Layer structure

```
┌─────────────────────────────────────┐
│           React UI Layer            │  All visual components, editor shell, panels
├─────────────────────────────────────┤
│          Lexical Editor Layer       │  Editor state, plugins, nodes, markdown
├─────────────────────────────────────┤
│           Store Layer               │  SQLite access — files, atoms, settings
├─────────────────────────────────────┤
│            AI Layer                 │  OpenAI calls, atom generation
├─────────────────────────────────────┤
│           Tauri Layer               │  File system, native commands, window
└─────────────────────────────────────┘
```

**Communication rules:**
- UI calls Store hooks and AI actions directly — never Tauri commands directly
- Lexical plugins never import from Store or AI — they emit events, UI handles them
- Store is the only layer that touches `tauri-plugin-sql`
- AI layer is the only layer that calls OpenAI
- Tauri commands are invoked only from `src/lib/tauri.ts` — one file, all native calls

---

## Directory structure

```
loci-lite/
├── src/
│   │
│   ├── main.tsx                  # React root; imports tokens.css, scrollbars.css, transitions.css
│   ├── App.tsx                   # shell-header trigger + sidebar overlay + view-stage orchestration
│   │
│   ├── styles/
│   │   ├── tokens.css            # Colours + shell layout + transition timing tokens
│   │   ├── scrollbars.css        # Two-tier scrollbars: hidden shell, document overlay autohide
│   │   ├── transitions.css       # View/search/modal/sidebar keyframes (data-* driven)
│   │   ├── base.css              # Global reset + page foundation
│   │   ├── shell.css             # shell-header, window chrome, legacy titlebar, editor bar styles
│   │   ├── search-field.css        # Shared browse search field shell + Lucide clear control
│   │   ├── home.css              # Homepage shell and recent file cards
│   │   ├── documents.css         # Documents list and search styles
│   │   ├── atoms.css             # Bookmarks flashcard grid, filter popover, tooltip
│   │   ├── bookmark-stack-folder.css  # Stack folder tile (tab, pocket, fringes, rename)
│   │   ├── atom-popup.css        # Bookmark creation popup
│   │   ├── bookmark-stack-popup.css  # Stack folder popup card + navigation
│   │   ├── confirm-dialog.css    # Shared delete confirmation modal
│   │   ├── settings.css          # Settings page sections and rows
│   │   └── editor.css            # Lexical editor surface + atom/authorship overlay styling
│   │
│   ├── views/
│   │   ├── HomeView.tsx          # Welcome + recent/search via useSearchableDocuments
│   │   ├── DocumentsView.tsx     # All files list + live global search
│   │   ├── AtomsView.tsx         # Bookmark browse; live sourceText search + type filter
│   │   ├── SettingsView.tsx      # App settings, including local OpenAI key receiver
│   │   └── EditorView.tsx        # Editor + atom/authorship bridges, popup, outline, BottomBar
│   │
│   ├── editor/
│   │   ├── Editor.tsx            # Lexical composer + plugin assembly
│   │   ├── context/
│   │   │   ├── AtomEditorContext.tsx     # Atom data + delete callback into plugins
│   │   │   ├── AuthorshipEditorContext.tsx  # Annotation list + paste/reconcile/remove callbacks
│   │   │   └── EditorChromeContext.tsx   # Selection, bookmark, definition-shortcut callbacks
│   │   ├── lib/
│   │   │   ├── applyAtomDecorations.ts   # Wrap matching text with AtomNode
│   │   │   ├── applyAuthorshipDecorations.ts  # Legacy authorship unwrap facade
│   │   │   ├── authorshipIndex.ts       # Text index for markdown-offset authorship matching
│   │   │   ├── authorshipNodeOps.ts     # Legacy AuthorshipNode unwrap helpers
│   │   │   ├── editorUpdateTags.ts      # Non-persistent decoration update tags
│   │   │   ├── definitionShortcutBridge.ts  # Handler registry for Lexical → React (no store)
│   │   │   ├── definitionShortcutReplace.ts   # $replaceDefinitionShortcut guards + AtomNode swap
│   │   │   ├── definitionShortcutLimits.ts    # Max term/definition lengths
│   │   │   ├── definitionShortcutRevert.ts  # $revertDefinitionShortcut on save failure
│   │   │   └── resolvePasteSpan.ts         # Paste text collection + markdown span resolution
│   │   ├── nodes/
│   │   │   ├── HeadingNode.ts            # Stubs — not registered at runtime
│   │   │   ├── CodeNode.ts
│   │   │   ├── QuoteNode.ts
│   │   │   ├── ListNode.ts
│   │   │   ├── TaskNode.ts
│   │   │   ├── FootnoteNode.ts
│   │   │   ├── AtomNode.ts               # Live: inline bookmark span (registered)
│   │   │   └── AuthorshipNode.ts        # Legacy compatibility node (registered, not newly created)
│   │   ├── plugins/
│   │   │   ├── MarkdownPlugin.tsx        # MarkdownShortcutPlugin wrapper (live)
│   │   │   ├── DefinitionShortcutPlugin.tsx  # Registers onDefinitionShortcut into bridge (live)
│   │   │   ├── PersistPlugin.tsx         # Debounced save via onSave callback (live)
│   │   │   ├── SelectionSyncPlugin.tsx   # Selection state to editor chrome (live)
│   │   │   ├── ContextMenuPlugin.tsx     # Right-click Bookmark + Mark as mine (live)
│   │   │   ├── AtomDecorationPlugin.tsx  # Apply AtomNode from context (live)
│   │   │   ├── DefinitionScanPlugin.tsx  # Debounced definition scan (live)
│   │   │   ├── AtomHoverPlugin.tsx       # Tooltip on decorated spans (live)
│   │   │   ├── FocusModePlugin.ts        # Live: caret-driven block dimming (data-focus)
│   │   │   ├── TypewriterScrollPlugin.tsx  # Live: anchor-gated caret lock scroll
│   │   │   ├── AuthorshipPlugin.tsx      # Live: paste recording + markdown span reconciliation
│   │   │   ├── AuthorshipOverlayPlugin.tsx # Live: non-mutating authorship range renderer
│   │   │   ├── AtomUnderlinePlugin.ts    # Superseded stub — not mounted
│   │   │   └── SelectionBarPlugin.ts     # Planned: selection action bar
│   │   ├── sound/
│   │   │   └── typewriterSound.ts        # Web Audio keyclick singleton
│   │   └── config/
│   │       ├── lexicalConfig.ts          # Package nodes + AtomNode + AuthorshipNode, theme, seed markdown
│   │       ├── markdownTransformers.ts   # Shortcut + import transformer set (subset)
│   │       └── definitionShortcutTransformer.ts  # DEFINITION_SHORTCUT TextMatchTransformer
│   │
│   ├── components/
│   │   ├── shell/
│   │   │   ├── WindowChrome.tsx    # Hover-revealed Windows drag strip + traffic-light controls
│   │   │   ├── TitleBar.tsx        # Legacy titlebar nav component (superseded by sidebar)
│   │   │   ├── ShellSidebarTrigger.tsx # Minimal app-menu trigger in shell header
│   │   │   ├── ShellSidebar.tsx    # Portaled slide-over sidebar overlay
│   │   │   ├── ShellSidebarNav.tsx # Former titlebar actions in sidebar form
│   │   │   ├── ShellSidebarLibrary.tsx # Searchable document list inside sidebar
│   │   │   ├── TransitionShell.tsx   # data-view / data-state / data-transition wrapper
│   │   │   ├── BottomBar.tsx         # Composes bookmark, outline, prompt, menu
│   │   │   ├── EditorPromptBar.tsx   # Prompt/find field (UI shell)
│   │   │   ├── EditorBarMenu.tsx     # Ellipsis popup + mode toggles
│   │   │   └── FocusExitButton.tsx   # Focus mode exit control (‹)
│   │   ├── home/
│   │   │   ├── WelcomeHeading.tsx    # AI-cached prose welcome heading
│   │   │   ├── HomeQuickActions.tsx  # New note + Bookmarks quick-action row
│   │   │   └── RecentFiles.tsx       # Search, View all, recent/search result cards
│   │   ├── atoms/
│   │   │   ├── AtomCard.tsx        # Flip flashcard for solo bookmarks
│   │   │   ├── AtomPanel.tsx       # Grid: solo flashcards + stack folders
│   │   │   ├── AtomPopup.tsx       # Create + edit bookmark popup
│   │   │   ├── AtomTooltip.tsx     # Hover tooltip on decorated editor spans
│   │   │   ├── BookmarkFilterMenu.tsx  # Filter popover for bookmark types
│   │   │   ├── BookmarkFlashcardFaces.tsx  # Shared front/back faces for card + stack popup
│   │   │   ├── BookmarkStackFolder.tsx  # CSS folder tile (click popup, dblclick rename)
│   │   │   ├── BookmarkStackNameEditor.tsx  # Shared inline stack name rename (grid + popup)
│   │   │   ├── BookmarkStackPopup.tsx  # Stack viewer (scaled card, prev/next/shuffle flip)
│   │   │   ├── BookmarkStackPopupCard.tsx  # Popup flashcard shell + data-stack-enter switch
│   │   │   ├── BookmarkStackPopupNav.tsx  # Stack popup prev/next/shuffle controls
│   │   │   └── bookmarkCardDrop.ts     # Card/folder drop handlers for stacking
│   │   ├── settings/
│   │   │   ├── SettingsSection.tsx # Settings section heading + rows
│   │   │   └── SettingsRow.tsx     # Label, description, control slot
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Toggle.tsx
│   │       ├── AppleToggle.tsx     # iOS-style switch control
│   │       ├── ConfirmDialog.tsx   # Destructive action confirmation modal
│   │       ├── BrowseDeleteBin.tsx # Drag-to-delete drop target (Documents, Bookmarks)
│   │       ├── SearchField.tsx     # Shared browse search with Lucide clear button
│   │       └── ContextMenu.tsx
│   │
│   ├── hooks/
│   │   ├── useDocument.ts          # Open, save, close a document
│   │   ├── useWindowChrome.ts      # Min/max/close/drag, isMaximized, hover-reveal state (Tauri desktop)
│   │   ├── useRecentFiles.ts       # Legacy; superseded on Home by useSearchableDocuments
│   │   ├── useDocumentsList.ts     # Legacy; superseded on Documents by useSearchableDocuments
│   │   ├── useSearchableDocuments.ts  # All registry files + markdown haystack for live search
│   │   ├── useSearchStagger.ts     # Search list leave delay + displayed items (Home, Documents)
│   │   ├── useViewTransition.ts    # View navigation state machine (sole routing owner)
│   │   ├── useShellSidebarGesture.ts # Sidebar shortcut + guarded horizontal trackpad gestures
│   │   ├── useLastDocumentReturn.ts # Most-recent document return from Home swipe
│   │   ├── useDocumentScrollRestore.ts # Per-document editor scroll restore
│   │   ├── useCreateDocument.ts    # create_note + insertFile
│   │   ├── useDeleteDocument.ts    # delete_file (disk) + files.store deleteFile
│   │   ├── useAtoms.ts             # Atom CRUD + load for file / all / definitions
│   │   ├── useBookmarkStacks.ts    # Drop-to-merge bookmarks via group_label
│   │   ├── useStackDisplayNames.ts # Load/rename stack folder display names
│   │   ├── useAtomCreation.ts      # Bookmark popup; delegates to atomRecord helpers
│   │   ├── useEditorAtomBridge.ts  # Composes atom hooks for EditorView
│   │   ├── useEditorAuthorshipBridge.ts  # Loads annotations; paste/remove for EditorView
│   │   ├── useFileTitle.ts         # Document title for Atoms scope line
│   │   ├── useDocumentTitles.ts    # Batch-resolve files.title for bookmark cards
│   │   ├── useBottomBar.ts         # Editor bar font/find/label state
│   │   ├── useFindHighlight.ts     # DOM/CSS Highlight find overlays from EditorView
│   │   ├── useBookmarkHighlight.ts # Bookmark highlight toggle on .editor-root
│   │   ├── useDocumentScrollbar.ts # Document scroll autohide (html.is-scrolling)
│   │   ├── useEditorChromeEntry.ts # Post-load note entry chrome slide (chrome-offstage)
│   │   ├── useFocusMode.ts         # Focus mode toggle + active paragraph state
│   │   ├── useTypewriterMode.ts    # Typewriter scroll toggle + sound playback gate
│   │   ├── useTypewriterSoundSetting.ts  # SQLite typewriter_sound read/write for Settings + editor
│   │   ├── useDefaultEditorFontSetting.ts  # Editor font preset (classic/modern/typewriter) boot + Settings
│   │   ├── useDefaultFontSizeSetting.ts  # App-wide default editor font size for Settings
│   │   ├── useAuthorshipMode.ts    # Authorship visibility toggle on .editor-root (session-only)
│   │   ├── useAiWelcomeMessages.ts # Cached 5-message AI welcome rotation
│   │   ├── useOpenAIKeySetting.ts  # Local OpenAI key setting
│   │   ├── useSettings.ts          # App settings read/write
│   │   └── useTheme.ts             # Light/dark theme toggle + persistence
│   │
│   ├── store/
│   │   ├── db.ts                   # SQLite connection + migration runner
│   │   ├── migrations/
│   │   │   ├── 001_initial.sql     # Schema: files, atoms, annotations, settings
│   │   │   ├── 002_atom_type.sql   # atoms.type column (definition/note/reminder)
│   │   │   └── 003_file_edited_at.sql # files.edited_at for latest edited source
│   │   ├── files.store.ts          # File registry queries
│   │   ├── atoms.store.ts          # Atom CRUD queries
│   │   ├── stackNames.store.ts     # Stack display names in settings KV
│   │   ├── annotations.store.ts    # Authorship annotation queries
│   │   └── settings.store.ts       # Settings queries
│   │
│   ├── ai/
│   │   ├── providers/
│   │   │   └── openai.ts           # OpenAI client setup + base call
│   │   └── actions/
│   │       ├── atomise.ts          # Selection → prompt → atom(s) response
│   │       └── writeWelcomeMessages.ts # Latest writing doc → 5 welcome messages
│   │
│   └── lib/
│       ├── renderAppPage.tsx       # Maps ViewName → view components for transition shells
│       ├── env.ts                  # Vite env validation; ENV + hasRemote for Supabase (offline-first when unset)
│       ├── tauri.ts                # All Tauri command + window API invocations (one file)
│       ├── documentMeta.ts         # Slug, title, excerpt, outline helpers
│       ├── scrollEditorTarget.ts   # Token-driven eased scroll (find + outline); typewriter excluded
│       ├── outlineNavigation.ts    # Outline entries + scroll-to-heading in editor DOM
│       ├── searchMatch.ts          # Case-insensitive browse search matching
│       ├── deletePayload.ts        # writeDragPayload / readDragPayload for browse delete DnD
│       ├── browseDrag.ts           # startBrowseDrag / endBrowseDrag; html.is-browse-dragging
│       ├── browseDragGhost.ts      # Full-opacity drag follower panel (blank native ghost)
│       ├── bookmarkStacks.ts       # Stack merge plan + grid grouping by group_label
│       ├── seedDocuments.ts        # First-run welcome docs (Tauri only)
│       ├── formatRelativeTime.ts   # opened_at + created_at relative labels
│       ├── welcomeWritingSource.ts # Markdown heuristic for writing-like documents
│       ├── atomTypes.ts            # AtomType, AtomRecord, CreateAtomInput
│       ├── atomRecord.ts           # buildAtomRecord + saveAtomRecord (popup + shortcut)
│       ├── definitionShortcutSave.ts  # persistDefinitionShortcut for bridge handler
│       ├── atomLabels.ts           # Type labels and filter pill options
│       ├── atomSpans.ts            # Find selection offsets in markdown export
│       ├── atomDecorations.ts      # AtomRecord → AtomEditorContext item
│       ├── theme.ts                # Theme resolve/apply on documentElement
│       ├── markdown.ts             # Markdown parse/serialise utilities
│       ├── stage1FileSmoke.ts      # Dev console smoke: Tauri file I/O (see notes.md)
│       ├── stage2RegistrySmoke.ts  # Dev console smoke: SQLite file registry (see notes.md)
│       └── utils.ts                # Shared pure utilities
│
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/
│   │   │   ├── file.rs             # read_file, write_file, pick_file, list_dir
│   │   │   └── window.rs           # Reserved; window chrome uses JS API via lib/tauri.ts
│   │   └── lib.rs                  # Command registration; Windows set_decorations(false) in setup
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── index.html                      # Vite runtime entry
├── notes.md                        # Non-canonical editor behaviour scratch notes
├── ARCHITECTURE.md                 # This file
├── DESIGN.md
├── RULES.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

---

## Data model

### SQLite schema (`001_initial.sql`)

```sql
-- Registered documents
CREATE TABLE files (
  id          TEXT PRIMARY KEY,  -- uuid
  path        TEXT NOT NULL UNIQUE,
  title       TEXT,
  opened_at   INTEGER NOT NULL,  -- unix ms
  created_at  INTEGER NOT NULL,
  edited_at   INTEGER NOT NULL   -- 003_file_edited_at.sql; updated on save
);

-- Atoms derived from a document (bookmarks + future AI atomise output)
CREATE TABLE atoms (
  id           TEXT PRIMARY KEY,  -- uuid
  file_id      TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'note'
                 CHECK(type IN ('definition', 'note', 'reminder')),  -- 002_atom_type.sql
  question     TEXT NOT NULL,     -- highlighted source text at save time
  answer       TEXT NOT NULL,     -- user definition / note / reminder content
  source_text  TEXT NOT NULL,     -- same as question for bookmarks
  group_label  TEXT,              -- bookmark stack UUID (null = solo); no separate stack table in v1
  span_start   INTEGER,           -- character offset in .md source (nullable)
  span_end     INTEGER,
  created_at   INTEGER NOT NULL
);

-- Authorship annotations (provenance)
CREATE TABLE annotations (
  id          TEXT PRIMARY KEY,
  file_id     TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  span_start  INTEGER NOT NULL,
  span_end    INTEGER NOT NULL,
  source      TEXT NOT NULL CHECK(source IN ('ai', 'paste')),
  created_at  INTEGER NOT NULL
);

-- App-level settings (key/value)
CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
```

**Source of truth:** `.md` file on disk. SQLite holds derived and supplementary data only. `opened_at` is recency/navigation metadata; `edited_at` is save recency for features such as AI welcome source selection. If the DB is deleted, documents are not lost.

---

## Key mechanisms

### Editor core (implemented)

- **`Editor.tsx`** — assembles Lexical core + atom plugins + `PersistPlugin`; wraps `AtomEditorProvider` / `EditorChromeProvider`; no plugin logic in this file.
- **`lexicalConfig.ts`** — registers Lexical **package** nodes: `HeadingNode`, `QuoteNode` (`@lexical/rich-text`); `ListNode`, `ListItemNode` (`@lexical/list`); `CodeNode`, `CodeHighlightNode` (`@lexical/code`); `HorizontalRuleNode` (`@lexical/extension`). Exports `createEditorConfig(initialMarkdown?)` which seeds the document via `$convertFromMarkdownString` when markdown is provided.
- **`markdownTransformers.ts`** — `HR`, `HEADING`, `QUOTE`, `UNORDERED_LIST`, `ORDERED_LIST`, `CODE`, `BOLD_ITALIC_STAR`, `BOLD_STAR`, `ITALIC_STAR`, `STRIKETHROUGH`. Does not include `LINK`, `CHECK_LIST`, `INLINE_CODE`, or underscore variants.
- **`EditorView.tsx`** — loads a document by `fileId` via `useDocument`; passes disk markdown into `<Editor key={fileId} />`; outline title from registry `title`, headings parsed from saved markdown; wires `BottomBar` state and shortcuts without Lexical/plugin store access.
- **`App.tsx`** — `useViewTransition` + `navigateTo` for routing; tracks `activeFileId` separately; **New note** creates a file and opens the editor; editor view requires a selected `fileId`.
- Scratch reference for current editor behaviour: [`notes.md`](notes.md) (non-canonical).

### Document registry and disk I/O (implemented — Stages 1–2)

- **Tauri commands** ([`src-tauri/src/commands/file.rs`](src-tauri/src/commands/file.rs)): `get_notes_dir`, `create_note`, `read_file`, `write_file`, `delete_file`. Notes directory: `{appDataDir}/notes/`. `create_note` slugifies paths (aligned with [`src/lib/documentMeta.ts`](src/lib/documentMeta.ts)). `delete_file` validates path is under notes dir before `fs::remove_file`.
- **Frontend bridge** ([`src/lib/tauri.ts`](src/lib/tauri.ts)): sole `invoke()` and `@tauri-apps/api/window` site; exports `isTauri`.
- **SQLite** ([`src/store/db.ts`](src/store/db.ts)): `initDb()` loads `sqlite:loci.db`; migrations v1–v3 from [`src/store/migrations/`](src/store/migrations/) registered in [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs).
- **File registry** ([`src/store/files.store.ts`](src/store/files.store.ts)): `insertFile`, `getFileById`, `touchOpenedAt`, `touchEditedAt`, `updateTitle`, `listRecentFiles`, `listAllFiles`, `listFilesByEditedAt`, `deleteFile` — metadata only; `.md` body on disk is source of truth.
- **List refresh:** `App.tsx` `libraryRevision` counter bumps on create/delete; passed as `listRefreshKey` to browse views (replaces using `activeFileId` as refresh signal).
- **`App.tsx`** calls `initDb()` once when `isTauri()` (not in Vite-only browser).
- **Stage 4 (browse UI):** [`useSearchableDocuments.ts`](src/hooks/useSearchableDocuments.ts) loads all registry files + markdown haystack via `readFile`; [`matchesSearch`](src/lib/searchMatch.ts) filters client-side on keystroke. **Home:** AI-cached prose welcome via [`useAiWelcomeMessages.ts`](src/hooks/useAiWelcomeMessages.ts), recent 10 when search empty, global title+body search when query present ([`HomeView.tsx`](src/views/HomeView.tsx) + [`RecentFiles.tsx`](src/components/home/RecentFiles.tsx)); [`HomeQuickActions.tsx`](src/components/home/HomeQuickActions.tsx) for New note + Bookmarks; **View all** opens Documents via `App.tsx` `onOpenDocuments`. **Documents:** live global search ([`DocumentsView.tsx`](src/views/DocumentsView.tsx)); Filter button remains UI shell. `App.tsx` `handleOpenEditor(fileId)`; previews via [`excerptFromMarkdown`](src/lib/documentMeta.ts). List rows use [`useSearchStagger.ts`](src/hooks/useSearchStagger.ts) + `data-stagger` / `--stagger-index` ([`transitions.css`](src/styles/transitions.css)).
- **First-run seed:** [`seedDocuments.ts`](src/lib/seedDocuments.ts) — after `initDb()`, if `settings.seed.docs_v1` is unset and the file registry is empty, writes two onboarding `.md` notes (`welcome-to-loci-lite`, `what-works-today`) via `create_note` + `insertFile`. Skipped when the user already has registry rows.

### Delete flows (implemented)

All destructive actions gate on [`ConfirmDialog.tsx`](src/components/ui/ConfirmDialog.tsx) before store/Tauri calls. [`App.tsx`](src/App.tsx) `handleDocumentDeleted(fileId, source)` clears `activeFileId` when the deleted note was open, bumps `libraryRevision`, and navigates **Home** only when `source === 'editor'`.

**Note delete** ([`useDeleteDocument.ts`](src/hooks/useDeleteDocument.ts)): `getFileById` → `delete_file` (disk) → `files.store` `deleteFile` (SQLite cascade removes atoms/annotations for that `file_id`).

| Entry point | View / component | After confirm |
|-------------|------------------|---------------|
| Editor overflow **Delete note** | [`EditorBarMenu.tsx`](src/components/shell/EditorBarMenu.tsx) → [`EditorView.tsx`](src/views/EditorView.tsx) | `App.tsx` clears `activeFileId` if match, bumps `libraryRevision`, navigates **Home** |
| Drag row → bin | [`DocumentsView.tsx`](src/views/DocumentsView.tsx) + [`BrowseDeleteBin.tsx`](src/components/ui/BrowseDeleteBin.tsx) | Stays on Documents; clears `activeFileId` if deleted note was open |

**Browse drag-and-drop:**

- Tauri main window sets `"dragDropEnabled": false`, `"scrollBarStyle": "fluentOverlay"`, and user-facing `"title": "Loci Notepad"` in [`tauri.conf.json`](src-tauri/tauri.conf.json). Windows disables native decorations in [`lib.rs`](src-tauri/src/lib.rs) setup; custom chrome in [`WindowChrome.tsx`](src/components/shell/WindowChrome.tsx). Capabilities grant window minimize/maximize/close/drag permissions.
- Drag sources: whole `.document-row` shell (`div`, not `<button>`) and whole `.bookmark-flashcard` (`article`) — no separate drag handles.
- Payload: [`writeDragPayload`](src/lib/deletePayload.ts) / [`readDragPayload`](src/lib/deletePayload.ts) — MIME `application/x-loci-delete` plus `text/plain` JSON fallback for WebView2.
- Session: [`browseDrag.ts`](src/lib/browseDrag.ts) toggles `html.is-browse-dragging` and suppresses click-after-drag via `consumeBrowseDragClick`.
- Drag follower: [`browseDragGhost.ts`](src/lib/browseDragGhost.ts) builds `.browse-drag-ghost.is-follower` (reused DOM node), suppresses Chromium’s faded native drag bitmap with a 1×1 `setDragImage`, and anchors the panel at the pointer (`left: clientX`, `top: clientY`) on `document` `drag` so the preview stays fully opaque.
- Drop (delete): [`BrowseDeleteBin.tsx`](src/components/ui/BrowseDeleteBin.tsx) — `dragenter` + `dragover` preventDefault, `.is-drop-target` highlight.
- Drop (stack): [`bookmarkCardDrop.ts`](src/components/atoms/bookmarkCardDrop.ts) on [`AtomCard.tsx`](src/components/atoms/AtomCard.tsx) and [`BookmarkStackFolder.tsx`](src/components/atoms/BookmarkStackFolder.tsx) — bookmark onto card/folder merges via [`useBookmarkStacks.ts`](src/hooks/useBookmarkStacks.ts) + [`bookmarkStacks.ts`](src/lib/bookmarkStacks.ts); updates `atoms.group_label` in SQLite (no confirm). `dragover`/`dragenter` use `dataTransfer.types` + [`getActiveBrowseDragPayload`](src/lib/browseDrag.ts) (`getData` is empty until `drop`); `html.is-browse-dragging` sets `pointer-events: none` on flashcard/folder innards so the `article` shell receives drops.

**Bookmark delete** ([`useAtoms.removeAtom`](src/hooks/useAtoms.ts) after confirm):

| Entry point | Component | After confirm |
|-------------|-----------|---------------|
| Drag card → bin | [`AtomsView.tsx`](src/views/AtomsView.tsx) + [`BrowseDeleteBin.tsx`](src/components/ui/BrowseDeleteBin.tsx) | Reload bookmark grid |
| Editor tooltip X | [`AtomHoverPlugin.tsx`](src/editor/plugins/AtomHoverPlugin.tsx) → `requestDeleteAtom` → [`EditorView.tsx`](src/views/EditorView.tsx) confirm | `removeAtom` + `loadForFile` |

**Bookmark edit (browse — no confirm):**

| Entry point | Component | Persist |
|-------------|-----------|---------|
| Card back pen | [`AtomCard.tsx`](src/components/atoms/AtomCard.tsx) → `onRequestEdit` in [`AtomsView.tsx`](src/views/AtomsView.tsx) | [`AtomPopup`](src/components/atoms/AtomPopup.tsx) edit mode → `updateAtom` in [`atoms.store.ts`](src/store/atoms.store.ts) via [`AtomsView.tsx`](src/views/AtomsView.tsx) (`AtomSavePayload`: type, answer, sourceText) |
| Stack popup back pen | [`BookmarkStackPopup.tsx`](src/components/atoms/BookmarkStackPopup.tsx) → same | Same |

Shared bin styles: `.browse-delete-bin` in [`base.css`](src/styles/base.css) (Documents + Bookmarks).

### Shell chrome (transparent glass)

- **Tokens** ([`src/styles/tokens.css`](src/styles/tokens.css)): low-alpha `--shell-chrome-bg` / `--shell-chrome-bg-strong`, `transparent` border, `20px` blur per light/dark theme. `html.is-tauri` (from [`src/main.tsx`](src/main.tsx) via `isTauri()`) does not override opacity. `@supports not (backdrop-filter: …)` applies a modest legibility bump only when blur is unavailable.
- **Styles:** [`shell.css`](src/styles/shell.css) (titlebar, editor bar; no chrome `box-shadow`), [`base.css`](src/styles/base.css) + browse views (cards/rows/search), [`editor.css`](src/styles/editor.css) (Lexical surface, outline, atom/authorship decorations). Scrim stays a flat `color-mix` overlay without blur. Hovers use `color-mix` between bg tokens, not full-strength strong fill.
- **Out of scope v1:** native window transparency, Mica, Acrylic. Visual sign-off uses **`corepack pnpm tauri dev`** — see-through panels over `--bg`, not milky cards.

### Authorship mode (implemented — paste v1)

Paste provenance only in v1. AI `source='ai'` is reserved in schema; no AI wash or logging yet.

**Layer boundary (hard):** Lexical plugins **never** import `store/` or `ai/`. [`useEditorAuthorshipBridge.ts`](src/hooks/useEditorAuthorshipBridge.ts) in [`EditorView.tsx`](src/views/EditorView.tsx) loads annotations via [`annotations.store.ts`](src/store/annotations.store.ts), then passes data and callbacks through [`AuthorshipEditorContext.tsx`](src/editor/context/AuthorshipEditorContext.tsx).

**Paste flow:**
1. [`AuthorshipPlugin.tsx`](src/editor/plugins/AuthorshipPlugin.tsx) registers `PASTE_COMMAND` at `COMMAND_PRIORITY_LOW`, returns `false` (Lexical handles paste); `registerUpdateListener` on `PASTE_TAG` records after insert.
2. Plugin exports markdown via `$convertToMarkdownString` + [`markdownTransformers.ts`](src/editor/config/markdownTransformers.ts); resolves span with last occurrence of pasted plain text in markdown.
3. `onPasteRecorded` on context → bridge `createAnnotation` (`source='paste'`, `crypto.randomUUID()`).
4. [`AuthorshipOverlayPlugin.tsx`](src/editor/plugins/AuthorshipOverlayPlugin.tsx) maps SQLite markdown spans to current text ranges and renders a runtime overlay. It does not create `AuthorshipNode`s, split text, or store provenance on `AtomNode`.

**Reload on open:** when `fileId` / `annotations` change, the overlay re-renders from SQLite offsets. [`AuthorshipNode.ts`](src/editor/nodes/AuthorshipNode.ts) stays registered only so old in-memory states can be unwrapped safely.

**Visibility toggle:** [`useAuthorshipMode.ts`](src/hooks/useAuthorshipMode.ts) — loads app default from `editor_default_authorship` on note open; overflow **Authorship** `AppleToggle` overrides for the current note session only. Toggles `authorship-visible` on `.editor-root`. Paste is **always** recorded; toggle gates CSS wash per [`DESIGN LOCILITE.md`](DESIGN%20LOCILITE.md). Wired through overflow in [`EditorBarMenu.tsx`](src/components/shell/EditorBarMenu.tsx) via [`BottomBar.tsx`](src/components/shell/BottomBar.tsx).

**Decoration isolation:** authorship overlay rendering does not mutate Lexical content. Atom decoration updates are tagged with [`NON_PERSISTENT_DECORATION_TAG`](src/editor/lib/editorUpdateTags.ts), and [`PersistPlugin.tsx`](src/editor/plugins/PersistPlugin.tsx) ignores that tag.

**Mark as mine:** [`ContextMenuPlugin.tsx`](src/editor/plugins/ContextMenuPlugin.tsx) computes selected/clicked markdown offsets, finds intersecting annotations from context, and sends `{ annotationId, spanStart, spanEnd }`. The bridge subtracts that range in SQLite, preserving surrounding pasted text and bookmark nodes.

**Styles:** `--authorship-paste-wash` / `--authorship-paste-wash-hover` in [`tokens.css`](src/styles/tokens.css) plus readable fallback tokens; [`editor.css`](src/styles/editor.css) styles `::highlight(loci-authorship-paste)` and the passive overlay fallback. Coexists with focus, typewriter, and bookmark-highlight classes on `.editor-root`.

**Persist:** annotations are SQLite-only. Saved `.md` remains plain prose with no provenance markers.

**Verification** (`corepack pnpm tauri dev`):

1. `corepack pnpm exec tsc --noEmit` && `corepack pnpm run build`
2. Paste text → row in `annotations` (`source='paste'`); overlay appears when Authorship is on
3. Overflow **Authorship** on → authorship colour; off → colour hidden, text unchanged
4. Close and reopen note → decorations restore from SQLite when toggle on
5. Select washed words → right-click → **Mark as mine** → only selected range loses authorship; reopen confirms
6. Plain typing → no new annotation rows
7. Focus + typewriter + authorship + bookmark highlight together → independent `.editor-root` classes, no conflicts
8. Saved `.md` on disk contains pasted plain text only (no authorship syntax)

### Focus mode (implemented)
- [`useFocusMode.ts`](src/hooks/useFocusMode.ts) in [`EditorView.tsx`](src/views/EditorView.tsx): loads app default from `editor_default_focus_mode` on note open; overflow toggle overrides for the current note session; toggles `focus-active` on `.editor-root`; `focus-mode-active` on `document.body` (`.shell-header` + `.editor-bar` slide off-screen); `Escape` exits
- [`FocusModePlugin.ts`](src/editor/plugins/FocusModePlugin.ts): runs only when `EditorChromeContext.isFocusMode` is true; on editor updates, resolves the caret’s block via `selection.anchor.getNode().getTopLevelElement()`; sets `data-focus="true"` on that DOM node through `editor.getElementByKey()`; clears attributes on exit; **no** `store/` or `ai/` imports
- [`FocusExitButton.tsx`](src/components/shell/FocusExitButton.tsx): fixed top-left `‹`; portaled to `document.body`; visible only in focus mode
- Toggle: overflow **Focus** `AppleToggle` in [`EditorBarMenu.tsx`](src/components/shell/EditorBarMenu.tsx), wired through [`BottomBar.tsx`](src/components/shell/BottomBar.tsx) (`isFocusMode` / `onFocusModeToggle`)
- Styles in [`editor.css`](src/styles/editor.css): non-active Lexical block theme classes dim to 18% opacity; caret block at 100%; asymmetric opacity transitions (380ms out / 240ms in); chrome slide 360ms `var(--ease-out)`

### Typewriter mode (implemented)
- [`useTypewriterMode.ts`](src/hooks/useTypewriterMode.ts) in [`EditorView.tsx`](src/views/EditorView.tsx): session `isActive` default off; toggles `typewriter-active` on `.editor-root`; composes [`useTypewriterSoundSetting.ts`](src/hooks/useTypewriterSoundSetting.ts) for SQLite `typewriter_sound` (default off)
- [`TypewriterScrollPlugin.tsx`](src/editor/plugins/TypewriterScrollPlugin.tsx): when `active`, anchor-gated `registerUpdateListener` + rAF; measures caret Y; `window.scrollBy({ behavior: 'instant' })` (editor view uses `overflow: visible` on `[data-view]` per [`transitions.css`](src/styles/transitions.css)) — **no scroll lock**, snap on caret move only
- [`typewriterSound.ts`](src/editor/sound/typewriterSound.ts): Web Audio bandpassed noise burst; `resumeContext()` on first keydown; no store/Lexical imports
- Toggle: overflow **Typewriter** `AppleToggle` in [`EditorBarMenu.tsx`](src/components/shell/EditorBarMenu.tsx) — not a bar text pill
- Sound: **Settings only** — **Typewriter sounds** row in [`SettingsView.tsx`](src/views/SettingsView.tsx); playback when typewriter mode on **and** `soundOn`
- Coexists with focus mode — separate CSS classes (`typewriter-active` padding vs `focus-active` opacity)

### Atoms bookmark system (implemented)

Manual bookmarks with three types — **definition**, **note**, **reminder** — stored in SQLite (`atoms` table, migration `002_atom_type.sql`). AI atomisation (`ai/actions/atomise.ts`) is separate and not wired yet.

**Layer boundary (hard):** Lexical plugins **never** import `store/` or `ai/`. [`useEditorAtomBridge.ts`](src/hooks/useEditorAtomBridge.ts) in `EditorView` loads atoms via [`useAtoms.ts`](src/hooks/useAtoms.ts), then passes data and callbacks through [`AtomEditorContext.tsx`](src/editor/context/AtomEditorContext.tsx) and [`EditorChromeContext.tsx`](src/editor/context/EditorChromeContext.tsx).

**Creation flow:**
1. User selects text in the editor.
2. **Bookmark** via right-click ([`ContextMenuPlugin.tsx`](src/editor/plugins/ContextMenuPlugin.tsx)).
3. [`useAtomCreation.ts`](src/hooks/useAtomCreation.ts) opens [`AtomPopup.tsx`](src/components/atoms/AtomPopup.tsx) (create mode); save passes full `AtomSavePayload` (`type`, `sourceText`, `content`) through [`atomRecord.ts`](src/lib/atomRecord.ts) `buildAtomRecord` + `saveAtomRecord` → [`atoms.store.ts`](src/store/atoms.store.ts) `createAtom`. Browse edit reuses the same popup via [`AtomsView.tsx`](src/views/AtomsView.tsx) + `updateAtom` (includes optional `sourceText`).
4. New decoration applied immediately via `createdAtom` on context (no reload).

**Definition typing shortcut (live — collapsed disk):**
- Syntax: `{term | definition}` then closing `}` — live `TextMatchTransformer` only (no `importRegExp` on file load).
- [`definitionShortcutTransformer.ts`](src/editor/config/definitionShortcutTransformer.ts) + [`definitionShortcutReplace.ts`](src/editor/lib/definitionShortcutReplace.ts) swap matched text for `AtomNode` showing the term; skips code blocks and existing atom nodes.
- [`definitionShortcutBridge.ts`](src/editor/lib/definitionShortcutBridge.ts) + [`DefinitionShortcutPlugin.tsx`](src/editor/plugins/DefinitionShortcutPlugin.tsx) forward to `onDefinitionShortcut` on [`EditorChromeContext.tsx`](src/editor/context/EditorChromeContext.tsx) — plugins never import `store/`.
- [`DefinitionShortcutPlugin.tsx`](src/editor/plugins/DefinitionShortcutPlugin.tsx) resolves `spanStart` / `spanEnd` via `$convertToMarkdownString` + [`findSpanInMarkdown`](src/lib/atomSpans.ts) after the Lexical replace (post-transform export).
- [`useEditorAtomBridge.ts`](src/hooks/useEditorAtomBridge.ts) persists via [`definitionShortcutSave.ts`](src/lib/definitionShortcutSave.ts); reloads definitions for `DefinitionScanPlugin`. On failure, [`DefinitionShortcutPlugin.tsx`](src/editor/plugins/DefinitionShortcutPlugin.tsx) calls [`$revertDefinitionShortcut`](src/editor/lib/definitionShortcutRevert.ts); error shown as `.editor-shortcut-error` in [`EditorView.tsx`](src/views/EditorView.tsx). Saved `.md` contains the collapsed term only.

**Editor decoration:**
- [`AtomNode.ts`](src/editor/nodes/AtomNode.ts) — `TextNode` subclass; registered in [`lexicalConfig.ts`](src/editor/config/lexicalConfig.ts).
- [`applyAtomDecorations.ts`](src/editor/lib/applyAtomDecorations.ts) — finds `sourceText` in Lexical tree, wraps with `AtomNode` + CSS classes (`.atom-definition`, `.atom-note`, `.atom-reminder` in [`editor.css`](src/styles/editor.css)). Half-height highlight wash gated by `bookmark-highlight-on` on `.editor-root` via [`useBookmarkHighlight.ts`](src/hooks/useBookmarkHighlight.ts).
- [`AtomDecorationPlugin.tsx`](src/editor/plugins/AtomDecorationPlugin.tsx) — applies per-file atoms on load/refresh.
- [`DefinitionScanPlugin.tsx`](src/editor/plugins/DefinitionScanPlugin.tsx) — `OnChangePlugin` debounced **1200ms**; re-applies all definition atoms so matching terms in other documents decorate without stored spans.
- [`AtomHoverPlugin.tsx`](src/editor/plugins/AtomHoverPlugin.tsx) + [`AtomTooltip.tsx`](src/components/atoms/AtomTooltip.tsx) — hover content + delete request (`requestDeleteAtom` → confirm in [`EditorView.tsx`](src/views/EditorView.tsx) → `useAtoms.removeAtom`).

**Bookmarks tab (browse):**
- [`AtomsView.tsx`](src/views/AtomsView.tsx) — always `listAllAtoms()` on mount/refresh; ignores `activeFileId` for loading (App may still pass it for other views). `searchQuery` state on controlled `.atoms-search` input.
- [`useDocumentTitles.ts`](src/hooks/useDocumentTitles.ts) — resolves `files.title` for unique `atom.fileId` values; passed to cards as sole attribution.
- [`BookmarkFilterMenu.tsx`](src/components/atoms/BookmarkFilterMenu.tsx) — filter popover (All · Definitions · Notes · Reminders).
- [`AtomPanel.tsx`](src/components/atoms/AtomPanel.tsx) — solo bookmarks → [`AtomCard.tsx`](src/components/atoms/AtomCard.tsx) (click-to-flip); stacks (count ≥ 2) → [`BookmarkStackFolder.tsx`](src/components/atoms/BookmarkStackFolder.tsx) (click opens popup, double-click renames). Live search and type filter match if **any** stack member matches (`sourceText` / type). Draggable cells + bin delete confirm in [`AtomsView.tsx`](src/views/AtomsView.tsx); card-back pen opens edit popup.
- **Stacks:** drop onto card/folder → [`computeStackMerge`](src/lib/bookmarkStacks.ts) + [`updateAtomsGroupLabel`](src/store/atoms.store.ts); stack-on-stack merges all members into target’s `group_label`. [`BookmarkStackFolder.tsx`](src/components/atoms/BookmarkStackFolder.tsx) — tab/pocket/fringe strips (golden-ratio tokens; no icon); double-click name renames via [`BookmarkStackNameEditor.tsx`](src/components/atoms/BookmarkStackNameEditor.tsx). Display names via [`stackNames.store.ts`](src/store/stackNames.store.ts) (`settings` key `bookmark_stack_name:{uuid}`), default `"Stack"` ([`useStackDisplayNames.ts`](src/hooks/useStackDisplayNames.ts)). Click folder → [`BookmarkStackPopup.tsx`](src/components/atoms/BookmarkStackPopup.tsx) + [`BookmarkStackPopupCard.tsx`](src/components/atoms/BookmarkStackPopupCard.tsx) (`data-stack-enter` card switch on prev/next/shuffle; fluid `--bookmark-popup-card-w`; double-click-renamable header; prev/next/**Shuffle** session order via `shuffleAtomRecords`; flip + back-face pen edit). After delete, [`clearSingletonGroupLabel`](src/store/atoms.store.ts) when one member remains; popup closes when stack dissolves.
- Styling per [`DESIGN LOCILITE.md`](DESIGN%20LOCILITE.md) **Bookmarks tab** section ([`atoms.css`](src/styles/atoms.css), [`bookmark-stack-folder.css`](src/styles/bookmark-stack-folder.css), [`bookmark-stack-popup.css`](src/styles/bookmark-stack-popup.css)).

**Superseded stub:** [`AtomUnderlinePlugin.ts`](src/editor/plugins/AtomUnderlinePlugin.ts) — not mounted; decoration handled by `AtomDecorationPlugin` + `DefinitionScanPlugin`.

### Persist (implemented — Stage 3)
- `PersistPlugin.tsx` uses Lexical `OnChangePlugin` (selection changes ignored)
- Debounces 800ms then serialises via `$convertToMarkdownString` + `markdownTransformers.ts`
- Calls `onSave(markdown)` prop only — no store or `invoke` in the plugin
- `useDocument.save` writes disk via `lib/tauri.ts` and updates `files.title` / `files.edited_at` in SQLite; opening a document updates `files.opened_at`

### AI welcome messages (implemented)

- [`SettingsView.tsx`](src/views/SettingsView.tsx) stores the OpenAI key locally in the `settings` table via [`useOpenAIKeySetting.ts`](src/hooks/useOpenAIKeySetting.ts) and [`settings.store.ts`](src/store/settings.store.ts).
- [`useAiWelcomeMessages.ts`](src/hooks/useAiWelcomeMessages.ts) owns the Home welcome rotation. It reads `ai.welcome_batch`, `ai.welcome_index`, and `ai.welcome_source_file_id` from settings; shows one cached message; advances the index; and only calls AI again after all five cached messages have been shown.
- Latest source selection uses `listFilesByEditedAt()` plus `readFile`; [`welcomeWritingSource.ts`](src/lib/welcomeWritingSource.ts) skips empty, short, checklist-heavy, table-heavy, and code-heavy documents before sending markdown to AI.
- [`writeWelcomeMessages.ts`](src/ai/actions/writeWelcomeMessages.ts) calls [`openai.ts`](src/ai/providers/openai.ts) and returns structured data only. It does not write settings, mutate markdown, or touch Lexical.
- If the key is missing or generation fails, Home sends an error notification and keeps a local fallback message visible.

### Editor chrome entry (implemented)
- [`useEditorChromeEntry.ts`](src/hooks/useEditorChromeEntry.ts) in [`EditorView.tsx`](src/views/EditorView.tsx): `chrome-offstage` on `document.body` on mount; removed after double `rAF` when `useDocument` is `ready` — **editor bar** slides in (shell header stays visible; focus mode still hides both)
- **`handleEditorRootRef`** in [`EditorView.tsx`](src/views/EditorView.tsx) is the mount/re-sync point for all `.editor-root` mode classes: `authorship-visible`, `bookmark-highlight-on`, `focus-active`, `typewriter-active`. Editor mode hooks load app defaults async; the ref callback re-applies classes when defaults arrive after the root mounts (required for bookmark highlight defaults to apply on first open).
- Editor `[data-view]` open/close transitions are **opacity-only** ([`transitions.css`](src/styles/transitions.css) `editor-open-enter` / `editor-close-leave` keyframes) — no shell `transform` during load
- **Scrollbars:** shell/browse hidden in [`scrollbars.css`](src/styles/scrollbars.css); document `html` scroll — idle width 0 / `scrollbar-width: none`, active 3px pill while `html.is-scrolling` ([`useDocumentScrollbar.ts`](src/hooks/useDocumentScrollbar.ts), 800ms debounce); Windows `fluentOverlay` in `tauri.conf.json`; `::-webkit-scrollbar-button` suppressed

### Floating editor bar
- Implemented as `.editor-bar.bottom-bar` in [`BottomBar.tsx`](src/components/shell/BottomBar.tsx) — centered frosted pill portaled to `document.body` (TitleBar pattern; not inside animated `[data-view]`)
- Child order: **arrows** → **centre label** → **prompt field** → **Outline** → **overflow menu**
- **`useBottomBar.ts`** owns per-document font size, word count label, find query/replacement state, match index/count, and arrow actions; font size loads `font_size_{fileId}` or falls back to `editor_default_font_size`, persists per-note overrides via bar arrows, applies `--editor-font-size-override`
- **`useFindHighlight.ts`** in [`EditorView.tsx`](src/views/EditorView.tsx) paints find matches via CSS Highlight API on `.editor-root` DOM text — no Lexical plugin or store access
- **Arrows** change font size when find query is empty; move the find match index when query is non-empty; disabled when find is active and has no results
- **Centre label** shows word count by default, the font size briefly after arrow font changes, or match progress / `0 results` in find mode
- **Prompt field** opens find mode on focus/click or `Ctrl/Cmd+F`; [`useFindHighlight`](src/hooks/useFindHighlight.ts) highlights all matches and the active match in the editor surface
- **Outline** toggle opens centered outline overlay; nav items scroll to matching `h1–h6` in `.editor-root` via [`outlineNavigation.ts`](src/lib/outlineNavigation.ts) + shared [`scrollEditorTarget.ts`](src/lib/scrollEditorTarget.ts) (eased rAF scroll, `--editor-scroll-target-ratio` / `--dur-editor-scroll`); panel stays open after click; editor column does not reflow
- **Overflow menu** — **Focus** `AppleToggle` wired to [`useFocusMode`](src/hooks/useFocusMode.ts); **Typewriter** `AppleToggle` wired to [`useTypewriterMode`](src/hooks/useTypewriterMode.ts) (default off, session-only; sound in Settings only); **Authorship** `AppleToggle` wired to [`useAuthorshipMode`](src/hooks/useAuthorshipMode.ts) (app default from Settings; session override); **Bookmark highlight** `AppleToggle` wired to [`useBookmarkHighlight`](src/hooks/useBookmarkHighlight.ts) (app default from Settings; session override); each row shows its keyboard shortcut
- Future AI atomise (`ai/actions/atomise.ts`) is not on the editor bar

### Sidebar navigation
- `App.tsx` wraps [`WindowChrome.tsx`](src/components/shell/WindowChrome.tsx) + [`ShellSidebarTrigger.tsx`](src/components/shell/ShellSidebarTrigger.tsx) in `.shell-header` **outside** `.view-stage` (persistent during view transitions), then portals [`ShellSidebar.tsx`](src/components/shell/ShellSidebar.tsx) to `document.body`.
- `WindowChrome.tsx` — hover-revealed `.window-chrome-zone` + traffic lights; reveal state in [`useWindowChrome.ts`](src/hooks/useWindowChrome.ts).
- `ShellSidebar` is an edge-attached temporary slide-over overlay, not a `ViewName`. It never participates in [`useViewTransition.ts`](src/hooks/useViewTransition.ts), never reserves a layout column, and closes before document navigation.
- Former titlebar actions live in [`ShellSidebarNav.tsx`](src/components/shell/ShellSidebarNav.tsx): enlarged `Loci` → Home, **New note** → create/open editor, `Documents` focuses the sidebar library, `Bookmarks` → `AtomsView`, and bottom utility rows for **Settings**, **Theme**, and disabled **Profile**.
- [`ShellSidebarLibrary.tsx`](src/components/shell/ShellSidebarLibrary.tsx) reuses [`useSearchableDocuments.ts`](src/hooks/useSearchableDocuments.ts), [`matchesSearch`](src/lib/searchMatch.ts), and [`useSearchStagger.ts`](src/hooks/useSearchStagger.ts). It opens documents only; delete, creation, drag/drop, and bookmark stack operations remain on their existing full browse views.
- [`useShellSidebarGesture.ts`](src/hooks/useShellSidebarGesture.ts) owns `Ctrl/Cmd+Shift+L` (instant toggle) and accumulated horizontal wheel gestures via [`shellSidebarGesture.ts`](src/lib/shellSidebarGesture.ts): swipe right opens at **140px**; swipe left closes, goes Home, or returns from Home to the most recent note at **180px**. Dominance ratio **2.2**, idle reset **140ms**, accum window **480ms**, post-commit cooldown **1100ms**. Commits blocked while sidebar phase is `entering` or `leaving`.
- [`useDocumentScrollRestore.ts`](src/hooks/useDocumentScrollRestore.ts) persists per-document scroll position in the `settings` table (`document_scroll_{fileId}`) and restores it after the editor document is ready.

### Notifications
- [`NotificationProvider`](src/hooks/useNotifications.tsx) wraps [`App.tsx`](src/App.tsx); [`NotificationHost.tsx`](src/components/shell/NotificationHost.tsx) portals to `document.body` at `--z-notification` (350).
- API: `notifySaved()`, `notifyBookmark()`, `notifyError(message)`, generic `notify({ tone, message })`, `dismiss(id)`.
- Stack policy in [`notifications.ts`](src/lib/notifications.ts): max **3** chips, newest first, coalesce duplicate tone+message, evict oldest success on overflow; success auto-dismiss 3200ms, error 6000ms.
- **Hooks trigger notifications** after async persist — not views (except [`AtomsView.tsx`](src/views/AtomsView.tsx) bookmark edit). Inline field/dialog errors **coexist** with error chips in v1.
- v1 success wires: settings hooks (`useDefaultEditorFontSetting`, `useDefaultFontSizeSetting`, `useEditorModeDefaultSettings`, `useTypewriterSoundSetting`, `useOpenAIKeySetting`), bookmark create/edit (`useAtomCreation`, `useEditorAtomBridge`, `AtomsView`).
- v1 error wires: `useOpenAIKeySetting`, `useAtomCreation` (example paths; other failures keep inline errors until migrated).

### View transitions
- [`useViewTransition.ts`](src/hooks/useViewTransition.ts) — sole navigation state owner in `App.tsx`; `navigateTo` wraps `navigate`. State machine: `idle` → `leaving` → `entering` → `idle`. Leaving view stays mounted for `EXIT_DURATION` (tab 180ms, open 200ms, close 200ms) then unmounts.
- `resolveTransition(from, to)`: `to === 'editor'` → `open`; `from === 'editor'` → `close`; else → `tab` (includes Settings).
- [`TransitionShell.tsx`](src/components/shell/TransitionShell.tsx) — applies `data-view`, `data-state`, `data-transition` only; layout in [`transitions.css`](src/styles/transitions.css) (`.view-stage`, `[data-view]`).
- [`renderAppPage.tsx`](src/lib/renderAppPage.tsx) — renders Home/Documents/Editor/Atoms/Settings inside leaving + current shells; existing handler props unchanged (`onOpenEditor`, `onCreateNote`, `handleDocumentDeleted`).
- `activeFileId` remains separate React state — opening a note still sets `activeFileId` then `navigateTo('editor')`.
- Modal (`data-transition="modal"`) keyframes exist in `transitions.css`; sidebar keyframes + horizontal close/home stagger live on `ShellSidebar` / `App.tsx` / `RecentFiles.tsx`.

### Settings surface — when to add a control

**Belongs on Settings when:**

- The user can change it and the choice should persist app-wide (`settings` table key/value, or `localStorage` for boot-critical prefs). Theme is the current exception on the titlebar until deliberately migrated.
- It is not tied to one document (contrast: per-file atoms, annotations, outline open state).
- It is a keyboard shortcut binding or shortcut customization.
- It is provider/account configuration (API keys, model choice) once those flows exist.
- It is a default for editor modes (e.g. start new sessions with focus mode on) rather than the live toggle in the editor bar overflow menu.

**Does not belong on Settings:**

- Session or ephemeral UI (outline open, bottom bar hover, modal open).
- Per-document state (authorship spans, atom groups, file path).
- Primary writing actions used while typing (for example, outline toggle) — stay on the editor bar.
- One-click conveniences already on the titlebar unless explicitly consolidated (theme today).
- Developer-only flags, build config, migrations.

**When a placeholder row becomes real:**

1. Add a stable `settings.key` (e.g. `editor.defaultFocusMode`) in the store; add a migration if the schema changes.
2. Expose read/write through a dedicated hook (e.g. [`useTypewriterSoundSetting.ts`](src/hooks/useTypewriterSoundSetting.ts)) or `useSettings` — **views and shell components never import `settings.store.ts`**.
3. Replace the placeholder control in `SettingsView`; document the key under the settings table notes in this file.
4. Update the Settings page section in `DESIGN LOCILITE.md` with the live control pattern.

**Live settings keys:**

| Key | Default | Hook | UI |
|-----|---------|------|-----|
| `typewriter_sound` | `false` | `useTypewriterSoundSetting` | Settings → Editor → Typewriter sounds |
| `editor_default_font` | `classic` | `useDefaultEditorFontSetting` | Settings → Editor → Editor font; applied on boot |
| `editor_default_font_size` | `17` | `useDefaultFontSizeSetting` | Settings → Editor → Default font size |
| `editor_default_focus_mode` | `false` | `useEditorModeDefaultSettings` / `useFocusMode` | Settings → Editor → Default focus mode; applied on note open |
| `editor_default_authorship` | `false` | `useEditorModeDefaultSettings` / `useAuthorshipMode` | Settings → Editor → Default authorship highlights; applied on note open |
| `editor_default_bookmark_highlight` | `false` | `useEditorModeDefaultSettings` / `useBookmarkHighlight` | Settings → Editor → Default bookmark highlight; applied on note open |
| `font_size_{fileId}` | falls back to `editor_default_font_size` | `useBottomBar` | Editor bottom bar arrows (per-note override) |
| `document_scroll_{fileId}` | unset | `useDocumentScrollRestore` | Restores the last editor scroll position when reopening a note |
| `ai.openai_key` | unset | `useOpenAIKeySetting` / `useAiWelcomeMessages` | Settings → AI → API key; local-only OpenAI key |
| `ai.welcome_batch` | `[]` | `useAiWelcomeMessages` | Cached five-message Home welcome batch |
| `ai.welcome_index` | `0` | `useAiWelcomeMessages` | Next cached welcome message index |
| `ai.welcome_source_file_id` | unset | `useAiWelcomeMessages` | Source document id for the cached welcome batch |

---

## Boot sequence

**Current (dev):**

```
1. Tauri opens → React mounts → App.tsx calls initDb() (SQLite + migrations v1–v3)
2. View: home by default; seed docs if empty registry
3. Home / Documents: useSearchableDocuments (Home shows recent 10 when search empty)
4. New note / open row → activeFileId → EditorView
5. useDocument load/save + PersistPlugin debounce (800ms)
6. useEditorAtomBridge loads atoms + definitions; useEditorAuthorshipBridge loads annotations; Editor mounts plugins via context
7. Bookmarks tab: AtomsView loads listAllAtoms(); useDocumentTitles resolves per-card document names
8. Bookmark: context menu → AtomPopup → createAtom → decoration + Bookmarks tab flashcards
9. Browse drag: whole `.document-row` / `.bookmark-flashcard` → `writeDragPayload` → `BrowseDeleteBin` (`dragDropEnabled: false` on main window)
10. Delete note: editor overflow or Documents bin drop → ConfirmDialog → useDeleteDocument; editor path → Home
11. Delete bookmark: bin drop (browse) or editor tooltip → ConfirmDialog → useAtoms.removeAtom
12. Focus mode: overflow **Focus** toggle → `useFocusMode` + `FocusModePlugin`; Esc or `‹` exits; chrome slides off-screen
13. Authorship: paste → `AuthorshipPlugin` + `useEditorAuthorshipBridge` → `annotations` table; overflow **Authorship** toggle → `authorship-visible` wash; right-click span → **Mark as mine**
14. Bottom bar: `useBottomBar(fileId, markdown)` loads `font_size_{fileId}`, applies `--editor-font-size-override`, derives word count and find labels, handles `Ctrl/Cmd+F` plus mode shortcuts from `EditorView`; `useFindHighlight` paints match highlights on `.editor-root`
15. Sidebar: trigger / `Ctrl+Shift+L` / guarded right swipe opens `ShellSidebar`; document rows close the overlay then open the editor; left swipe from Home opens the most recent note and `useDocumentScrollRestore` restores saved scroll.
```

**Target (not yet mounted):**

```
1–15. As current
16. Atomise → ai/actions/atomise.ts (AI-generated atoms, distinct from manual bookmarks)
17. AI authorship logging + rainbow wash (`source='ai'`)
```

---

## Branching rules

- One Lexical node type → one file in `editor/nodes/`
- One Lexical plugin → one file in `editor/plugins/`
- One AI action → one file in `ai/actions/`
- One AI provider → one file in `ai/providers/`
- One hook → one file in `hooks/`
- One DB table → one store file in `store/`
- All Tauri command invocations → `lib/tauri.ts` only, nowhere else
- All OpenAI calls → `ai/providers/openai.ts` only
- `Editor.tsx` assembles plugins but contains no plugin logic itself
- `App.tsx` orchestrates view transitions via `useViewTransition` and wires handlers; business logic stays in hooks/store
- **150 line limit per file.** If a file exceeds 150 lines, it is doing too much — split it.
- New features always get new files. Nothing is bolted onto an existing file to avoid creating one.

---

## What is explicitly out of scope

- Images (no `ImageNode`, no file upload)
- Heavy tables (no `TableNode`)
- Community features, feed, streaks
- Study sessions, spaced repetition
- Export (PDF, DOCX)
- Cloud sync (architecture does not block a future sync layer — it just doesn't exist yet)
- Multiple windows
- Gemini or any AI provider other than OpenAI (Anthropic: future)
