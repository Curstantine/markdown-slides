/**
 * Static option catalogues for the settings UI: slide themes, fonts, code
 * fonts, aspect ratios and transitions. Fonts declare a Google Fonts spec so
 * they can be lazy-loaded on demand (see loadFont).
 */

/**
 * daisyUI theme names the site color-mode toggle maps to. These MUST match the
 * themes enabled in `@plugin "daisyui"` in index.css:
 *   - SITE_LIGHT_THEME is used for "Light" mode (should be the `--default` theme)
 *   - SITE_DARK_THEME is used for "Dark" mode (should be the `--prefersdark` theme)
 * "System" mode removes `data-theme` and lets daisyUI pick between them via the
 * OS `prefers-color-scheme`.
 */
export const SITE_LIGHT_THEME = "nord";
export const SITE_DARK_THEME = "sunset";

export interface SlideThemeDef {
	id: string;
	name: string;
	/** CSS class applied to the .deck root. */
	cls: string;
	/** Small swatch colours for the picker: [background, foreground, accent]. */
	swatch: [string, string, string];
}

export const SLIDE_THEMES: SlideThemeDef[] = [
	{
		id: "minimal",
		name: "Minimal",
		cls: "deck-minimal",
		swatch: ["#ffffff", "#232936", "#6366f1"],
	},
	{
		id: "corporate",
		name: "Corporate",
		cls: "deck-corporate",
		swatch: ["#ffffff", "#0f172a", "#2563eb"],
	},
	{
		id: "sunset",
		name: "Sunset",
		cls: "deck-sunset",
		swatch: ["#fff7ed", "#7c2d12", "#ea580c"],
	},
	{
		id: "forest",
		name: "Forest",
		cls: "deck-forest",
		swatch: ["#f2f8f4", "#064e3b", "#059669"],
	},
	{
		id: "paper",
		name: "Paper",
		cls: "deck-paper",
		swatch: ["#faf6ee", "#1a1712", "#b45309"],
	},
	{
		id: "mono",
		name: "Mono",
		cls: "deck-mono",
		swatch: ["#ffffff", "#000000", "#000000"],
	},
	{
		id: "ink",
		name: "Ink",
		cls: "deck-ink",
		swatch: ["#0f1115", "#f5f7fb", "#7c9cff"],
	},
	{
		id: "midnight",
		name: "Midnight",
		cls: "deck-midnight",
		swatch: ["#0a0e27", "#ffffff", "#818cf8"],
	},
	{
		id: "dracula",
		name: "Dracula",
		cls: "deck-dracula",
		swatch: ["#282a36", "#f8f8f2", "#bd93f9"],
	},
	{
		id: "neon",
		name: "Neon",
		cls: "deck-neon",
		swatch: ["#05060a", "#d7f5ff", "#22d3ee"],
	},
];

export interface FontDef {
	id: string;
	name: string;
	/** Full CSS font-family stack. */
	stack: string;
	/** Google Fonts family spec, e.g. "Inter:wght@400;600;700". Null = system. */
	google: string | null;
}

export const BODY_FONTS: FontDef[] = [
	{
		id: "system",
		name: "System UI",
		stack: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
		google: null,
	},
	{
		id: "inter",
		name: "Inter",
		stack: '"Inter", ui-sans-serif, sans-serif',
		google: "Inter:wght@400;500;600;700;800",
	},
	{
		id: "poppins",
		name: "Poppins",
		stack: '"Poppins", ui-sans-serif, sans-serif',
		google: "Poppins:wght@400;500;600;700",
	},
	{
		id: "source-sans",
		name: "Source Sans 3",
		stack: '"Source Sans 3", ui-sans-serif, sans-serif',
		google: "Source+Sans+3:wght@400;600;700",
	},
	{
		id: "work-sans",
		name: "Work Sans",
		stack: '"Work Sans", ui-sans-serif, sans-serif',
		google: "Work+Sans:wght@400;500;600;700",
	},
	{
		id: "ibm-plex",
		name: "IBM Plex Sans",
		stack: '"IBM Plex Sans", ui-sans-serif, sans-serif',
		google: "IBM+Plex+Sans:wght@400;500;600;700",
	},
	{
		id: "space-grotesk",
		name: "Space Grotesk",
		stack: '"Space Grotesk", ui-sans-serif, sans-serif',
		google: "Space+Grotesk:wght@400;500;600;700",
	},
	{
		id: "merriweather",
		name: "Merriweather",
		stack: '"Merriweather", Georgia, serif',
		google: "Merriweather:wght@400;700;900",
	},
	{
		id: "playfair",
		name: "Playfair Display",
		stack: '"Playfair Display", Georgia, serif',
		google: "Playfair+Display:wght@400;600;700;800",
	},
	{
		id: "lora",
		name: "Lora",
		stack: '"Lora", Georgia, serif',
		google: "Lora:wght@400;500;600;700",
	},
];

