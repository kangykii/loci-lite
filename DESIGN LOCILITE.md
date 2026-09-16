# DESIGN.md — Loci Lite
> Version: 1.0.0 · Status: Pre-build · Last updated: 2026-06-04

---

## Direction

Writer-first minimalism. The document is the product — everything else is infrastructure. The shell is recessive: low contrast, transparent, out of the way. The writing surface is calm, paper-like, and wide. There is no dashboard energy, no app feel. The user should forget the shell exists within five seconds of opening a document.

This is not Canvas. Canvas is a document *engine*. Lite is a writing *room*.

### Colour direction — Light mode (Washi paper)

Light mode uses a **warm high-contrast paper** palette: warm hued off-white base (`#F7F2E8`), deeper fibre shadow (`#EFE7D9`), lifted fibrous sheet surfaces (`#FBF7EF` / `#FEFBF6`) that sit lighter than the base so cards read as paper laid on the page rather than a duller patch of it, and warm sumi ink text (`#1D150E`). Slightly warmer and more fibrous than iA Writer's neutral `#F5F6F6` — not pure white, not grey UI white. The page background is flat `--bg` only; no atmospheric gradients on `html` or `body`.

### Colour direction — Dark mode (Charcoal Claude)

Dark mode uses the **Charcoal Claude** palette: near-neutral charcoal base (`#171615`), lifted warm surface (`#232120`), cream text (`#EDE6DC`), muted brown-gray chrome (`#443E38`), and a burnt-orange accent (`#B86830`). Warmth lives in the accent only — closest to iA dark, editorial not neon. The page background is flat `--bg` only; no atmospheric gradients on `html` or `body`. Accent colour appears on one primary action per view only.

**Theme control:** Light tokens live on `:root`. Charcoal Claude applies when the OS prefers dark (`:root:not([data-theme='light'])`) or when the user sets `html[data-theme='dark']`. Explicit light choice uses `html[data-theme='light']`. Account → Notebooks stores a notebook theme id in the same persisted `localStorage` preference; applying a notebook sets the mode-compatible `data-theme` plus `data-notebook-theme` for palette variants. Every theme path owns native text selection via `--selection-bg` and `--selection-text`; selection uses `::selection` only, stays readable over editor prose, and never falls back to system blue or a custom overlay.

---

## Ratio principle

Shell dimensions use viewport units, `rem`, or custom properties derived from viewport size. Do not hardcode shell chrome pixels except `1px` borders and the editor column width.

Three width roles — do not conflate them:

- **Editor column** (`--editor-col-w`): fluid `min(--editor-col-max, 100vw - 2 * --editor-gutter)`; grows with window up to a prose max (`70ch`) with a 48-64px side-padding floor.
- **Shell browse column** (`--shell-content-max`): home, workspace, documents, atoms, and settings; scales with viewport up to a cap.
- **Chrome insets** (`--shell-inset-x`): shared horizontal gutter for the titlebar and `.app-shell` so nav and content align.

The desktop window minimum is derived from the current monitor's usable width and height (48% each, converted from physical to logical units), not a fixed pixel size. Split editing has a separate content gate: the available `.view-stage` must be at least `58rem` wide. A narrower window disables the split option and collapses an existing split to its first pane. The seam is `--split-seam-w` (the same inset as the window frame), painted with `--split-seam-bg`: frame-bezel colour in light mode and warm pale `#F1ECE2` in dark mode.

---

## Scrollbars

Two-tier policy in [`scrollbars.css`](src/styles/scrollbars.css):

- **Shell / browse** (Home, Documents, Bookmarks, Settings, outline panel, code blocks): no visible scrollbar; wheel/trackpad/keyboard scroll unchanged. `::-webkit-scrollbar-button` suppressed on shell containers.
- **Document / note** (`html` when editor is open): Cursor-inspired overlay pill — **3px** wide (`--scrollbar-size`) only while `html.is-scrolling`; **idle = zero scrollbar width** (`::-webkit-scrollbar { width: 0 }`, `scrollbar-width: none`), not merely a transparent thumb. **2px** inset from the window edge (`--scrollbar-inset` + `background-clip: padding-box`), full pill (`--radius-pill`), transparent track, no `scrollbar-gutter: stable`. Thumb appears via [`useDocumentScrollbar.ts`](src/hooks/useDocumentScrollbar.ts); fades with `background-color` transition (`--dur-fast`). Hover brightens thumb (`--scrollbar-thumb-hover`) while visible. `::-webkit-scrollbar-button { display: none }` on document scroll.
- **Windows Tauri:** main window `scrollBarStyle: fluentOverlay` in [`tauri.conf.json`](src-tauri/tauri.conf.json) — Fluent overlay native mode (no classic arrow buttons); requires app restart after config change; WebView2 Runtime 125+.
- **Theme:** light mode — dark thumb from `--text-primary` at 20% / 36% hover; dark mode (Charcoal Claude) — cream thumb at 32% / 50% hover (overrides in `prefers-color-scheme: dark` and `html[data-theme='dark']`).
- **Firefox:** idle `scrollbar-width: none`; active `thin` + `scrollbar-color`; no inset or hover parity.

No accent colour on scrollbars. Code-block horizontal overflow stays scrollable with hidden bar.

---

## Tokens

Implemented in `src/styles/tokens.css`. Every value a component needs already exists here. Nothing is invented at component time.

```css
:root {

  /* ── Shell chrome dimensions ── */
  --titlebar-h:        clamp(2rem, 3.25vh, 2.375rem);
  --titlebar-nav-gap:  var(--space-1);
  --sidebar-w:       clamp(calc(var(--u) * 12), 15vw, calc(var(--u) * 16));
  --sidebar-rail-w:  2.5vw;
  --bottom-bar-h:    3rem;
  --bottom-bar-collapsed-h: 4px;

  /* ── Window chrome (Windows Tauri frameless) ── */
  /* --titlebar-h is the chrome height and layout-clearance source. */
  --window-chrome-bg:          #171615;
  --window-chrome-fg:          #F7F2E8;
  --window-chrome-border:      color-mix(in srgb, var(--window-chrome-fg) 18%, transparent);
  --window-control-hover-bg:   color-mix(in srgb, var(--window-chrome-fg) 14%, transparent);
  --window-control-w:          clamp(2.25rem, 3.25vw, 2.75rem);
  --window-frame-inset:        var(--space-1);
  --window-frame-radius:       var(--radius-lg);
  --window-frame-bezel:        var(--window-chrome-bg);

  /* ── Editor column ── */
  --editor-gutter:   clamp(3rem, 5vw, 4rem);
  --editor-col-max:  70ch;
  --editor-col-w:    min(var(--editor-col-max), calc(100vw - 2 * var(--editor-gutter)));
  --editor-pad-v:    clamp(3rem, 6vh, 5rem);
  --editor-pad-h:    clamp(1rem, 4vw, 2.5rem);
  --shell-inset-x:   var(--editor-pad-h);
  --shell-content-max: min(64rem, calc(100vw - 2 * var(--shell-inset-x)));
  --bookmark-card-w: calc(var(--u) * 20);
  --bookmark-card-h: calc(var(--u) * 12);
  --bookmark-popup-scale: 1.55;
  --bookmark-popup-card-w: clamp(calc(var(--bookmark-card-w) * var(--bookmark-popup-scale)), calc(var(--shell-content-max) * 0.8), calc(100vw - 2 * var(--shell-inset-x) - var(--space-8)));
  --bookmark-popup-card-h: calc(var(--bookmark-popup-card-w) * 12 / 20);
  --bookmark-popup-perspective: calc(var(--bookmark-popup-card-w) * 2.5);
  --bookmark-popup-body-size: clamp(var(--text-lg), calc(var(--text-lg) + var(--bookmark-popup-card-w) * 0.008), var(--text-xl));
  --bookmark-popup-meta-size: clamp(var(--text-xs), calc(var(--text-xs) + var(--bookmark-popup-card-w) * 0.0025), var(--text-sm));
  --stack-card-shift: var(--space-2);
  --dur-stack-card-leave: var(--dur-open-leave);
  --dur-stack-card-enter: var(--dur-open-enter);
  --bookmark-stack-folder-name-size: var(--text-base);
  --bookmark-folder-phi: 1.618;
  --bookmark-folder-tab-w: 38.2%;
  --bookmark-fringe-h: calc(var(--u) * 0.382);
  --bookmark-fringe-step: calc(var(--u) / var(--bookmark-folder-phi));
  --browse-drag-ghost-w: calc(var(--u) * 14);
  --browse-drag-ghost-icon-size: 1rem;
  --outline-panel-w:       min(var(--shell-content-max), calc(100vw - 2 * var(--shell-inset-x)));
  --outline-panel-inset-y: var(--space-4);
  --outline-panel-max-h:   calc(100vh - var(--titlebar-h) - var(--bottom-bar-h) - 2 * var(--outline-panel-inset-y) - var(--space-12));
  --outline-panel-centered-max-h: min(var(--outline-panel-max-h), 75vh);

  /* ── Base unit and radius ── */
  --u: clamp(0.875rem, 0.5rem + 0.83vw, 1.125rem);
  --r: clamp(0.25rem, 0.15rem + 0.3vw, 0.5rem);

  /* ── Spacing scale (derived from --u) ── */
  --space-1: calc(var(--u) * 0.25);
  --space-2: calc(var(--u) * 0.5);
  --space-3: calc(var(--u) * 0.75);
  --space-4: var(--u);
  --space-6: calc(var(--u) * 1.5);
  --space-8: calc(var(--u) * 2);
  --space-12: calc(var(--u) * 3);

  /* ── Radius scale ── */
  --radius-sm: calc(var(--r) * 0.75);
  --radius-md: var(--r);
  --radius-lg: calc(var(--r) * 2);
  --radius-xl: calc(var(--r) * 4);
  --radius-pill: 999px;

  /* ── Typography ── */
  --font-sans: "Geist", "SF Pro Text", system-ui, sans-serif;
  --font-serif: "Newsreader", Georgia, serif;
  --editor-font-family: "IBM Plex Mono", "GeistMono", "SF Mono", monospace;  /* editor body — overridden by Settings */

  /* ── Light mode colours (washi paper) ── */
  --bg:               #F7F2E8;
  --bg-deep:          #EFE7D9;          /* scrims, depth behind overlays */
  --surface:          #FBF7EF;          /* lighter than --bg — cards lift, not sink */
  --surface-strong:   #FEFBF6;          /* lighter still — the modal/popover tier */
  --surface-solid:    #FBF7EF;

  /* ── Shell chrome (transparent glass + backdrop-filter) ── */
  --shell-chrome-bg:         rgba(247, 242, 232, 0.82);
  --shell-chrome-bg-strong:  rgba(239, 231, 217, 0.92);
  --shell-chrome-border:     rgba(29, 21, 14, 0.10);
  --shell-chrome-blur:       20px;

  --text-primary:     #1D150E;
  --text-secondary:   #5E574F;          /* fixed hex, not text-primary at opacity — renders identically on any surface */
  --text-tertiary:    #8E887F;          /* fixed hex, same reason */

  --accent:           #A85F32;          /* muted terracotta — one accent, used sparingly */
  --accent-subtle:    rgba(168, 95, 50, 0.11);
  --accent-text:      #7A3F1D;          /* accent on light paper — passes AA */

  --destructive:      #B42020;          /* delete confirm, context menu — not accent */
  --destructive-on:   #EDE6DA;          /* label on solid destructive buttons */

  --border:           rgba(29, 21, 14, 0.12);
  --border-strong:    rgba(29, 21, 14, 0.22);

  /* ── Dark mode colours (Charcoal Claude) ── */
  --bg-dark:            #171615;
  --bg-deep-dark:       #121110;
  --surface-dark:       #232120;        /* lighter than --bg-dark, widened from the previous near-1:1 gap */
  --surface-strong-dark: #2B2825;
  --surface-solid-dark: #232120;

  --shell-chrome-bg-dark:         rgba(31, 29, 28, 0.52);
  --shell-chrome-bg-strong-dark:  rgba(31, 29, 28, 0.72);
  --shell-chrome-border-dark:     transparent;
  --shell-chrome-blur:            20px;

  --text-primary-dark:  #EDE6DC;
  --text-secondary-dark: #97938C;       /* fixed hex — see light-mode note above */
  --text-tertiary-dark: #575451;

  --accent-dark:        #B86830;        /* burnt orange — warmth in accent only */
  --accent-subtle-dark: rgba(184, 104, 48, 0.12);
  --accent-text-dark:   #D89A5C;        /* terracotta on charcoal */

  --border-dark:        rgba(68, 62, 56, 0.40);   /* mute #443E38 */
  --border-strong-dark: rgba(68, 62, 56, 0.75);

  /* ── Shadows (always warm-tinted, never pure black) ── */
  --shadow-sm: 0 1px 3px rgba(34, 28, 26, 0.08);
  --shadow-md: 0 4px 16px rgba(34, 28, 26, 0.10);
  --shadow-lg: 0 8px 32px rgba(34, 28, 26, 0.12);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:             var(--bg-dark);
    --bg-deep:        var(--bg-deep-dark);
    --surface:        var(--surface-dark);
    --surface-strong: var(--surface-strong-dark);
    --surface-solid:  var(--surface-solid-dark);

    --text-primary:   var(--text-primary-dark);
    --text-secondary: var(--text-secondary-dark);
    --text-tertiary:  var(--text-tertiary-dark);

    --accent:         var(--accent-dark);
    --accent-subtle:  var(--accent-subtle-dark);
    --accent-text:    var(--accent-text-dark);

    --border:         var(--border-dark);
    --border-strong:  var(--border-strong-dark);

    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.30);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.40);
  }
}
```

