import clsx from "clsx";
import { html, type TemplateResult } from "lit";

export type IconName = `icon-[${string}]`;

/** Render an Iconify icon class with a consistent size and flex behaviour. */
export function icon(
	name: IconName,
	size: "sm" | "md" | "lg" = "md",
	cls?: string,
): TemplateResult {
	return html`<span
		class=${clsx(
			cls,
			name,
			size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5",
			"shrink-0",
		)}
		aria-hidden="true"
	></span>`;
}
