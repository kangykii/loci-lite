# RULES.md — Loci Lite
> Version: 1.0.0 · Status: Pre-build · Last updated: 2026-06-04
> Read this before touching any file. Read it in full. It takes 90 seconds.

---

## The three source-of-truth documents

Before writing any code, know which document governs your decision:

| Question | Document |
|---|---|
| Where does this file live? What talks to what? | `ARCHITECTURE LOCILITE.md` |
| What does this look like? What are the exact values? | `DESIGN LOCILITE.md` |
| How do I behave while building it? | `RULES.md` (this file) |

**These documents do not duplicate each other. If information appears in `ARCHITECTURE LOCILITE.md`, it is not repeated here.**

---

## Planning requests

When the user says **plan** (or asks to plan work):

- Produce **precise, actionable changes**: exact files, selectors, tokens, props, and markdown doc sections — not vague goals.
- Ground every decision in `DESIGN LOCILITE.md`, `ARCHITECTURE LOCILITE.md`, and `RULES.md`. If a change conflicts with those docs, flag it before implementing.
- Include doc updates in the plan when tokens, layout, or forbidden patterns change.
- Do **not** edit Cursor plan files unless the user explicitly asks.

---

## Package manager

```
pnpm only. Always.
```

- Never run `npm install`, `npm ci`, `yarn add`, or `yarn install`
- Never write `npm run` in instructions or scripts
- If a dependency requires `npm` to install, flag it — do not work around it silently
- Lock file is `pnpm-lock.yaml`. Never delete or regenerate it without explicit instruction

---

## File rules

**150 line limit.** If a file exceeds 150 lines, it is doing too much. Split it before continuing.

**One job per file.** If you cannot describe what a file does in one sentence without using "and", it needs to be split.

**New features get new files.** Never bolt new logic onto an existing file to avoid creating a new one.

**Branching is strict.** Follow the branching rules in `ARCHITECTURE.md` exactly:
- One Lexical node → `editor/nodes/`
- One Lexical plugin → `editor/plugins/`
- One AI action → `ai/actions/`
- One AI provider → `ai/providers/`
- One hook → `hooks/`
- One DB table → `store/`

**Never create a file not listed in ARCHITECTURE.md without updating ARCHITECTURE.md first.** Discuss with the user before adding new files to the structure.

---

## The reality rule

ARCHITECTURE.md reflects what exists, not what is planned.

- Do not add a file to ARCHITECTURE.md until it exists on disk
- Do not reference a file in code until it exists on disk
- Do not update the build order or directory tree speculatively
- If a task requires a file that does not exist yet, create it first, then update ARCHITECTURE.md

---

## Layer communication rules

These are not guidelines. They are hard constraints.

```
UI → Store hooks         ✓
UI → AI actions          ✓
UI → lib/tauri.ts        ✓
Lexical plugins → UI     ✓ (via events / callbacks only)
Lexical plugins → Store  ✗ NEVER
Lexical plugins → AI     ✗ NEVER
Store → AI               ✗ NEVER
AI → Store               ✗ NEVER
anything → invoke()      ✗ NEVER — use lib/tauri.ts
anything → OpenAI SDK    ✗ NEVER — use ai/providers/openai.ts
```

If the architecture disagrees with a solution you are about to implement, **stop**. Do not force the solution. Surface the conflict to the user and propose an architecture-compliant alternative.

---

## Tauri rules

- All `invoke()` calls live in `src/lib/tauri.ts` — nowhere else, ever
- All Tauri commands are registered in `src-tauri/src/lib.rs`
- Rust commands live in `src-tauri/src/commands/` — one file per concern (`file.rs`, `window.rs`)
- Never use `@tauri-apps/api` imports outside of `lib/tauri.ts`
- Use Tauri 2 API shapes — not Tauri 1. They are not the same. If uncertain, check the Tauri 2 docs before writing

---

## SQLite rules