---

## Typography

Shell UI uses Geist, except the decorative Home welcome heading uses Newsreader via `--font-serif`. The editor uses a user-selectable preset via `--editor-font-family` **inside `.editor-root` only**. Bookmark source text shown in UI (popup, flashcards, tooltips) uses Geist — never the editor preset or Newsreader.

| Context | Typeface | Variable |
|---|---|---|
| Shell chrome (titlebar, sidebar, bottom bar, settings, browse) | Geist | `var(--font-sans)` |
| Bookmark source text (AtomPopup, flashcard front, tooltip) | Geist | `var(--font-sans)` |
| Home welcome heading | Newsreader | `var(--font-serif)` |
| Editor body (all notes) | Classic / Modern / Typewriter preset | `var(--editor-font-family)` |

**Forbidden:** `--editor-font-family` or `--font-serif` on bookmark UI surfaces (popups, flashcards, tooltips). Editor font presets apply only within `.editor-root`.

**Editor font presets** (Settings → Editor → Editor font; persisted as `editor_default_font`; default **Classic**):

| Label | Face | Stored value |
|---|---|---|
| Classic | Newsreader (serif) | `classic` |
| Modern | Geist (sans) | `modern` |
| Typewriter | IBM Plex Mono (mono) | `typewriter` |

Applied app-wide on boot via [`useDefaultEditorFontSetting.ts`](src/hooks/useDefaultEditorFontSetting.ts); does not change shell or home welcome fonts.

### Type scale

```css
/* Shell — Geist */
--text-xs:   0.6875rem;   /* 11px — labels, toggles */
--text-sm:   0.8125rem;   /* 13px — secondary chrome */
--text-base: 0.9375rem;   /* 15px — primary chrome */
--text-lg:   1.125rem;    /* 18px — home screen sections */
--text-xl:   1.5rem;      /* 24px — home screen subtitle */
--text-2xl:  2.25rem;     /* 36px — welcome heading */

/* Editor — preset via --editor-font-family (default Classic / Newsreader) */
--editor-text:      1.0625rem;  /* 17px body — generous, easy to read */
--editor-font-size-override: 17px; /* per-document override set by bottom bar */
--editor-h1:        1.8823529412em;  /* 32px at 17px body — scales with --editor-font-size-override */
--editor-h2:        1.4117647059em;  /* 24px at 17px body */
--editor-h3:        1.1764705882em;  /* 20px at 17px body */
--editor-h4:        1.0588235294em;  /* 18px at 17px body */
--editor-h5:        1em;
--editor-h6:        0.9411764706em;  /* 16px at 17px body */
--editor-small:     0.875rem;   /* 14px — footnotes, captions */
--editor-line-height: 1.85;     /* wide leading — writer default */
--editor-heading-line-height: 1.3;
--editor-prose: #1D150E;       /* solid full-opacity warm prose — writing surface only */
--editor-scroll-target-ratio: 0.4; /* find + outline scroll anchor — matches typewriter lock line */
--dur-editor-scroll: 280ms;      /* find + outline navigation scroll */

/* Document scrollbar (editor html scroll only) */
--scrollbar-size:        3px;
--scrollbar-inset:       2px;
--scrollbar-thumb:       color-mix(in srgb, var(--text-primary) 20%, transparent);
--scrollbar-thumb-hover: color-mix(in srgb, var(--text-primary) 36%, transparent);
/* Dark: 32% / 50% in prefers-color-scheme dark + html[data-theme='dark'] */
```

### Weight rules

- **400** — all body text, editor prose, secondary chrome labels
- **500** — primary chrome labels, buttons, toggles, home section headings
- **600** — active state only, welcome heading, accent elements
- **Never 700 or bold**

---

## Colour usage rules

### Contrast hierarchy

- `--bg`: flat page background only.
- `--surface`: browse content surfaces (search fields, creation cards, document/recent rows, bookmark faces).
- **Theme-relative browse contrast:** when a control or card boundary must be visible, use `--ui-contrast-edge`—a 50% mix of the active `--text-primary` and `--surface`—rather than a fixed grey or beige. Use `--ui-contrast-muted` (60%) for browse metadata. These tokens are only for elements on `--surface`; they retain the same visual contrast relationship in every theme and support the WCAG 2.2 1.4.11 3:1 non-text-contrast baseline for interactive boundaries.
- `--surface-strong`: menus, modals, and popovers only.
- Remaining hierarchy comes from typography weight and spacing, plus one deliberate elevation step on browse content: `.creation-card`, `.document-row`, `.document-project-folder` carry `--border-strong` and `--shadow-sm` at rest (`--shadow-md` on hover/focus) so a card reads as an object sitting on the page, not a same-toned patch of it. This is content elevation, not shell chrome — shell chrome (titlebar, editor bar, outline panel) stays flat and shadow-free per the Glassmorphism rules below. `.recent-row` keeps its single top-rule divider at rest and only gains `--shadow-sm` on hover, since a resting shadow on a fully transparent row would float with nothing under it.
- **Boxes are never the contrast mechanism. Interaction is.** This applies to two distinct cases:
  - **Form fields** (text inputs, textareas, selects) are borderless in every state, including `:focus` — a background-colour step (e.g. `--bg-deep` inside a `--surface-strong` popover) is what marks them as a target, not a `border`. Suppress the default UA focus ring (`outline: none`) and replace it with a state you already own: a background shift on `:focus` (`color-mix` toward `--surface-strong`), the caret itself (`caret-color: var(--accent)`), or — where a field toggles into edit mode, per `AtomPopup`'s source field — nothing but the caret appearing. A visible black focus ring on an input is a bug, not a stray style — trace it to a missing `outline: none` before adding anything else.
  - **Interactive rows and cards** (`.document-row`, `.recent-row`, `.document-project-folder`, `.document-project-member-row`) signal `:hover` / `:focus-visible` with a background lift alone (`color-mix` toward `--surface-strong`) — never by conjuring a `border-color` into existence on a previously-transparent border. A row that is plain at rest and gains a full outline on hover is the same violation as a bordered input; delete the `border-color` line from the interaction rule and let the background do the work. `.recent-row`'s top-rule divider between list items is a single-edge separator, not a box, and stays.
  - **Exempt, by design, not oversight:** panel edges that must read against an arbitrary backdrop (`ConfirmDialog`, popovers, `.document-row.is-project-drop-target`-style drag targets), buttons, and persistent selected/active-state indicators (`.profile-notebook-cover.is-active`, `.profile-subscription-card.is-active`) may use `--border` / `--border-strong` / `--accent` as a ring. The test: does the border represent a functional state (this is where a drag will drop, this is the selected item) rather than merely "you are hovering over a row"? Functional states may keep a ring; plain hover/focus on a list item may not.
- Browse content surfaces use `--surface`; shell chrome uses `--shell-chrome-bg`. Do not use shell chrome tokens for cards, rows, search fields, or bookmark faces.
- One accent element per view. Always the primary action.
- `--accent` on buttons, active toggles, bookmark highlight wash, and selected states only.
- `--text-primary` for shell body content and browse surfaces.
- `--editor-prose` for editor body, lists, and headings — solid full-opacity warm near-black; never opacity tints.
- `--text-secondary` for chrome labels, metadata, placeholder text, blockquotes.
- `--text-tertiary` for hints, timestamps, inactive states.
- `--text-secondary` and `--text-tertiary` are fixed hex, not `--text-primary` at opacity — a diluted-ink token renders a different grey depending on what surface sits behind it (`--bg` vs. a `--surface-strong` popover vs. an `--accent-subtle` chip), which silently varies the contrast of every timestamp, hint, and placeholder depending on where a designer drops it. Fixed hex renders identically everywhere it's used. Prose (`--editor-prose`) must not use opacity tints either, for the same reason.
- No pure `#000000` or `#FFFFFF` anywhere. All colours are tokenised.
- All shadows use the warm-tinted shadow tokens, never `rgba(0,0,0,N)` in light mode.
- Dark mode primary accent is burnt orange (`--accent-dark` / `#B86830`), used sparingly — warmth only in the accent.
- Page background uses flat `--bg` only; no gradient stack on `html` or `body`.

