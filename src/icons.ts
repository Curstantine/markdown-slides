import clsx from "clsx";
import { html, type TemplateResult } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

// Raw Heroicons (outline, 24px). currentColor-based, so they inherit text color.
import arrowUpTray from "heroicons/24/outline/arrow-up-tray.svg?raw";
import arrowDownTray from "heroicons/24/outline/arrow-down-tray.svg?raw";
import play from "heroicons/24/outline/play.svg?raw";
import chevronLeft from "heroicons/24/outline/chevron-left.svg?raw";
import chevronRight from "heroicons/24/outline/chevron-right.svg?raw";
import squares from "heroicons/24/outline/squares-2x2.svg?raw";
import codeBracket from "heroicons/24/outline/code-bracket.svg?raw";
import eye from "heroicons/24/outline/eye.svg?raw";
import eyeSlash from "heroicons/24/outline/eye-slash.svg?raw";
import sun from "heroicons/24/outline/sun.svg?raw";
import moon from "heroicons/24/outline/moon.svg?raw";
import desktop from "heroicons/24/outline/computer-desktop.svg?raw";
import swatch from "heroicons/24/outline/swatch.svg?raw";
import cog from "heroicons/24/outline/cog-6-tooth.svg?raw";
import xMark from "heroicons/24/outline/x-mark.svg?raw";
import expand from "heroicons/24/outline/arrows-pointing-out.svg?raw";
import contract from "heroicons/24/outline/arrows-pointing-in.svg?raw";
import documentText from "heroicons/24/outline/document-text.svg?raw";
import documentPlus from "heroicons/24/outline/document-plus.svg?raw";
import trash from "heroicons/24/outline/trash.svg?raw";
import adjustments from "heroicons/24/outline/adjustments-horizontal.svg?raw";
import sparkles from "heroicons/24/outline/sparkles.svg?raw";
import plus from "heroicons/24/outline/plus.svg?raw";
import present from "heroicons/24/outline/presentation-chart-bar.svg?raw";
import paintBrush from "heroicons/24/outline/paint-brush.svg?raw";

export const ICONS = {
	upload: arrowUpTray,
	download: arrowDownTray,
	play,
	prev: chevronLeft,
	next: chevronRight,
	grid: squares,
	code: codeBracket,
	eye,
	eyeSlash,
	sun,
	moon,
	desktop,
	swatch,
	cog,
	close: xMark,
	expand,
	contract,
	doc: documentText,
	docNew: documentPlus,
	trash,
	adjustments,
	sparkles,
	plus,
	present,
	paintBrush,
} as const;

export type IconName = keyof typeof ICONS;

/** Render a Heroicon inline. `size` maps to the .hi / .hi-sm / .hi-lg boxes. */
export function icon(name: IconName, size: "sm" | "md" | "lg" = "md", cls?: string): TemplateResult {
	return html`<span class=${clsx(cls, size === "sm" ? "hi hi-sm" : size === "lg" ? "hi hi-lg" : "hi")} aria-hidden="true">${unsafeSVG(ICONS[name])}</span>`;
}