- All SQLite access goes through `store/` files — never raw SQL outside of a store file
- All store files use `tauri-plugin-sql` v2 — not better-sqlite3, not Dexie, not anything else
- Migrations live in `store/migrations/` as numbered `.sql` files — `001_initial.sql`, `002_*.sql`
- `store/db.ts` is the only file that opens the DB connection — store files import from it
- Never run raw SQL strings inline in components or hooks — always call a store function
- The `.md` file on disk is the source of truth for document content. SQLite holds derived data only. Never write document prose to SQLite.

---

## Browse search rules

- **Home / Documents:** [`useSearchableDocuments.ts`](src/hooks/useSearchableDocuments.ts) loads registry rows + markdown haystack; views filter with [`matchesSearch`](src/lib/searchMatch.ts) in `useMemo` on every keystroke. Home shows recent 10 when query is empty.
- **Bookmarks:** client-side filter on `atom.sourceText` only in [`AtomPanel.tsx`](src/components/atoms/AtomPanel.tsx); composes with type filter popover. No `useSearchableDocuments` on Bookmarks.
- **Match semantics v1:** case-insensitive substring only — no fuzzy, regex, or Enter-to-search.
- **Layer:** `readFile` and `listAllFiles` stay in hooks; components hold `searchQuery` state only.

---

## Delete rules

- **Confirm first:** every delete (note or bookmark) opens [`ConfirmDialog.tsx`](src/components/ui/ConfirmDialog.tsx) before any store or Tauri call. No `window.confirm`.
- **Note delete:** [`useDeleteDocument.ts`](src/hooks/useDeleteDocument.ts) only — disk via [`delete_file`](src/lib/tauri.ts), registry via [`files.store`](src/store/files.store.ts) `deleteFile`. Components never call these directly.
- **Bookmark delete:** `useAtoms.removeAtom` only after `ConfirmDialog` (card X, bin drop, editor tooltip).
- **Layer:** `invoke('delete_file')` only in `lib/tauri.ts`; no delete logic in Lexical plugins.
- **Drag payload:** `writeDragPayload` / `readDragPayload` in [`deletePayload.ts`](src/lib/deletePayload.ts) only; MIME `application/x-loci-delete` + `text/plain` fallback.
- **Drag sources:** whole `.document-row` / `.bookmark-flashcard` body (`div` / `article`) — never `draggable` on `<button>`; no grip handles.
- **Tauri:** main window `dragDropEnabled: false` in `tauri.conf.json` (required for HTML5 browse DnD).
- **Drag session:** [`browseDrag.ts`](src/lib/browseDrag.ts) for `is-browse-dragging` + click suppression after drag.
- **Drag follower:** full-opacity preview via [`browseDragGhost.ts`](src/lib/browseDragGhost.ts) (blank native `setDragImage` + `.is-follower` panel) — never the default full-element screenshot or faded Chromium DOM ghost; no destructive styling on the follower.
- **Navigation:** editor note delete → Home; Documents bin delete → stay on Documents.

---

## Lexical rules

- `Editor.tsx` assembles plugins. It contains no plugin logic itself.
- Plugins observe and decorate. They do not call store functions or AI actions.
- Plugins communicate outward via Lexical commands or React callbacks — not direct imports.
- Definition shortcut: Lexical `replace` calls [`definitionShortcutBridge.ts`](src/editor/lib/definitionShortcutBridge.ts) only; persistence stays in [`useEditorAtomBridge.ts`](src/hooks/useEditorAtomBridge.ts) via `onDefinitionShortcut`.
- `editor/config/lexicalConfig.ts` is the only place nodes are registered.
- `editor/config/markdownTransformers.ts` is the only place markdown import/export is defined.
- Never import Lexical internals with `lexical/` deep paths unless the public API genuinely does not expose what is needed — flag this before doing it.

---

## Design rules

All visual values come from `src/styles/tokens.css`. Nothing is invented at component time.

**CSS hard stops — never write these:**