---

## Glassmorphism rules

- Shell chrome (editor bar and outline panel) uses low-alpha `--shell-chrome-*` backgrounds with `backdrop-filter: blur(var(--shell-chrome-blur))` so panels read as **transparent glass** over flat `--bg`. The native-replacement window bar is the deliberate exception: a permanent, flat, theme-inverted frame. Browse content gets exactly one surface step via `--surface` — not shell chrome tokens. No panel `box-shadow`; `--shell-chrome-border` is `transparent`.
- **Desktop Tauri is the aesthetic source of truth** for sign-off (`corepack pnpm tauri dev`). WebView2 may composite blur subtly; do not treat browser tab parity as acceptance criteria.
- `main.tsx` adds `html.is-tauri` for future hooks; it does **not** raise chrome opacity. `@supports not (backdrop-filter: blur(1px))` alone applies a modest legibility bump. No OS Mica/vibrancy in v1.
- Frosted panels are flat and seamless at rest.
- Avoid fake 3D: no heavy shadows, no constant prominent borders.
- Hover may lift or brighten a panel slightly.
- Panel interiors may be transparent or subtly different from the page background.
- Homepage eyebrow labels are not part of the product direction.
- Creation actions use one pattern: flat frosted card, circular plus badge, label, and subtext.
- Editor screens are wide surfaces, not rounded document cards.
- Markdown editing is an infinite borderless surface, not a simulated page.
- Editor outline: toggle on the **editor bar** (labeled “Outline”); open state is a viewport scrim plus a **centered** frosted panel. Panel header shows the **document title**; `nav` lists headings only. The editor column never reflows.
- Dark mode is Charcoal Claude: near-neutral charcoal base with burnt-orange accent.
- Page background is flat `var(--bg)` only — no page-level gradients.
- Shell chrome sits close to the background; browse surfaces use `--surface` so the one content step reads clearly. Hover may gently brighten toward `--surface-strong`.

---

## Bookmark highlight

Bookmarked spans (`.atom-definition`, `.atom-note`, `.atom-reminder`) show a **bottom-half line-box wash** when `.editor-root.bookmark-highlight-on` is set. No underlines or squiggles. Default **off** per session until the user enables **Bookmark highlight** in the editor overflow menu.

```css
--atom-highlight-definition: color-mix(in srgb, var(--accent) 20%, transparent);
--atom-highlight-note: color-mix(in srgb, var(--text-tertiary) 28%, transparent);
--atom-highlight-reminder: color-mix(in srgb, var(--accent) 16%, transparent);

.editor-root.bookmark-highlight-on .atom-definition {
  /* lower 50% only — marker band, not full highlighter */
  background-image: linear-gradient(to bottom, transparent 50%, var(--atom-highlight-definition) 50%);
  box-decoration-break: clone;
}
```

Toggle: overflow menu `AppleToggle` via [`useBookmarkHighlight.ts`](src/hooks/useBookmarkHighlight.ts). App-wide default in Settings → **Default bookmark highlight** via [`useEditorModeDefaultSettings.ts`](src/hooks/useEditorModeDefaultSettings.ts); overflow toggle overrides for the current note session only. On note open, `bookmark-highlight-on` is synced on `.editor-root` via `handleEditorRootRef` in [`EditorView.tsx`](src/views/EditorView.tsx) (same mount/re-sync pattern as focus).

---

## Find highlight

Active find uses the CSS Highlight API on `.editor-root` via [`useFindHighlight.ts`](src/hooks/useFindHighlight.ts). Washes are **neutral text tokens** — not accent — so they stay distinct from bookmark half-height bands.

```css
--find-match-wash: color-mix(in srgb, var(--text-tertiary) 38%, transparent);
--find-active-wash: color-mix(in srgb, var(--text-secondary) 52%, transparent);

::highlight(loci-find-match) { background: var(--find-match-wash); }
::highlight(loci-find-active) { background: var(--find-active-wash); }
```

Arrow / Enter navigation scrolls the active match into view via shared [`scrollEditorTarget.ts`](src/lib/scrollEditorTarget.ts): eased rAF scroll anchored at `--editor-scroll-target-ratio` (40% viewport — same as typewriter lock line), duration `--dur-editor-scroll`, easing `--ease-out`. Always scrolls to the lock line; no-op only when already at that scroll position or clamped at document top (`scrollY === 0`). Respects `prefers-reduced-motion`.

---

## Focus mode

Active block (caret’s paragraph, heading, list item, etc.): full opacity. All other Lexical blocks: dimmed to 18%. Transition is slow and deliberate — like the room lights lowering, not a UI toggle.

**Two classes, two elements:**

| Class | Element | Role |
|-------|---------|------|
| `focus-active` | `.editor-root` | Enables block dimming |
| `focus-mode-active` | `document.body` | Hides `.editor-bar`; the permanent window bar remains available |
| `chrome-offstage` | `document.body` | Hides editor bar only during note load; removed after `useDocument` ready |

**Toggle:** overflow **Focus** `AppleToggle` in [`EditorBarMenu.tsx`](src/components/shell/EditorBarMenu.tsx) (not a bar text button). App-wide default in Settings → **Default focus mode**; overflow toggle overrides for the current note session only. **Exit:** `Escape` or [`FocusExitButton.tsx`](src/components/shell/FocusExitButton.tsx) (`‹`, top-left, `var(--text-tertiary)` → `var(--text-primary)` on hover).

**Plugin:** [`FocusModePlugin.ts`](src/editor/plugins/FocusModePlugin.ts) marks the caret block’s DOM with `data-focus="true"` via `selection.anchor` → `getTopLevelElement()` — never hover or scroll position.

```css
/* Dim Lexical block theme classes; active block exempt */
.editor-root.focus-active :is(.editor-paragraph, .editor-heading-h1, …, .editor-list-item, …):not([data-focus="true"]) {
  opacity: 0.18;
  transition: opacity 380ms ease;
}

.editor-root.focus-active [data-focus="true"] {
  opacity: 1;
  transition: opacity 240ms ease;
}

/* Chrome hide — focus mode and note entry affect the editor bar only. */
.focus-mode-active .editor-bar,
.chrome-offstage .editor-bar {
  transform: translateY(100%);
  opacity: 0;
}
```

**Forbidden:** `transition: all`; accent on exit button; dimming driven by anything other than caret selection; merging `focus-active` and `focus-mode-active` onto one element.

---

## Typewriter mode

Caret locks at **40% viewport height** while typewriter mode is on. Scroll snaps **instantly** on caret move only — no lerp, no smooth scroll, **no scroll lock** (wheel/trackpad work normally; first keystroke after manual scroll snaps back).

| Class | Element | Role |
|-------|---------|------|
| `typewriter-active` | `.editor-root` | Top/bottom padding so first/last lines can reach lock line |

```css
.editor-root.typewriter-active {
  padding-top: 40vh;
  padding-bottom: 60vh;
}
```

**Toggle:** overflow **Typewriter** `AppleToggle` in [`EditorBarMenu.tsx`](src/components/shell/EditorBarMenu.tsx) via [`useTypewriterMode.ts`](src/hooks/useTypewriterMode.ts). Default **off** per session.

**Sound:** optional Web Audio keyclick ([`typewriterSound.ts`](src/editor/sound/typewriterSound.ts)). Default **off**. **Settings only** — **Typewriter sounds** row in [`SettingsView.tsx`](src/views/SettingsView.tsx) via [`useTypewriterSoundSetting.ts`](src/hooks/useTypewriterSoundSetting.ts); persists in SQLite (`typewriter_sound`). Plays only when typewriter mode **and** sound are both on.

**Coexistence with focus mode:** separate classes — `typewriter-active` touches padding only; `focus-active` touches opacity. Both may be active simultaneously.

**Forbidden:** `bb-toggle` on editor bar; sound toggle in overflow menu; scroll listeners that fight manual reading; duplicate focus opacity rules under `typewriter-active`.

---

## Components

### Window chrome (Windows Tauri)

Native OS decorations and the undecorated DWM shadow are disabled when the window is created (`decorations: false`, `shadow: false` in [`tauri.conf.json`](src-tauri/tauri.conf.json)). The native WebView is transparent so the CSS root shell can define the real rounded outer silhouette. Do not toggle decorations after WebView creation: that can retain non-client sizing and a Windows accent perimeter. The app draws one permanent **`.window-chrome`** rail: it is the Windows title bar and the visual window frame, not app navigation.

- **Frame:** Tauri `html` and `body` stay transparent; only `#root` uses `--window-chrome-bg` and owns the visible outer silhouette, clipped with both `--window-frame-radius` and a matching inset `clip-path`. Never put an opaque Tauri background on `body`: when `html` is transparent, WebView2 propagates the body background to its rectangular canvas and defeats the body's rounded corners. All three layers are locked to the viewport with `overflow: hidden`. The title rail is the window bar; the narrow `--window-frame-inset` bevel around it therefore inherits and inverts with that same token. `.app-frame` is fixed directly beneath the rail, inset on its other three sides, rounded with the same radius, and clips its active view to preserve every inner corner. Neither the native window nor `.app-frame` draws a perimeter border. The outer shell never scrolls; each active `[data-view]` owns vertical scrolling.
- **Strip:** height `--titlebar-h`, flat, opaque, and always visible. It shares the outer window color, has only its top corners rounded, and has no bottom divider. It uses `--window-chrome-*` tokens rather than frosted shell-chrome tokens, blur, or shadows.
- **Stacking:** the permanent frame bevel is drawn in a pointer-transparent overlay above page chrome and dialogs, with the window strip above it. It remains the outermost silhouette even while split-pane bars or popups are open.
- **Theme:** light app themes use the near-black bar with warm light glyphs; dark app themes invert to a warm pale bar with dark glyphs. Notebook themes inherit their matching `data-theme` mode.
- **Controls:** left-aligned Loci navigation is sidebar, New note, Search, Back, and Forward; each has a functional callback. A small rounded context switcher then provides Library and Bookmarks in the positions that Claude’s chat/code switcher occupies. The native controls remain right-aligned in Windows order — minimize, maximize/restore, close — as Lucide `Minus`, `Square`/`Copy`, and `X` glyphs. Native controls are full-height rectangular targets; the Loci context switcher uses a restrained rounded boundary and the same neutral hover treatment.
- **Drag:** remaining strip width uses `-webkit-app-region: drag`; controls use `no-drag`. Double-click drag strip toggles maximize.
- **Tauri-only:** [`WindowChrome.tsx`](src/components/shell/WindowChrome.tsx) returns null in browser dev; window API calls live in [`lib/tauri.ts`](src/lib/tauri.ts) only.
- **User-facing name:** **Loci Notepad** (taskbar, About, window title). Dev identifiers remain Loci Lite.

