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

This project uses **pnpm** exclusively. The expected version is pinned in
`package.json` as `pnpm@11.16.0`.

```bash
pnpm install
pnpm dev
```

Then open the URL Vite prints (default http://localhost:5173).

### Other scripts

```bash
pnpm lint      # run oxlint
pnpm fmt       # format the repository with oxfmt
pnpm build     # type-check (tsc) + production build to dist/
pnpm preview   # serve the production build
```

Do not use `npm`, `npx`, `yarn`, or `bun` for this repository.

## Keyboard shortcuts

| Key                      | Action                           |
| ------------------------ | -------------------------------- |
| `←` / `→` (or `↑` / `↓`) | Previous / next slide            |
| `Home` / `End`           | First / last slide               |
| `P` or `F5`              | Start presenting                 |
| `Esc`                    | Exit presenter                   |
| `F`                      | Toggle fullscreen (in presenter) |