| Forbidden | Correct |
|---|---|
| `font-family: Inter` | `var(--font-sans)` |
| `font-family: Georgia` or hardcoded faces | `var(--font-sans)`, `var(--font-serif)`, or `var(--editor-font-family)` |
| `padding: 16px` (or any hardcoded shell spacing) | `var(--space-N)` |
| `border-radius: 8px` (or any hardcoded radius) | `var(--radius-N)` |
| `font-weight: 700` or `bold` | 600 maximum |
| `transition: all` | List specific properties |
| `linear-gradient` in shell chrome (titlebar, bottom bar, etc.) | Flat token colours only |
| `linear-gradient` on `html`, `body`, or `.app-shell` background | `background: var(--bg)` only |
| `#000000` or `#FFFFFF` | Tokenised colours only |
| Any hex not in `tokens.css` | Add to `tokens.css` first, then use |
| `color: black`, `background: white` | Token variables only |
| `left: 50%` + `translateX(-50%)` on `.titlebar` | Full-bleed titlebar with `--shell-inset-x` |
| Hardcoded `38rem` / `44rem` / `56rem` / `72rem` on shell views | `var(--shell-content-max)` |
| `--shell-chrome-bg` on browse cards, search rows, or bookmark faces | `var(--surface)` for browse content surfaces |
| Fixed `680px` editor width or horizontal `--editor-pad-h` on `.editor-layout` | Fluid `--editor-col-w` + `--editor-gutter` |
| `readFile` / store calls in browse views for search | `useSearchableDocuments` hook |
| Bookmark search on `answer`, title, or type | `matchesSearch(atom.sourceText, query)` in `AtomPanel` |
| Fuzzy, regex, or Enter-submit browse search | `matchesSearch` on keystroke |
| `window.confirm` | `ConfirmDialog` |
| Instant delete (no confirm) | `onRequestDelete` / bin drop → dialog → hook |
| `invoke('delete_file')` outside `lib/tauri.ts` | `useDeleteDocument` |
| `deleteAtom` / `deleteFile` in components | `useAtoms` / `useDeleteDocument` after confirm |
| `draggable` on `<button>` for browse delete | `div.document-row` or `article.bookmark-flashcard` whole body |
| Separate drag-handle grips for browse delete | Whole row / flashcard body draggable |
| One-off multi-option row styling (bordered pill buttons) | [`SegmentedControl`](src/components/ui/SegmentedControl.tsx) + `--segmented-*` tokens |

**Font tokens — three contexts:**
- `var(--font-sans)` — Geist — all UI (shell, modals, bookmarks, popups, flashcards, tooltips, buttons, labels); includes bookmark source snippets in AtomPopup and flashcard fronts
- `var(--font-serif)` — Newsreader — home welcome decorative heading only
- `var(--editor-font-family)` — editor `.editor-root` only (Classic / Modern / Typewriter preset from Settings)

**One accent per view.** `--accent` appears on one element per view: the primary action. If you are putting accent colour on a second element, stop and reconsider.

**Surface tiers before chrome tricks.** Do not solve low contrast with extra borders, gradients, or shadows. First check whether the element is using the correct surface tier (`--bg` page, `--surface` browse content, `--surface-strong` menus/modals).

If a design value you need does not exist in `tokens.css`, **do not invent it**. Add the token to `tokens.css` first, then use it. Update `DESIGN.md` to document the addition.

Dark mode colour direction is **Charcoal Claude** (see `DESIGN LOCILITE.md`). When changing dark colours, edit `tokens.css` first, then sync the DESIGN.md token block and Colour direction section.

Shell browse views (home, workspace, documents, atoms, settings) share `--shell-content-max`. The editor view alone uses `--editor-col-w`.

---

## AI provider rules

- OpenAI is the only active provider. Anthropic is future. No Gemini. No others.
- All OpenAI calls go through `ai/providers/openai.ts` — never import the OpenAI SDK elsewhere
- All AI actions live in `ai/actions/` — one action per file
- AI actions return structured data — they do not write to the store or touch Lexical directly
- If an AI call fails, surface the error through `useNotifications().notifyError` — never silently swallow it or rely only on inline copy
- The Home AI welcome uses a cached five-message batch in `settings`; show cached messages before calling OpenAI again
- OpenAI API keys are local app settings only; UI reads/writes them through hooks, not direct store imports