**Forbidden:** enabling the undecorated native shadow; changing decorations after WebView creation; a CSS perimeter or title-bar divider; a disconnected title bar or a fixed accent border that disagrees with the active theme; native Windows accent title bar; hover-reveal chrome; frosted/blur or shadows on `.window-chrome`; macOS traffic-light controls; clipping the page inside the frame; `--accent` on window controls; `@tauri-apps/api/window` imports outside `lib/tauri.ts`.

### Floating translucent action pill (reserved pattern)

The former fixed bottom-left `.shell-sidebar-trigger` has been removed because its sidebar, New note, and Bookmarks actions are now permanently available in the Windows rail. Do not restore a second global navigation strip.

Its visual treatment remains an approved pattern for future contextual tools: a compact, see-through floating pill with a quiet warm glass surface, hairline neutral border, full pill radius, and restrained blur. Icons use `--text-tertiary` at rest and move only to `--text-secondary` on hover/focus; individual icon targets do not gain opaque fills. Use it only for transient, local actions where the underlying page should remain perceptible.

```css
.floating-action-pill {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--shell-chrome-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--shell-chrome-bg) 76%, transparent);
  color: var(--text-tertiary);
  backdrop-filter: blur(var(--shell-chrome-blur));
}
```

### Notifications

Global save/error feedback via [`NotificationProvider`](src/hooks/useNotifications.tsx) + [`NotificationHost.tsx`](src/components/shell/NotificationHost.tsx) portaled to `document.body`. Hooks call `useNotifications()` after persist success or failure — views do not import notification helpers except where save orchestration lives in the view ([`AtomsView.tsx`](src/views/AtomsView.tsx)).

- **Position:** fixed top-right — `top: calc(var(--space-2) + var(--bottom-bar-h) + var(--space-2))`, `right: var(--shell-inset-x)`, `z-index: var(--z-notification)` (350).
- **Stack:** column, `gap: var(--space-2)`, **max 3** visible; newest first; coalesce same tone + message (timer resets); overflow evicts oldest success first.
- **Chip:** frosted pill — `var(--shell-chrome-bg)`, `var(--shell-chrome-border)`, `var(--radius-pill)`, `backdrop-filter: blur(var(--shell-chrome-blur))`, `font-family: var(--font-sans)`, `font-size: var(--text-sm)`, `max-width: min(18rem, calc(100vw - 2 * var(--shell-inset-x)))`; label ellipsis for long errors.
- **Success tone:** Lucide `Check` + label (`Saved`, `Bookmark`); `var(--text-primary)`; auto-dismiss ~3.2s.
- **Error tone:** Lucide `CircleAlert` + caller message; `var(--destructive)` on icon/label only — no solid destructive fill; auto-dismiss ~6s. Auth dialog errors use notification chips via `useNotifications().notifyError`, never inline copy.
- **Dismiss:** Lucide `X`; manual dismiss always available.

**Forbidden:** toast libraries; modal scrim; accent fill on chips; document autosave chips; full-width error banners; more than 3 visible chips; `window.alert` for save ack.

### Sidebar

`ShellSidebar` is a docked shell column, rendered inside `.app-frame` before `.view-stage` — never a portal, modal, scrim, or focus trap. It is open by default and shares the app frame through `grid-template-columns: var(--sidebar-w) minmax(0, 1fr)`. The existing Windows rail control and `Ctrl/Cmd+Shift+L` remain the explicit retract/restore actions; retracting removes the column and restores the content pane to full width. The sidebar never auto-dismisses when a document opens.

The rail is deliberately not a second global navigation strip: Library, Bookmarks, New note, Search, history, and the existing editor bar remain in the Windows rail or document chrome. Its only content is five recently opened notes, up to three pinned notes not already present in Recent, and bottom utility rows for **Settings**, **Theme**, and **Profile**. Recent rows are compact single-line entries: title left, abbreviated relative-open time right (`2m`, `14hr`, `3d`); no previews, document icons, search input, chevrons, card borders, or persistent row menus. The active note uses a restrained neutral wash. Bookmarks and Settings continue to use their existing full views; bookmark flashcards, stack drag/drop, document delete, and the existing editor outline panel do not move into the sidebar.

**Profile row:** the only visible sign of an account. Signed out — `UserCircle` icon + "Profile" opens the auth dialog. Signed in — `.shell-sidebar-avatar` initial chip (`calc(var(--u) * 1.25)` circle, `--accent-subtle` fill, `--accent-text` initial) + **Account**, ellipsized; click opens the full Account view while the rail stays docked. No account state ever appears in the titlebar, editor, or browse views.

### Boot screen

Long startup uses `.boot-screen`: flat `--bg`, no card, no scrim, no header. A single paper-related line and three bouncing dots sit bottom-right at `right: var(--shell-inset-x)` / `bottom: var(--space-6)`. First launch defaults to light mode; stored notebook themes still apply before paint.

### Loading states

Every in-app loading moment — opening a note, populating a browse list, the bookmark grid — uses a **skeleton stencil**, never a spinner, a dot bouncer, or bare "Loading…" text. A skeleton renders the real row/card container class with its content swapped for pulsing placeholder blocks, so the layout is already correct and nothing shifts once real content lands.

- **Motion:** [`skeleton.css`](src/styles/skeleton.css) — `.skeleton-block` pulses opacity (`skeleton-pulse`, 1.5s ease-in-out, `1 → 0.45 → 1`), never a sweeping shimmer gradient. A moving highlight reads as dashboard energy; the writer-room direction stays quiet. Respects `prefers-reduced-motion` (pulse off, fixed 0.6 opacity). Fill colour is `--border-strong`, no accent.
- **Shape discipline:** a skeleton reuses the real component's own container class (`.document-row`, `.recent-row`, `.shell-sidebar-document`, the bookmark flashcard face) plus `.is-skeleton` (disables pointer events only) — see [`DocumentRowSkeleton.tsx`](src/components/documents/DocumentRowSkeleton.tsx), [`RecentRowSkeleton.tsx`](src/components/home/RecentRowSkeleton.tsx), [`ShellSidebarDocumentSkeleton.tsx`](src/components/shell/ShellSidebarDocumentSkeleton.tsx), [`AtomCardSkeleton.tsx`](src/components/atoms/AtomCardSkeleton.tsx). [`Skeleton.tsx`](src/components/ui/Skeleton.tsx) is the shared placeholder-block primitive every one of these composes from.
- **Editor:** [`EditorSkeleton.tsx`](src/components/editor/EditorSkeleton.tsx) stencils a document page — a title-width line plus a few paragraphs of varying-width lines — inside the same `--editor-col-w` / `--editor-gutter` / `--editor-pad-v` box the real prose renders in. Shown for both editor loading states: before `useDocument` resolves, and again (as `.editor-entry-loading`) between `ready` and `isEditorRevealed`.
- **Call sites:** [`EditorView.tsx`](src/views/EditorView.tsx) (note open, both phases), [`DocumentsView.tsx`](src/views/DocumentsView.tsx) (4 rows in place of `DocumentsProjectList`), [`RecentFiles.tsx`](src/components/home/RecentFiles.tsx) (3 rows), [`ShellSidebarLibrary.tsx`](src/components/shell/ShellSidebarLibrary.tsx) (3 rows), [`AtomPanel.tsx`](src/components/atoms/AtomPanel.tsx) (4 cards in the flashcard grid).
- **Exception — Boot screen:** the one loading state that keeps the dots-and-paper-line treatment above, since cold start happens before any view or content model exists — there is no row/card shape yet to stencil. Everything downstream of first paint stencils instead.

**Forbidden:** spinners; progress bars/circles/percentages; bare "Loading…" text with no visual affordance; shimmer/sweep gradients; skeleton shapes that don't match their real component's container class and sizing.

## Profile dialog and account page

Follows the ConfirmDialog shape: fixed `.profile-dialog-layer` at z-index 130, `color-mix` scrim on `--bg-deep` (no blur), centered `.profile-dialog` panel — `min(24rem, …)` wide, `--surface-strong`, `--radius-lg`, `--space-6` padding, title `--text-base` 600. Portaled to `document.body`; Escape and scrim close.

Signed out ("Unlock cosmetics"): the popup starts in account creation with a bordered email field and accent **Send code** primary. The code step accepts the emailed 8-digit code with neutral **Resend code** / **Use a different email** text actions. A bordered secondary **Log into existing account** switches to password login; **Use login code** switches existing-account login to an 8-digit code with `shouldCreateUser: false`; **Create new account** returns to signup. Send-code, resend, password-login, wrong-code, setup, and unexpected auth failures surface through notification chips via `useNotifications().notifyError`; no inline auth error copy in the dialog.

First signup setup: after the signup code creates a session, an empty `profiles.display_name` keeps the user in the popup. [`ProfileSetup`](src/components/profile/ProfileSetup.tsx) asks for **Name** and **Password** (minimum 8 characters), saves password first, then name, and only then opens Account.

Full Account view: `.account-view` / `.account-stack` uses the same shell browse width as Settings. Top welcome copy reads **Welcome, {name}**. Identity row uses `.profile-avatar` circle (`calc(var(--u) * 2.25)`, accent-subtle/accent-text initial), name/email stack, and `.profile-tier` pill chip. The editable **Name** field saves through the profile notification pattern. **Modern Writer** appears as a restrained premium account section: Standard users see one accent **Upgrade** button for the $2.99/month Stripe Checkout flow; active subscribers see **Manage billing** for Stripe Billing Portal. **Notebooks** renders long rectangular cover buttons from the notebook theme registry: sharp left cover corners, subtly rounded right corners, a left spine, no folded/bookmark corner, and a quiet selected check inside the cover. Free notebooks are selectable; Modern Writer / owned cosmetic notebooks remain visible but locked until subscription or matching `cosmetics.slug` ownership. Then a top-ruled action row with bordered **Sign out** in `--destructive` text. Weight never exceeds 600.

Gesture and shortcut behavior: `Ctrl/Cmd+Shift+L` retracts/restores the docked sidebar. Trackpad swipes use an accumulated horizontal delta with direction lock in [`shellSidebarGesture.ts`](src/lib/shellSidebarGesture.ts) / [`useShellSidebarGesture.ts`](src/hooks/useShellSidebarGesture.ts):

| Constant | Value | Role |
|---|---|---|
| `GESTURE_DOMINANCE_RATIO` | 2.2 | Horizontal must dominate vertical |
| `GESTURE_COMMIT_OPEN` | 140px | Swipe right — open sidebar |
| `GESTURE_COMMIT_NAV` | 180px | Swipe left — close, Home, or last document |
| `GESTURE_IDLE_RESET_MS` | 140ms | Pause longer than this resets the accumulator |
| `GESTURE_ACCUM_WINDOW_MS` | 480ms | Gesture window before full reset |
| `GESTURE_COOLDOWN_MS` | 1100ms | Blocks stacked commits after one fires |

