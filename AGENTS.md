# Agent Guide

This repository is a browser-only Markdown slide deck editor built with Vite, Lit, TypeScript, Tailwind CSS v4, daisyUI, marked, Shiki, and Iconify.

## Package manager

- Use **pnpm** for every package-management command.
- Do not use `npm`, `npx`, `yarn`, or `bun` in this project.
- The expected package manager is pinned in `package.json` as `pnpm@11.16.0`.
- Keep `pnpm-lock.yaml` committed when dependency changes are made.

## Common commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm fmt
pnpm preview
```

Use the most targeted command that validates your change. For source changes, prefer at least `pnpm lint` and `pnpm build` when practical.

## Project structure

- `src/store.ts` — reactive `localStorage`-backed app state.
- `src/markdown.ts` — Markdown parsing, slide splitting, and column splitting.
- `src/highlighter.ts` — Shiki-powered syntax highlighting.
- `src/config.ts` — theme, font, aspect ratio, transition, and sample deck configuration.
- `src/derive.ts` — derived render settings from store state.
- `src/icons.ts` — Iconify SVG helpers.
- `src/components/` — Lit UI components for editor, preview, presenter, settings, and app shell.
- `public/` — static assets served by Vite.

## Coding conventions

- Keep changes small, focused, and consistent with the existing TypeScript + Lit style.
- Components render into the light DOM via `src/lit-base.ts`; use global Tailwind/daisyUI classes instead of Shadow DOM-scoped styles.
- Prefer existing helpers, configuration objects, and store patterns before introducing new abstractions.
- Avoid adding dependencies unless they are clearly justified and compatible with the current Vite/Lit setup.
- Do not hardcode secrets or environment-specific absolute paths.

## Validation

- `pnpm lint` runs oxlint.
- `pnpm fmt` runs oxfmt over the repository.
- `pnpm build` runs `tsc` and creates a production Vite build in `dist/`.
- `pnpm preview` serves the production build; do not run it as a long-lived process in automated agent work unless explicitly requested.

## Dependency-build warning

Iconify icon data is provided by @iconify-json/heroicons and rendered by @iconify/tailwind4.