export const CODE_FONTS: FontDef[] = [
	{
		id: "system-mono",
		name: "System Mono",
		stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		google: null,
	},
	{
		id: "jetbrains",
		name: "JetBrains Mono",
		stack: '"JetBrains Mono", ui-monospace, monospace',
		google: "JetBrains+Mono:wght@400;500;700",
	},
	{
		id: "fira-code",
		name: "Fira Code",
		stack: '"Fira Code", ui-monospace, monospace',
		google: "Fira+Code:wght@400;500;700",
	},
	{
		id: "source-code",
		name: "Source Code Pro",
		stack: '"Source Code Pro", ui-monospace, monospace',
		google: "Source+Code+Pro:wght@400;500;700",
	},
	{
		id: "ibm-plex-mono",
		name: "IBM Plex Mono",
		stack: '"IBM Plex Mono", ui-monospace, monospace',
		google: "IBM+Plex+Mono:wght@400;500;700",
	},
	{
		id: "space-mono",
		name: "Space Mono",
		stack: '"Space Mono", ui-monospace, monospace',
		google: "Space+Mono:wght@400;700",
	},
];

export interface TransitionDef {
	id: string;
	name: string;
}

export const TRANSITIONS: TransitionDef[] = [
	{ id: "fade", name: "Fade" },
	{ id: "slide", name: "Slide" },
	{ id: "zoom", name: "Zoom" },
	{ id: "none", name: "None" },
];

export interface AspectDef {
	id: string;
	name: string;
	w: number;
	h: number;
}

export const ASPECTS: AspectDef[] = [
	{ id: "16:9", name: "16 : 9", w: 1280, h: 720 },
	{ id: "4:3", name: "4 : 3", w: 1024, h: 768 },
	{ id: "16:10", name: "16 : 10", w: 1280, h: 800 },
];

/** Lazy-load a Google font once; safe to call repeatedly. */
const loaded = new Set<string>();
export function loadFont(def: FontDef | undefined) {
	if (!def?.google || loaded.has(def.google)) return;
	loaded.add(def.google);
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?family=${def.google}&display=swap`;
	document.head.appendChild(link);
}

export function findFont(list: FontDef[], id: string): FontDef {
	return list.find((f) => f.id === id) ?? list[0];
}
export function findSlideTheme(id: string): SlideThemeDef {
	return SLIDE_THEMES.find((t) => t.id === id) ?? SLIDE_THEMES[0];
}

export const SAMPLE_MARKDOWN = `# Markdown Slides

A sleek, feature-rich deck builder.
Write **Markdown** on the left — watch slides appear on the right.

_Use the arrow keys to navigate._

---

## How slides work

- Separate slides with a line containing only \`---\`
- Standard Markdown: **bold**, _italic_, \`code\`, [links](https://example.com)
- Lists, tables, quotes and images all render
- Split a slide into columns with a \`===\` divider

---

## Two columns

Left side of the story goes here with a few supporting points.

===

Right side holds the contrast — perfect for before / after.

---

## Code, highlighted

\`\`\`ts
function greet(name: string): string {
  // syntax highlighting adapts to the slide theme
  const msg = \`Hello, \${name}!\`
  return msg.toUpperCase()
}

greet("world")
\`\`\`

---

## Tables & quotes

| Feature      | Included |
| ------------ | :------: |
| Themes       |    ✓     |
| Custom fonts |    ✓     |
| Presenter    |    ✓     |

> "The best way to predict the future is to invent it."

---

# Thank you

Pick a **theme**, choose your **fonts**, then hit **Present**. 🎉
`;