`preventDefault()` runs as soon as a valid horizontal gesture is recognized so Windows Tauri / WebView2 cannot pan the page while the edge pull accumulates. Commits still occur only after the threshold is crossed. Commits are blocked while the sidebar is animating (`entering` / `leaving` phase). Gesture handling must ignore form fields, dialogs, modifier-wheel gestures, and active text selection.

The sidebar is part of the layout while present, so the main pane grows or contracts only after the user explicitly retracts/restores it. The document editor remains centered in the resulting pane; its existing editor bar retains its controls and moves with the pane so it never overlaps the rail. Swipe navigation has no persistent or edge-pull visual; the obsolete bottom action pill is not used as gesture feedback. `html`, `body`, `#root`, `.view-stage`, and `[data-view]` suppress horizontal overscroll; close/open view transitions are opacity-only; no full-page translate occurs. Home recent list uses `data-stagger="horizontal"`.

### Search field

Shared browse search via [`SearchField.tsx`](src/components/ui/SearchField.tsx) and [`search-field.css`](src/styles/search-field.css). Used on Home, Documents, Bookmarks, and the sidebar library.

- **Surface:** `--surface` on a frosted browse shell — not `--shell-chrome-bg`.
- **Variants:** `panel` (rounded-lg, optional leading Lucide `Search`) and `pill` (home recent list, no leading icon).
- **Input:** `type="text"` with `inputMode="search"` — never `type="search"` (avoids native blue clear control and internal scrollbars).
- **Clear:** Lucide `X` at `size={15}` / `strokeWidth={1.5}`; tertiary at rest, primary on hover; shown only when the query is non-empty.
- **Behaviour:** controlled value + `onChange(string)`; input updates on every keystroke, filter query debounces ~280ms to avoid list flicker — no Enter submit.

```css
.search-field {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--shell-chrome-border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text-tertiary);
  padding: var(--space-2) var(--space-3);
  backdrop-filter: blur(var(--shell-chrome-blur));
}

.search-field--pill {
  border-radius: var(--radius-pill);
  padding-block: var(--space-3);
  padding-inline: var(--space-4);
}

.search-field-clear {
  color: var(--text-tertiary);
}
```

### Segmented control

Shared Apple-style multi-option row via [`SegmentedControl.tsx`](src/components/ui/SegmentedControl.tsx) and [`segmented-control.css`](src/styles/segmented-control.css). One inset track with a sliding indicator thumb — not separate bordered pills per option.

**Tokens** (`tokens.css`): `--segmented-track-bg`, `--segmented-indicator-bg`, `--segmented-indicator-shadow`, `--segmented-padding`, `--segmented-radius`, `--segmented-height`, `--segmented-option-color`, `--segmented-option-active-color`.

**Call sites:** Settings → Editor font ([`SettingsFontChoiceControl.tsx`](src/components/settings/SettingsFontChoiceControl.tsx)); AtomPopup type row ([`AtomPopup.tsx`](src/components/atoms/AtomPopup.tsx)). Use `fullWidth` when the control spans a modal or panel column.

```css
.segmented-control {
  display: inline-grid;
  grid-template-columns: repeat(var(--segmented-count), 1fr);
  background: var(--segmented-track-bg);
  border-radius: var(--segmented-radius);
  padding: var(--segmented-padding);
}

.segmented-control__indicator {
  transform: translateX(calc(var(--segmented-active-index) * 100%));
  transition: transform var(--dur-fast) ease;
}
```

### AtomPopup

Shared bookmark create/edit modal ([`AtomPopup.tsx`](src/components/atoms/AtomPopup.tsx), [`atom-popup.css`](src/styles/atom-popup.css)). Portaled layer at `z-index: 120`; `--surface-strong` panel.

**Layout order:** tertiary **Bookmark** label → source snippet → type [`SegmentedControl`](src/components/ui/SegmentedControl.tsx) → inline answer field → accent **Save** (sole accent in popup).

**Source snippet:** borderless `.atom-popup-source-field` in `.atom-popup-source-shell` — `var(--font-sans)`, `var(--text-base)`, `var(--text-primary)`, weight 500; same slot in display and edit (no layout shift). **Double-click** → `readOnly` off, caret only (Enter/blur commit, Escape revert). Saved via `AtomSavePayload.sourceText` on create and edit.

**Answer field:** `.atom-popup-content` inside `.atom-popup-content-wrap` — borderless, `resize: none`, no boxed textarea; top rule separator only (`border-top: 1px solid var(--border)`). Placeholder `--text-tertiary`.

**Save:** `.atom-popup-save` — `--radius-md`, `min-height: calc(var(--u) * 2.25)`, `background: color-mix(in srgb, var(--accent) 85%, var(--text-primary))`, label `var(--surface-solid)`; matches confirm-dialog primary button sizing. The 85%-accent mix (not raw `--accent`) is the standard fill for every solid primary-action button — `.profile-button-primary`, `.extract-dialog-confirm`, `.rename-note-actions button[type='submit']` all use the same formula, deepened further to 75% on `:hover` — so the one accent stays a single hue while its fill clears comfortable label contrast.

### Settings page

Opened from the sidebar Settings row (`SettingsView`). Not a persistent left-nav tab. Uses `.app-shell.settings-view` with `.settings-stack` capped at `--shell-content-max` (same shell browse width as documents/atoms).

- **Page title:** `.settings-page-title` uses `--text-xl` — same scale step as the sidebar heading. `--text-2xl` and above belong to the Home welcome heading only.
- **Sections:** `.settings-section` + `.settings-section-title` (Editor, Keyboard shortcuts, AI, Data, About).
- **Rows:** `.settings-row` — label and optional `.settings-row-description` on the left; control or hint on the right. Frosted row background uses `var(--shell-chrome-bg)` like document search panels.
- **Placeholders:** `.settings-coming-soon`, `.settings-hint`, disabled `.settings-input`, disabled `.settings-text-button` — `--text-tertiary` only; no accent on this view.
- **Live controls:** **Editor font** — Classic / Modern / Typewriter via shared [`SegmentedControl`](src/components/ui/SegmentedControl.tsx); app-wide default via [`useDefaultEditorFontSetting.ts`](src/hooks/useDefaultEditorFontSetting.ts); applied on boot and on each selection. **Default font size** — up/down stepper (14–24px) in Editor section; app-wide default via [`useDefaultFontSizeSetting.ts`](src/hooks/useDefaultFontSizeSetting.ts); per-note overrides from editor bar arrows persist as `font_size_{fileId}`. **Default focus mode** and **Default bookmark highlight** — `AppleToggle` rows wired via [`useEditorModeDefaultSettings.ts`](src/hooks/useEditorModeDefaultSettings.ts); each applies when a note opens; editor overflow menu toggles override for the current note only. **Typewriter sounds** — `AppleToggle` (`layout="switch-only"`) in Editor section; description “Subtle keyclick feedback while typing”; default off; wired via [`useTypewriterSoundSetting.ts`](src/hooks/useTypewriterSoundSetting.ts) (no `settings.store` import in the view).
- **Theme:** not shown on Settings; Account → Notebooks owns explicit notebook theme selection, including locked Modern Writer / owned cosmetic covers.
- **Forbidden:** modal settings drawer; per-view `rem` width caps; accent on disabled rows or placeholder actions.

### Floating editor bar

Implemented as `.editor-bar` — a centered frosted pill portaled to `document.body` (not inside `[data-view]`). Horizontally inset-anchored like the titlebar (`left` / `right: var(--shell-inset-x)`, `margin-inline: auto`). **Note entry:** [`useEditorChromeEntry.ts`](src/hooks/useEditorChromeEntry.ts) sets `chrome-offstage` on `body` while the document loads; after `ready`, the **editor bar** slides in with the same 360ms transition as focus exit (shell header stays visible throughout). Editor shell open transition is opacity-only. In Tauri, document scrolling, restoration, find/outline targeting, and the minimal overlay scrollbar all use the active editor `[data-view]`; browser fallback retains the window scroll root.

Child order: **arrows** → **centre label** → **prompt field** → **Outline** → **overflow menu** (vertical `⋮`).

- **Arrows:** stacked up/down controls. Idle mode (empty find query) changes per-document editor font size through `--editor-font-size-override` in the 14–24px range; all prose and headings scale together via `em`-relative `--editor-h*` tokens. Find mode (non-empty query) moves the match index. Disabled only when find is active and has no results.
- **Centre label:** faint `var(--text-tertiary)` text. Shows word count by default, font size for two seconds after arrow-driven font changes, and `n / total` or `0 results` in find mode.
- **Prompt field:** `.bb-prompt` / `.bb-prompt-input` shell for find/replace and future prompt. Placeholder: “Find, replace, or prompt...”. Geist `var(--font-sans)`. `Ctrl/Cmd+F` focuses the field without entering find mode; find mode activates only when the query is non-empty. Active find paints neutral `--find-match-wash` / `--find-active-wash` highlights on `.editor-root` via [`useFindHighlight.ts`](src/hooks/useFindHighlight.ts); navigation scroll follows the active match.
- **Outline:** `ListTree` + label; `aria-pressed` when outline panel is open.
- **Overflow menu:** `MoreVertical` icon (vertical triple-dot); opens `.editor-bar-menu-panel` above the trigger. Contains **Focus**, **Typewriter**, and **Bookmark highlight** rows with `AppleToggle` switches and shortcut labels, plus destructive **Delete note**. Delete opens confirm dialog before removal. Future AI atomise is not on the bar. Typewriter sound is **not** in the overflow menu — Settings only.
- **Close tab:** a neutral overflow action flushes pending text and title saves before closing. In a single view it returns Home; in a split it removes that pane and returns to a single document. Each split pane owns its own stationary floating bar, portaled into a sibling overlay outside the pane scroll surface; click a bar to activate its note and use its find, font, and menu controls. Focus mode hides only its own bar.
- **Open new tab:** shown in the Actions cards of an empty untitled note. A popup chooses another registered document and either replaces this pane or opens it next to this pane. Split editing keeps both documents mounted with independent scroll surfaces. The seam is the frame colour and can be dragged or moved with arrow keys while preserving a rem-scaled writing-width minimum on both sides. Its top and bottom shape comes from the pane's inset rounded corners, not decorative caps. Actions cards reflow as two equal cards on one row and the third across the next row when space allows; only the narrowest panes stack all three.

### Definition typing shortcut

Live-only alternative to the bookmark popup for **definitions**:

- Syntax: `{term | definition}` then closing `}` (trigger on `}`).
- Collapses to `term` as `.atom-definition` `AtomNode`; answer stored in SQLite only.
- Saved `.md` contains the collapsed term — **no** `{…}` round-trip on disk or import.
- Skips fenced code blocks, inline code, and existing atom nodes. Term ≤ 120 chars; definition ≤ 2000 chars.
- Save failure: revert to plain `term` + `.editor-shortcut-error` (`var(--destructive)`).
- Layer: Lexical `replace` → [`definitionShortcutBridge.ts`](src/editor/lib/definitionShortcutBridge.ts) → [`useEditorAtomBridge.ts`](src/hooks/useEditorAtomBridge.ts); plugins never import `store/`.

### References

- The selected-text annotation popup offers **Reference** in place of new **Note** annotations. Its content field accepts the citation text (for example, `AGLC4`).
- Saving a reference leaves the selected prose unchanged and appends a one-based superscript marker. References are stored only in the note Markdown as `[^citation]`; they never create an atom, bookmark card, or SQLite bookmark row.
- The outline has separate **Contents** and **References** tabs. References appear in document order as `1. citation`; selecting one scrolls to its superscript marker. Typing or pasting the same Markdown form also creates a reference marker.

```css
.editor-bar {
  border: 1px solid var(--shell-chrome-border);
  border-radius: var(--radius-pill);
  background: var(--shell-chrome-bg);
  backdrop-filter: blur(var(--shell-chrome-blur));
  -webkit-backdrop-filter: blur(var(--shell-chrome-blur));
  min-width: var(--editor-bar-min-w);
  max-width: calc(100vw - 2 * var(--shell-inset-x));
}

.editor-bar-menu-panel {
  background: var(--shell-chrome-bg-strong);
  border: 1px solid var(--shell-chrome-border);
  backdrop-filter: blur(var(--shell-chrome-blur));
  -webkit-backdrop-filter: blur(var(--shell-chrome-blur));
}

.editor-bar-prompt {
  flex: 1;
  min-width: var(--editor-bar-prompt-min-w);
}

.bottom-bar-inner {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: var(--space-4);
}
```

### Bottom bar (future)

Thin strip at rest. Expands on hover over the bottom quarter of the viewport.

```css
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-bar-collapsed-h);
  background: var(--surface);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  overflow: hidden;
  transition: height 220ms cubic-bezier(0.32, 0, 0.16, 1);
  z-index: 100;
}

/* Hover zone — the bottom 25vh triggers expand */
.bottom-bar-hover-zone {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25vh;
  pointer-events: none;
  z-index: 99;
}

.bottom-bar-hover-zone:hover + .bottom-bar,
.bottom-bar:hover {
  height: var(--bottom-bar-h);
}

.bottom-bar-inner {
  height: var(--bottom-bar-h);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: var(--space-4);
}
```

### Bottom bar toggle

```css
.bb-toggle {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  transition: color 150ms ease, background 150ms ease, border-color 150ms ease;
  letter-spacing: 0.02em;
}

.bb-toggle:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
  background: var(--accent-subtle);
}

.bb-toggle.active {
  color: var(--accent-text);
  background: var(--accent-subtle);
  border-color: var(--accent);
}
```

### Bottom bar arrows

```css
.bb-arrow {
  color: var(--text-secondary);
  background: transparent;
}

.bb-arrow:disabled {
  opacity: 0.25;
}
```

### Home screen

The home screen is a wide launch hub aligned with the titlebar content band (`--shell-content-max`). The welcome area is a decorative AI-cached message in `var(--font-serif)`: a large primary greeting, a smaller italic secondary message, and an optional subdued sign line above search. Primary actions live in the persistent bottom-left action strip, so the Home content area stays focused on search and notes.

- **Welcome** ([`WelcomeHeading.tsx`](src/components/home/WelcomeHeading.tsx)): `useAiWelcomeMessages` displays one message from a cached batch of five. Once all five messages have been shown, Home may request a new batch from the latest edited writing-like document. Missing key and generation errors surface as notifications, never inline Home copy.

- **Search** ([`SearchField.tsx`](src/components/ui/SearchField.tsx), `variant="pill"`): live filter on keystroke. Empty query shows the 10 most recently opened notes. Non-empty query searches **all** registry `.md` files (title + body); case-insensitive substring via `matchesSearch`.
- **View all** (`.view-all-button`): navigates to Documents browse (replaces former disabled filter chips).

```css
.home-view.app-shell {
  padding-top: calc(var(--titlebar-h) + var(--space-12));
  padding-bottom: var(--space-12);
}

.home-view {
  max-width: var(--shell-content-max);
  margin-inline: auto;
}

.home-welcome {
  font-family: var(--font-sans);
  font-size: clamp(var(--text-2xl), 3.5vw, calc(var(--text-2xl) + var(--space-4)));
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.home-actions {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.recent-list {
  display: grid;
  gap: var(--space-3);
}

.recent-row {
  border: 1px solid var(--shell-chrome-border);
  border-radius: var(--radius-lg);
  padding-block: var(--space-6);
  padding-inline: var(--space-4);
}
```

### Confirm dialog

Shared destructive confirmation (`.confirm-dialog-layer` + `.confirm-dialog` in [`confirm-dialog.css`](src/styles/confirm-dialog.css)). Centered on a flat scrim (`color-mix` on `--bg-deep`, no blur). Title, body, optional `.confirm-dialog-error` (`var(--destructive)`), action row (`.confirm-dialog-actions` — `align-items: center`, `gap: var(--space-3)`). **Cancel** (`.confirm-dialog-cancel` — bordered secondary) + **Delete** (`.confirm-dialog-confirm` — solid `var(--destructive)` fill, `var(--destructive-on)` label; not red-on-red-tint). Both buttons share `min-height` and `box-sizing: border-box`. Escape and scrim dismiss without action. Used before **every** delete — no `window.confirm`, no instant removal.

| Delete kind | Title | Typical message |
|-------------|-------|----------------|
| Note | Delete note? | Permanently removes the `.md` file and all bookmarks in it |
| Bookmark | Delete bookmark? | Removes bookmark only; highlighted source text in the note stays |

### Documents browse

- **Controls:** search · Filter (disabled shell) · **delete bin** (`.browse-delete-bin` in [`base.css`](src/styles/base.css), Lucide `Trash2`).
- **Search** ([`SearchField.tsx`](src/components/ui/SearchField.tsx)): live global filter on keystroke; matches title + full `.md` body across all registry files; case-insensitive substring. Placeholder “Global search…”.
- **Delete bin:** drop target for draggable `.document-row` shells; drag-over uses `.is-drop-target` highlight; drop opens confirm dialog before delete.
- **Rows:** `.document-row` is a `div` shell (not `<button>`) — **whole row body** is `draggable` in Tauri; `cursor: grab`. Click/keyboard opens editor; drag uses `browseDrag.ts` to avoid click-after-drag.
- **While dragging:** `html.is-browse-dragging` keeps source rows/cards at full opacity (solid); a compact **drag follower** (`.browse-drag-ghost.is-follower`) anchors its origin at the pointer (`clientX` / `clientY` + optional `--browse-drag-follower-offset-y`) at full opacity — not the full row/card screenshot.
- **Drag follower:** [`browseDragGhost.ts`](src/lib/browseDragGhost.ts) suppresses Chromium’s faded native ghost (`setDragImage` 1×1 blank) and positions the same mini panel at the pointer via `document` `drag` events (`left: clientX`, `top: clientY`); [`browseDrag.ts`](src/lib/browseDrag.ts) clears it on both source `dragend` and window-level `drop`/`dragend` fallback events. Width `min(--browse-drag-ghost-w, 13.5rem)`; `--surface-solid` + `--border-strong`; icon + truncated primary + secondary (`--text-secondary`). No destructive colour on the follower.

### Editor outline

The outline toggle lives on the floating editor bar (`ListTree` + “Outline”, `aria-pressed` when open). The writing column stays centered and fluid at `--editor-col-w`; opening the outline does not reserve a layout column.

When open, `.outline-layer` covers the viewport: scrim (click to close) and `.outline-panel` centered on screen. Panel header is the **document display name** (sans, semibold) — not the word “Outline”. A segmented control separates **Contents** (headings) from **References**. If the first Markdown heading matches the document display name, it is hidden from Contents so the title appears once. Rows use heading level for minimal hierarchy: H1 primary/medium, H2 slightly indented, deeper headings progressively indented and quieter with a subtle token-colour guide only. References appear as their document-order number plus citation text. Clicking a heading or reference scrolls to its matching editor marker via [`outlineNavigation.ts`](src/lib/outlineNavigation.ts) and shared [`scrollEditorTarget.ts`](src/lib/scrollEditorTarget.ts) — same eased navigation scroll as find (anchor `--editor-scroll-target-ratio`, duration `--dur-editor-scroll`, easing `--ease-out`). The panel **stays open** after navigation. Close via scrim or bar toggle only.

```css
.editor-layout {
  display: block;
  max-width: var(--editor-col-w);
  margin-inline: auto;
  padding-block: var(--editor-pad-v);
  padding-inline: var(--editor-gutter);
}

.outline-panel {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--outline-panel-w);
  max-height: var(--outline-panel-centered-max-h);
}
```

Do not put the outline in `.editor-layout` grid columns. Do not add a chevron close control in the panel header.

### Editor writing surface

```css
.editor-view {
  background: var(--bg);
  min-height: 100vh;
  padding-top: var(--titlebar-h);
  padding-bottom: var(--bottom-bar-h);
}

.editor-inner {
  max-width: var(--editor-col-w);
  margin: 0 auto;
  padding-block: var(--editor-pad-v);
  padding-inline: var(--editor-gutter);
}

/* All editor text — preset via --editor-font-family */
.editor-root {
  font-family: var(--editor-font-family);
  font-size: var(--editor-text);
  line-height: var(--editor-line-height);
  color: var(--editor-prose);
  caret-color: var(--accent);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.editor-root h1 { font-size: var(--editor-h1); font-weight: 600; line-height: var(--editor-heading-line-height); margin-bottom: var(--space-4); }
.editor-root h2 { font-size: var(--editor-h2); font-weight: 600; line-height: var(--editor-heading-line-height); margin-bottom: var(--space-3); }
.editor-root h3 { font-size: var(--editor-h3); font-weight: 500; line-height: var(--editor-heading-line-height); margin-bottom: var(--space-3); }
.editor-root h4 { font-size: var(--editor-h4); font-weight: 500; line-height: var(--editor-heading-line-height); margin-bottom: var(--space-3); }
.editor-root h5 { font-size: var(--editor-h5); font-weight: 500; line-height: var(--editor-heading-line-height); margin-bottom: var(--space-2); }
.editor-root h6 { font-size: var(--editor-h6); font-weight: 500; line-height: var(--editor-heading-line-height); margin-bottom: var(--space-2); }

.editor-root p       { margin-bottom: var(--space-4); }
.editor-root ul,
.editor-root ol      { margin-bottom: var(--space-4); padding-left: var(--space-6); }
.editor-root li      { margin-bottom: var(--space-2); }
.editor-root blockquote {
  border-left: 2px solid var(--accent);
  padding-left: var(--space-4);
  color: var(--text-secondary);
  font-style: italic;
  margin: var(--space-6) 0;
}
.editor-root code {
  font-family: "GeistMono", "SF Mono", monospace;
  font-size: 0.9em;
  background: var(--bg-deep);
  border-radius: var(--radius-sm);
  padding: 0.1em 0.35em;
}
.editor-root pre {
  background: var(--bg-deep);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-6);
  overflow-x: auto;
  margin: var(--space-6) 0;
}
.editor-root pre code {
  background: none;
  padding: 0;
}
```

