# Markdown Slides

A sleek, feature-rich single-page app that turns Markdown into presentation
slides — entirely in the browser. Built with **Vite + Lit + TypeScript**,
**Tailwind v4**, **daisyUI**, and **Heroicons**. No metaframework.

## Features

- **Live split editor** — write Markdown on the left, see slides render on the right.
- **Slide syntax** — split slides with a line of `---`; split a single slide into
  columns with a line of `===`. Full GitHub-flavored Markdown: headings, lists,
  tables, quotes, images, links, and fenced code with syntax highlighting.
- **10 slide themes** — Minimal, Corporate, Sunset, Forest, Paper, Mono, Ink,
  Midnight, Dracula, Neon. Syntax-highlight palettes adapt per theme.
- **Fonts** — 10 body fonts and 6 code fonts (Google Fonts, lazy-loaded on demand),
  plus an adjustable text-size scale.
- **Aspect ratios** — 16:9, 4:3, 16:10.
- **Transitions** — fade / slide / zoom (via the Web Animations API).
- **Navigation** — arrow keys, on-screen arrows, a thumbnail filmstrip, and a
  full-deck overview grid.
- **Presenter mode** — fullscreen playback with keyboard control, a progress bar,
  and auto-hiding controls.
- **File I/O** — open `.md` files (button or drag-and-drop), download your Markdown,
  or **export to PDF** (one slide per page via the print dialog).
- **Site dark / light / system mode** — independent of the slide theme.
- **Persistent** — your content and settings are saved to `localStorage`.

## Getting started

```bash
pnpm install
pnpm dev
```

Then open the URL Vite prints (default http://localhost:5173).

### Other scripts

```bash
pnpm build     # type-check (tsc) + production build to dist/
pnpm preview   # serve the production build
```

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `←` / `→` (or `↑` / `↓`) | Previous / next slide |
| `Home` / `End` | First / last slide |
| `P` or `F5` | Start presenting |
| `Esc` | Exit presenter |
| `F` | Toggle fullscreen (in presenter) |

## Architecture

Everything is a Lit component rendered into the **light DOM** (see
`src/lit-base.ts`), so global Tailwind + daisyUI utility classes and the slide
theme CSS apply everywhere.

| File | Responsibility |
| --- | --- |
| `src/store.ts` | Reactive, `localStorage`-backed settings store |
| `src/markdown.ts` | Markdown → slides parser (`marked` + `highlight.js`) |
| `src/config.ts` | Theme / font / aspect / transition catalogues + sample deck |
| `src/derive.ts` | Resolves store state into concrete render settings |
| `src/icons.ts` | Heroicons (raw SVGs) + render helper |
| `src/components/slide-view.ts` | Fixed 1280×720 canvas, scaled to fit its container |
| `src/components/*` | Editor, preview, overview, presenter, settings, shell |

Slides render on a fixed logical canvas and are scaled with a CSS transform, so a
deck looks pixel-identical at any viewport size.

> **Note on `heroicons`:** the package ships prebuilt SVGs but includes a
> destructive `build` script. `pnpm-workspace.yaml` marks it as
> `neverBuiltDependencies` so it is never rebuilt on install.