---

## React rules

- React 19 only — do not use patterns that were deprecated in React 18 or earlier
- No class components
- No `useEffect` for derived state — compute it inline or use `useMemo`
- One hook per file in `hooks/` — hooks do not import from other hooks files unless composing intentionally
- Never import a store file directly in a component — always go through a hook

---

## When to stop and ask

Stop and surface a conflict to the user when:

1. **The architecture disagrees with your solution.** Do not route around ARCHITECTURE.md. Do not "temporarily" violate a layer rule. Propose a compliant alternative.
2. **A file would exceed 150 lines.** Propose a split before writing more.
3. **A new file is needed that is not in ARCHITECTURE.md.** Do not create it silently — confirm the addition and update ARCHITECTURE.md.
4. **A design value does not exist in tokens.css.** Do not invent a value — propose the token addition first.
5. **A Tauri 2 API is unclear.** Do not guess or use Tauri 1 patterns. State the uncertainty and look it up.
6. **A Lexical API is unclear.** Do not use internal/private APIs without flagging it. State the uncertainty.
7. **The task implies removing a layer boundary** (e.g. calling the store from a plugin). Flag it. Do not do it.

---

## When to update the reference documents

| Trigger | Action |
|---|---|
| A new file is created | Add it to the directory tree in `ARCHITECTURE.md` |
| A new DB table is added | Add the schema to `ARCHITECTURE.md` and create a new migration file |
| A new mechanism is introduced | Add it to the Key Mechanisms section of `ARCHITECTURE.md` |
| A new CSS token is needed | Add it to `tokens.css` and document it in `DESIGN.md` |
| A dark palette is renamed or replaced | Update `tokens.css`, DESIGN.md Colour direction, and token block |
| A new component pattern is established | Add it to the Components section of `DESIGN.md` |
| A new forbidden pattern is discovered | Add it to the Forbidden sections in `DESIGN.md` and `RULES.md` |
| The boot sequence changes | Update the Boot Sequence section in `ARCHITECTURE.md` |
| Browse delete drag or Tauri `dragDropEnabled` changes | Update Key Mechanisms + Boot Sequence in `ARCHITECTURE.md`; drag rules in `RULES.md` |

**Documents are updated after the fact, not before.** ARCHITECTURE.md reflects reality. DESIGN.md reflects what is implemented. RULES.md reflects lessons learned.

---

## Done checklist

A task is not done until all of these are true:

- [ ] User-facing product name is **Loci Notepad**; dev identifiers remain Loci Lite
- [ ] Windows Tauri uses frameless shell + hover-revealed `.window-chrome` traffic lights; idle reserves only `--window-chrome-hit-h`; window API only in `lib/tauri.ts`
- [ ] Focus mode hides `.shell-header` (not `.titlebar` alone)
- [ ] The file is under 150 lines
- [ ] The file has one job, describable in one sentence without "and"
- [ ] All CSS values come from `tokens.css` — nothing hardcoded
- [ ] No forbidden CSS patterns (see list above)
- [ ] No layer boundary violations (see communication rules above)
- [ ] No `npm`, `yarn`, or `npm run` anywhere
- [ ] No `invoke()` outside `lib/tauri.ts`
- [ ] No OpenAI SDK imports outside `ai/providers/openai.ts`
- [ ] No Lexical plugin importing from store or AI
- [ ] ARCHITECTURE.md updated if a new file was created
- [ ] DESIGN.md updated if a new token was added
- [ ] Page background uses flat `var(--bg)` with no gradient
- [ ] Titlebar spans viewport minus `--shell-inset-x`
- [ ] Home/Workspace/Documents/Atoms/Settings use `--shell-content-max` (no per-view rem caps)
- [ ] Settings opens from titlebar gear; persisted prefs via hooks only (no `settings.store` in views/components)
- [ ] Editor width uses fluid `--editor-col-w`; no hardcoded `680px` or duplicate `max-width` on `.editor-root`
- [ ] Editor outline does not shift editor column position; toggle on editor bar only
- [ ] Outline panel uses `--outline-panel-w` and `--outline-panel-max-h` (no hardcoded outline rem widths)
- [ ] Outline panel header uses document title, not the word "Outline"
- [ ] Theme uses dual-layer tokens (`data-theme` + `prefers-color-scheme` fallback); DESIGN updated
- [ ] Editor bar has prompt field; no Focus/Authorship/Atoms text buttons
- [ ] Mode toggles use `AppleToggle` in overflow menu only
- [ ] Focus mode toggle wired via `useFocusMode` + overflow `AppleToggle` (not a bar text button)
- [ ] `FocusModePlugin` has no `store/` imports; active block follows caret (`selection.anchor`), not hover/scroll
- [ ] `focus-active` on `.editor-root` only; `focus-mode-active` on `document.body` only
- [ ] Focus exit via `Escape` or `FocusExitButton`; chrome transitions use 360ms `var(--ease-out)` — no `transition: all`
- [ ] Bookmark remains sole accent on editor view
- [ ] Atom spans use half-height token wash when highlight is on — no `text-decoration: wavy` or dashed underlines
- [ ] Bookmark highlight toggle in overflow menu only; default OFF; no hardcoded rgba in `editor.css` for atom highlight
- [ ] Typewriter toggle in overflow menu only (`AppleToggle`); default OFF; no `bb-toggle` on editor bar
- [ ] Typewriter scroll: anchor-gated rAF + instant `scrollBy`; no scroll lock; snap on caret move only
- [ ] Typewriter sound: Settings only (`useTypewriterSoundSetting`); default OFF; SQLite `typewriter_sound`; no `settings.store` in views
- [ ] `typewriter-active` on `.editor-root` only; no duplicate focus opacity rules under typewriter CSS
- [ ] Editor `.editor-bar` and `FocusExitButton` portaled to `document.body` — not DOM descendants of `[data-view]`
- [ ] Note entry uses `chrome-offstage` + `useEditorChromeEntry`; editor bar reveals after document `ready` — shell header not offstaged
- [ ] Editor `[data-view]` open/close transitions are opacity-only — no shell transform during load
- [ ] View navigation goes through `useViewTransition` in `App.tsx` only — views never import the hook
- [ ] `scrollbars.css` imported in `main.tsx` after `tokens.css`; shell scrollbars hidden; document Cursor-style 3px overlay thumb (`--scrollbar-thumb`, `--scrollbar-thumb-hover`, dual-theme tokens) via `useDocumentScrollbar` + `html.is-scrolling`; no `scrollbar-gutter: stable`
- [ ] `transitions.css` imported in `main.tsx` after `scrollbars.css`; no hardcoded transition ms in components
- [ ] Editor find/outline scroll uses `--dur-editor-scroll` + `--ease-out` via `scrollEditorTarget.ts`; typewriter scroll stays instant
- [ ] `TransitionShell` applies `data-view` / `data-state` / `data-transition` only — no timing logic
- [ ] Home `.recent-list` and Documents `.documents-list` use `data-stagger`, `--stagger-index`, and `useSearchStagger` on query change
- [ ] Home/Documents search filters live on keystroke via `useSearchableDocuments` + `matchesSearch`
- [ ] Bookmarks search filters `sourceText` only; composes with type filter popover
- [ ] Home View all opens Documents; Documents Filter button remains disabled shell
- [ ] Note delete uses `ConfirmDialog` + `useDeleteDocument` (editor menu or Documents bin drop)
- [ ] Bookmark delete uses `ConfirmDialog` before `useAtoms.removeAtom` (bin drop on Bookmarks, editor tooltip — not card back)
- [ ] Browse card-back edit uses shared `AtomPopup` edit mode + `useAtoms.updateAtom` (pen on flashcard back; neutral tertiary hover)
- [ ] No instant delete and no `window.confirm`
- [ ] ConfirmDialog Delete uses solid `var(--destructive)` + `var(--destructive-on)` (not red-on-red-tint)
- [ ] Browse delete drag: whole `.document-row` / `.bookmark-flashcard` body; `browseDrag.ts` + `deletePayload.ts`; no grip handles
- [ ] Browse drag uses `.browse-drag-ghost.is-follower` at full opacity; panel origin at pointer (`clientX` / `clientY`, no diagonal offset)
- [ ] Bookmark stack drop merges via `group_label` without confirm; stacks render as `.bookmark-stack-folder` (click → popup, double-click name → rename)
- [ ] Stack popup uses `--bookmark-popup-card-w` / `--bookmark-popup-card-h`; back-face pen opens `AtomPopup` edit mode (delete is bin-only on browse)
- [ ] Tauri main window has `dragDropEnabled: false` when browse HTML5 DnD is used
- [ ] Definition shortcut uses `definitionShortcutBridge` + `useEditorAtomBridge` — no `store/` in Lexical plugins/transformers
- [ ] Authorship paste always recorded when `fileId` set; visibility gated by `authorship-visible` on `.editor-root` only
- [ ] Authorship toggle in overflow menu only; wired via `useAuthorshipMode` + `useEditorAuthorshipBridge` (not a bar text button)
- [ ] `AuthorshipPlugin` and `ContextMenuPlugin` have no `store/` imports — annotations via `AuthorshipEditorContext`
- [ ] Authorship wash uses `--authorship-paste-wash` / `--authorship-paste-wash-hover` tokens only; no hardcoded rgba in `editor.css` for authorship
- [ ] Authorship is visual-only runtime overlay derived from SQLite; it must not create authorship text nodes, split Lexical text for provenance, or write provenance into bookmark nodes
- [ ] Authorship can visually overlap bookmark spans, but bookmarks and paste provenance must not become each other's durable data model
- [ ] Mark as mine is based on selected/clicked markdown ranges from context annotations; it subtracts only that range and preserves surrounding pasted text plus bookmark nodes
- [ ] TypeScript has no `any` types unless explicitly justified in a comment
- [ ] Notification host portaled from `NotificationProvider` in `App.tsx` — max 3 chips top-right
- [ ] Save/error ack via `useNotifications()` in hooks (not `settings.store` in views); no third-party toast libraries
- [ ] Error notification tone uses `--destructive` on icon/label only — no accent or solid destructive fill on chips