Smart Markdown paste is invisible editor behavior: AI-style Markdown copied from chat tools is accepted as formatted editor blocks through the existing paste action. There is no popup, prompt, toast, or alternate paste control; ordinary prose and rich clipboard content keep the default paste feel.

Preserved empty paragraphs render as compact blank lines: they keep caret placement and survive save/reopen, but use reduced line-height and margin so several intentional blank lines do not visually balloon the writing surface.

Paste-time spacing cleanup is also invisible: newly pasted runs of empty paragraphs are reduced to one quiet separator, while user-created or pre-existing blank paragraphs remain visually compact instead of being rewritten on save/load.

### Bookmarks tab

Browse view for saved bookmarks. Uses `.app-shell.atoms-view` with `.atoms-stack` capped at `--shell-content-max` (same shell browse width as Documents). Bookmarks display as a **flashcard grid** (`.bookmark-flashcard-grid`), not a vertical list.

**Library:** All bookmarks load in one grid — no `activeFileId` filtering and no scope header (“From {title}”).

**Controls:**
- Search ([`SearchField.tsx`](src/components/ui/SearchField.tsx)) — live filter on keystroke; matches definition `sourceText` (highlighted phrase) only; case-insensitive substring. Placeholder “Bookmark search…”.
- **Filter** (`.bookmark-filter-menu`) — opens Apple-style `.bookmark-filter-panel` vertical menu (`.bookmark-filter-item` rows, checkmark on active). Options: **All · Definitions · Notes · Reminders**. Button label is “Filter” when All; otherwise the active filter name. No inline filter chips on the browse surface.
- **Delete bin** (`.browse-delete-bin`, shared with Documents) — after Filter; drop target for draggable flashcards; confirms before delete.

**Flashcard (`.bookmark-flashcard`):**
- Fixed Anki-style portrait box: `var(--bookmark-card-w)` × `var(--bookmark-card-h)`; outer shell locks dimensions so flip never reflows the grid.
- Grid: `repeat(auto-fill, var(--bookmark-card-w))` with `justify-content: start` — cards never stretch to full row width.
- Click or Enter/Space toggles in-place flip on `.bookmark-flashcard-inner` (`aria-pressed`, `.is-flipped`); faces use `overflow: hidden`. No browser focus ring on the outer `.bookmark-flashcard` shell (`outline: none` on `:focus` / `:focus-visible`) — face border is sufficient chrome; prevents black outline on Space flip.
- **Front:** centered source text in `.bookmark-flashcard-body` (`.bookmark-flashcard-source` — `var(--font-sans)`, `var(--text-base)`, `var(--text-primary)`); footer (`.bookmark-flashcard-footer`) with type pill + document title.
- **Back:** centered answer in `.bookmark-flashcard-body` (`.bookmark-flashcard-content` — `var(--font-sans)`, `var(--text-lg)`), same footer, edit (`.bookmark-flashcard-edit` — Lucide `Pencil`, 14px, absolute top-right, neutral tertiary hover). Pen opens shared [`AtomPopup`](src/components/atoms/AtomPopup.tsx) in edit mode (type, answer, and double-click-editable source). Browse delete is **bin only** — drop to `.browse-delete-bin` opens confirm dialog before removal.
- **Drag:** whole `.bookmark-flashcard` body is `draggable` in Tauri (no grip handle); `cursor: grab`; payload via `writeDragPayload`; compact drag ghost (sourceText + type · doc title). Flip click suppressed after drag via `consumeBrowseDragClick`.
- **Stack folder (`.bookmark-stack-folder`):** drop one definition bookmark onto another card or folder (not the bin) merges via `atoms.group_label` (stack UUID); drag-over uses neutral `.is-stack-drop-target` (`--border-strong` outline only — not destructive, not accent). Stacks (count ≥ 2) render as a **minimal flat tile** in [`bookmark-stack-folder.css`](src/styles/bookmark-stack-folder.css) — single `--surface` card shell (`--shell-chrome-border`, `--radius-lg`, optional backdrop blur like flashcard faces; **no** box-shadow); up to two **thin horizontal stack rules** (`.bookmark-stack-folder-fringe` — `border-top: 1px solid var(--border)` only, no bordered mini-cards) + footer row with name (`--bookmark-stack-folder-name-size`, default `var(--text-base)`) and plain tertiary count text — **no icon**. Default name `"Stack"`; **double-click name** via shared [`BookmarkStackNameEditor.tsx`](src/components/atoms/BookmarkStackNameEditor.tsx) → inline rename (persisted in `settings` as `bookmark_stack_name:{uuid}`); label row click does not open the popup. **Single click** folder body → `.bookmark-stack-popup-layer` ([`BookmarkStackPopup.tsx`](src/components/atoms/BookmarkStackPopup.tsx)) — header shows double-click-renamable folder name; card shell in [`BookmarkStackPopupCard.tsx`](src/components/atoms/BookmarkStackPopupCard.tsx); popup card scales via `--bookmark-popup-card-w` (fluid to viewport); body/meta type scale via `--bookmark-popup-body-size` / `--bookmark-popup-meta-size`; **card switch** (prev/next/shuffle only — not initial open) via asymmetric `data-stack-leave` then `data-stack-enter` + `--dur-stack-card-leave` / `--dur-stack-card-enter` / `--stack-card-shift` in [`transitions.css`](src/styles/transitions.css); flip uses `--bookmark-popup-perspective`, `--dur-slow`, and solid `--surface-solid` faces (no backdrop blur during 3D); prev/counter/**Shuffle icon** (borderless Lucide, session-only reorder via [`shuffleAtomRecords`](src/lib/bookmarkStacks.ts))/next; in-popup flip + back-face pen edit (same `AtomPopup` edit mode), `z-index: 120`. Search includes a stack when **any** definition member matches.
- **Document project folder (`.document-project-folder`):** Documents/View all only. Drop one document row/folder onto another document row/folder to group by `files.project_group_label`; markdown files stay in place on disk. Project folders reuse the neutral document row surface, show a Lucide `ChevronDown` icon button instead of a count pill, and use `.is-project-drop-target` with `--border-strong` / `--surface` only — not destructive, not accent. Clicking the row or chevron expands inline `.document-project-member-row` notes; the chevron rotates while open. Row context menu exposes Rename plus Delete project folder; delete dissolves the folder only and keeps notes. Member rows are draggable; dropping one on the surrounding Documents list surface removes it from the project. Project membership changes stage with `useStagedProjectItems`: the removed/collapsed note disappears first, then the list reflows. Search shows a project when any member matches, but expanded projects still list the full project.
- Attribution: document title only (`files.title` via `atom.fileId`) — no created/relative timestamps on card faces.
- Flip transition on `transform` only — grid: `--dur-base` + `--ease-out`; popup: `--dur-slow` + `--ease-out` with scaled `--bookmark-popup-perspective`.

**Empty:** `.atom-list-empty` — one muted line when no definitions exist; `No definitions match your search.` when search is active and nothing matches; no illustration.

**Forbidden on Bookmarks tab:** full-width stretched cards; scope headers; timestamps on cards; layout reflow on flip; inline filter chip row on the page; Sparkles icon cards; creation cards; accent on delete/bin/stack drop; destructive **X** on browse flashcard back (delete is bin-only); accent on edit pen; instant delete without confirm; confirm dialog on stack merge; second accent CTA; searching `answer`, document title, or type label in v1; fuzzy/regex search; Enter-to-search submit.

**Forbidden on browse search (Home, Documents, Bookmarks):** fuzzy match; regex; submit-only search (must filter while typing, not on Enter); SQLite full-text index in v1; `readFile` or store access from components (hooks only).

```css
.bookmark-flashcard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--bookmark-card-w));
  gap: var(--space-4);
  justify-content: start;
}

.bookmark-flashcard {
  width: var(--bookmark-card-w);
  height: var(--bookmark-card-h);
}

.bookmark-flashcard-source {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  text-align: center;
}

.bookmark-flashcard-content {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  text-align: center;
}

.bookmark-flashcard-doc {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

### Context menu

App-native context menus use the shared `.context-menu` surface (`--surface-strong`) and Lucide icons. Separators are structural: they separate clipboard/open actions, constructive metadata actions, reveal/navigation actions, and destructive actions. **Reveal in Finder and Delete must never be adjacent without a separator.**

**Editor grouping:** Cut, Copy, Paste / Bookmark / Look up "{word}", Search in notes. Bookmark appears only with selected text. Look up appears on macOS only.

**Note row grouping:** Pin or Unpin / Rename, Duplicate / Reveal in Finder / Delete. Delete is destructive and still opens `ConfirmDialog`. These menus appear on Home recent rows and Documents rows only, never in the sidebar.

**Bookmark grouping:** solo cards use Edit / Delete. Stack folders use Rename / Delete stack. Bookmark menus never show note-only actions such as pin, duplicate, or reveal. The Bookmarks tab shows definition atoms only; notes stay inside their source document as underlined wiki annotations, and reminders have no text decoration.

```css
.context-menu {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  background: var(--surface-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  box-shadow: var(--shadow-md);
  min-width: 160px;
}

.context-menu-item {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-weight: 400;
  cursor: pointer;
  transition: background 120ms ease;
}

.context-menu-item:hover {
  background: var(--accent-subtle);
  color: var(--accent-text);
}

.context-menu-item.destructive {
  color: #B42020;
}
```

---

## Motion

```css
/* Easings (tokens.css) */
--ease-out:    cubic-bezier(0.32, 0, 0.16, 1);   /* arriving — decelerates in */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);        /* leaving — accelerates out */
--ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1);  /* popups / accent actions only */

/* Legacy shell durations */
--dur-fast: 150ms;   /* hover states */
--dur-base: 220ms;   /* bottom bar, light chrome */
--dur-slow: 400ms;   /* focus mode dimming */
```

View-specific durations (`--dur-tab-*`, `--dur-open-*`, `--dur-close-*`, search, modal, sidebar, focus) live in the same block in `tokens.css` and are documented under **Transition system** below.

Rules:
- Never `transition: all`
- Only transition `opacity`, `transform`, `color`, `background`, `border-color`
- Editor find/outline navigation scroll uses JS rAF easing with `--dur-editor-scroll` + `--ease-out` via `scrollEditorTarget.ts`; typewriter caret scroll remains instant
- Focus mode dimming uses asymmetric 380ms / 240ms opacity — atmosphere, not snap toggle; its editor bar slide uses `var(--ease-out)` at 360ms (not yet migrated to `--dur-focus-*`)
- Shell chrome uses `--dur-base` or `--dur-fast`
- No spring easing in the editor writing surface — spring is for popups and accent interactions only

---

## Transition system

UI-agnostic orchestration for view swaps, search lists, and (CSS-ready) surfaces. Components never hardcode timing — they receive data attributes or stagger indices only.

### Layers

| Layer | Markup | Hook / owner | Status |
|---|---|---|---|
| **View** | `data-view` + `data-state` + `data-transition` on `.view-stage` children | [`useViewTransition.ts`](src/hooks/useViewTransition.ts) in [`App.tsx`](src/App.tsx) only | Live |
| **Search stagger** | `data-stagger` on list wrapper; `--stagger-index` per row | [`useSearchStagger.ts`](src/hooks/useSearchStagger.ts) in Home/Documents; [`useStagedProjectItems.ts`](src/hooks/useStagedProjectItems.ts) for Documents project membership changes | Live |
| **Stack card switch** | `data-stack-leave` then `data-stack-enter` on `.bookmark-stack-popup-card` | [`BookmarkStackPopup.tsx`](src/components/atoms/BookmarkStackPopup.tsx) + [`BookmarkStackPopupCard.tsx`](src/components/atoms/BookmarkStackPopupCard.tsx) | Live |
| **Modal** | `data-transition="modal"` + `data-state` | Future: popup roots (`AtomPopup`, `ConfirmDialog`) | CSS only |

### View names

`'home' | 'editor' | 'documents' | 'atoms' | 'settings' | 'account'` — Sidebar label **Bookmarks** maps to `atoms`.

### Transition types

| Type | When | Leave ms | Enter ms | Easing |
|---|---|---|---|---|
| `tab` | Home ↔ Documents ↔ Bookmarks ↔ Settings ↔ Account | 180 (`--dur-tab-leave`) | 220 (`--dur-tab-enter`) | out / in |
| `open` | Any view → editor | 200 (`--dur-open-leave`) | 280 (`--dur-open-enter`) | out / in |
| `close` | Editor → any view | 160 (`--dur-close-leave`) | 240 (`--dur-close-enter`) | out / in |
| `none` | Instant (override only) | 0 | — | — |

`resolveTransition(from, to)` in the hook picks `open` / `close` / `tab` automatically. Views never import `useViewTransition`; they keep existing props (`onOpenEditor`, etc.).

### Search stagger

- Enter: `--dur-search-enter` (280ms, `--ease-out`) + `--dur-stagger` (32ms) per item via `--stagger-index`, capped at `--stagger-max-index` (8)
- Leave on query change: wrapper gets class `leaving`; items exit in list order with the same capped stagger in `--dur-search-leave` (200ms, `--ease-in`) before the filtered list swaps
- Hook wait: [`searchLeaveDurationMs`](src/lib/searchStaggerTiming.ts) in [`useSearchStagger.ts`](src/hooks/useSearchStagger.ts) — leave duration + capped stagger total; must match CSS tokens

### Stack card switch

- Asymmetric **leave then enter** on prev/next/shuffle only — not on initial popup open
- Leave: `--dur-stack-card-leave` (200ms, `--ease-in`); enter: `--dur-stack-card-enter` (280ms, `--ease-out`) — same asymmetric ratio as open-note view transitions
- Next / Previous: horizontal fade using `--stack-card-shift`; outgoing exits opposite incoming direction
- Shuffle: vertical fade (4px) on leave and enter — no horizontal direction
- Nav disabled for the duration of the two-phase transition
- Distinct from in-card flip (`rotateY`, `--dur-slow` on `.bookmark-flashcard-inner`)

### Sidebar retraction

- The rail is mounted only while visible and uses `.app-frame.has-sidebar` to claim `var(--sidebar-w)` as a grid track.
- Retraction is an explicit shell-layout change, not a modal animation: there is no scrim, portal, panel enter/leave keyframe, or focus management.
- Opening a note keeps the current rail state. The existing editor open/close transitions remain opacity-only.

### Files

- Tokens: [`src/styles/tokens.css`](src/styles/tokens.css) — all `--dur-*` and `--ease-*`
- Keyframes: [`src/styles/transitions.css`](src/styles/transitions.css) — imported in [`main.tsx`](src/main.tsx) after tokens
- Shell: [`TransitionShell.tsx`](src/components/shell/TransitionShell.tsx) — attributes only, no logic
- Router: [`renderAppPage.tsx`](src/lib/renderAppPage.tsx) — maps `ViewName` → view components

### Rules

- Navigation state lives only in `useViewTransition` — no parallel `useState` view in `App.tsx`
- No hardcoded `ms` values in components; hook `EXIT_DURATION` must match CSS **leave** tokens
- Never `transition: all`
- TitleBar stays outside `.view-stage` (persistent chrome)
- Editor fixed chrome (`.editor-bar`, `FocusExitButton`) portals to `document.body` — not inside `[data-view]`
- Note entry: editor bar reveals via `chrome-offstage` after document `ready` — titlebar not offstaged
- Adding a view: extend `ViewName`, add a `renderAppPage` case — transitions follow automatically
- Adding a transition type: token + keyframe in `transitions.css` + `EXIT_DURATION` + `TransitionType` union

---

## Icons

Lucide icons only. Stroke only, never filled. Size 16px in chrome, 18px in context menus.

```tsx
import { Focus, Feather, Atom, ChevronRight, File } from 'lucide-react'

// Always set strokeWidth explicitly
<Focus size={16} strokeWidth={1.5} />
```

Never use custom filled SVGs, emoji, or icon fonts.

**Product logo exception:** `loci notebook logo.png` is the original raster brand artwork. `loci notebook icon.png` is the cleaned transparent icon source for the browser favicon and generated native Tauri app icons. Do not reuse either asset as in-app decoration or as a replacement for Lucide action icons.

---

## Forbidden

| Forbidden | Use instead |
|---|---|
| `font-family: Inter` or hardcoded faces | `var(--font-sans)`, `var(--font-serif)`, or `var(--editor-font-family)` |
| Hardcoded shell padding like `padding: 16px` | `var(--space-N)` |
| Hardcoded radii like `border-radius: 8px` | `var(--radius-N)` |
| `font-weight: 700` or `bold` | 600 maximum |
| `transition: all` | Enumerate specific properties |
| `linear-gradient` in shell chrome | Flat surfaces only |
| Page background gradient on `html` / `body` / `.app-shell` | Flat `var(--bg)` only |
| Per-view `min(38rem\|44rem\|56rem\|72rem, …)` width caps | `var(--shell-content-max)` |
| Titlebar `left: 50%` + `translateX(-50%)` for primary nav | Inset-based full width with `--shell-inset-x` |
| Outline column in `.editor-layout` grid | Overlay only; editor column unchanged |
| Outline toggle outside editor bar | Toggle on `.editor-bar` only |
| Chevron close in outline header | Plain title; close via scrim + bar |
| Panel header text "Outline" | Document display name |
| `top: titlebar + inset` on centered outline panel | `50%` + `translate(-50%, -50%)` |
| Theme toggle without `data-theme` + token docs | Dual-layer tokens in `tokens.css` + DESIGN |
| Focus / Atoms as bar text buttons | Prompt field + overflow `AppleToggle` menu |
| Pill `.bb-toggle` on floating editor bar | `AppleToggle` in menu panel |
| Accent on prompt, arrows, or outline | Neutral text tokens; active `AppleToggle` only |
| Inline filter chips on Bookmarks browse surface | Filter popover (`.bookmark-filter-panel`) only |
| Bookmarks tab Sparkles / creation cards | `.bookmark-flashcard-grid` flip cards |
| `#000000` or `#FFFFFF` | Tokenised colours only |
| Inventing a new colour not in the token list | Add to `tokens.css` first |
| Accent on more than one element per view | One accent element, always the primary action |
| `type="search"` on browse search fields | [`SearchField.tsx`](src/components/ui/SearchField.tsx) with Lucide `X` clear |
| Native browser search clear buttons | Lucide `X` via `.search-field-clear` |
| Bookmark search on `answer` or document title | `sourceText` only in `AtomPanel` |
| `readFile` / `listAllFiles` in browse view components | `useSearchableDocuments` hook only |
| Native OS decorations on Windows Tauri | Frameless + permanent `.window-chrome` with Windows glyph controls |
| Hover-revealed window chrome | Permanent `--titlebar-h` top bar |
| Frosted/blur or shadows on `.window-chrome` | Flat, theme-inverted window frame |
| `--accent` or traffic-light colours on window controls | Neutral glyphs and hover surface tokens only |
| `@tauri-apps/api/window` outside `lib/tauri.ts` | Window helpers in `lib/tauri.ts` |
| `window.confirm` or instant delete without dialog | `ConfirmDialog` + `useDeleteDocument` / `useAtoms.removeAtom` |
| `invoke('delete_file')` outside `lib/tauri.ts` | `useDeleteDocument` hook only |
| `deleteAtom` / `deleteFile` called directly from components | Hooks after confirm |
| Accent colour on delete bin or delete buttons | `--destructive` for delete only; no editor-bar delete accent |
| `draggable` on `<button>` for browse delete | Whole `div.document-row` / `article.bookmark-flashcard` body |
| Separate drag-handle / grip icon for browse delete | Whole row or flashcard body draggable |
| Default full-size HTML5 drag screenshot | `.browse-drag-ghost.is-follower` cursor panel in `browseDragGhost.ts` |
| Faded Chromium `setDragImage` DOM ghost | Blank `setDragImage` + full-opacity follower panel |
| Destructive styling on drag ghost | Neutral `--surface-solid` follower; red highlight on bin `.is-drop-target` only |
| Accent/destructive on stack card drop target | `.is-stack-drop-target` uses `--shell-chrome-border` outline only |
| Stack as flashcard face in grid | `.bookmark-stack-folder` tile; solo bookmarks use `.bookmark-flashcard` only |
| Lucide icon as stack folder | Thin stack rules + footer name/count — no icon |
| Box-shadow / strong-border folder chrome on grid stack tile | Flat `--surface` shell matching flashcard browse minimalism |
| Popup stack card different aspect than grid | `--bookmark-popup-card-h` derived from `--bookmark-popup-card-w` (20:12) |
| `{term \| def}` markdown import on file load | Live typing shortcut only; collapsed term on disk |
| Lexical plugin calling `createAtom` / store for shortcuts | `definitionShortcutBridge` → `useEditorAtomBridge` |
| Filled Lucide icons | Stroke only |