---

## Instant red flags

If you see any of these, stop and fix before continuing:

```
npm install          → pnpm install
yarn add             → pnpm add
npm run              → pnpm run
import { invoke }    → import from lib/tauri.ts
font-family: Inter   → var(--font-sans)
font-weight: 700     → 600 maximum
transition: all      → list specific properties
border-radius: 8px   → var(--radius-N)
padding: 16px        → var(--space-N)
#000000 / #ffffff    → tokenised colour
rgba(0,0,0,          → use shadow tokens or --border tokens
linear-gradient      → not in shell chrome
radial-gradient on body → background: var(--bg)
linear-gradient on body → background: var(--bg)
min(38rem / min(44rem / min(72rem → var(--shell-content-max)
translateX(-50%) on .titlebar → --shell-inset-x full bleed
grid-template-columns:auto on .editor-layout → block layout, overlay only
outline-toggle top-left fixed → toggle on .editor-bar
ChevronLeft in outline header → plain title, scrim + bar close
useEffect(derived    → compute inline or useMemo
import from 'lexical/  → check public API first
window.confirm       → ConfirmDialog
removeAtom( without confirm → onRequestDelete → dialog first
invoke('delete_file' outside lib/tauri.ts → useDeleteDocument
draggable on button.document-row → div.document-row shell
dragDropEnabled true in tauri.conf → false for HTML5 browse DnD
default drag screenshot on browse delete → browseDragGhost follower panel
faded setDragImage DOM ghost on browse delete → blank setDragImage + is-follower
```
