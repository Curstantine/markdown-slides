import { Marked, type Tokens } from "marked";
import { highlightCodeBlock } from "@/highlighter";

const marked = new Marked();
marked.setOptions({ gfm: true, breaks: false });
marked.use({
	renderer: {
		code(token: Tokens.Code) {
			const lang = token.lang?.match(/\S+/)?.[0];
			return highlightCodeBlock(token.text, lang);
		},
	},
});

const SLIDE_SEP = /^\s*---\s*$/;
const COL_SEP = /^\s*===\s*$/;

/**
 * Split source into blocks on a separator that appears on its own line,
 * while ignoring separators that live inside fenced code blocks.
 */
function splitFenceAware(src: string, sep: RegExp): string[] {
	const lines = src.split(/\r?\n/);
	const parts: string[] = [];
	let cur: string[] = [];
	let inFence = false;
	for (const line of lines) {
		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
			cur.push(line);
			continue;
		}
		if (!inFence && sep.test(line)) {
			parts.push(cur.join("\n"));
			cur = [];
		} else {
			cur.push(line);
		}
	}
	parts.push(cur.join("\n"));
	return parts;
}

function renderMarkdown(src: string): string {
	return marked.parse(src) as string;
}

export interface Slide {
	/** Rendered HTML for the slide body. */
	html: string;
	/** Plain-text first heading / line, for the overview + speaker view. */
	title: string;
}

function firstTitle(src: string): string {
	for (const raw of src.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		const heading = line.match(/^#{1,6}\s+(.*)$/);
		if (heading) return heading[1].replace(/[*_`#]/g, "").trim();
		return line
			.replace(/[*_`#>-]/g, "")
			.trim()
			.slice(0, 60);
	}
	return "Untitled";
}

function renderSlideBody(src: string): string {
	const cols = splitFenceAware(src, COL_SEP)
		.map((c) => c.trim())
		.filter((c) => c.length > 0);

	if (cols.length <= 1) return renderMarkdown(src);

	const inner = cols.map((c) => `<div>${renderMarkdown(c)}</div>`).join("");
	return `<div class="cols" style="--col-count:${cols.length}">${inner}</div>`;
}

/** Parse a markdown document into slides. Always returns at least one slide. */
export function parseDeck(src: string): Slide[] {
	const blocks = splitFenceAware(src, SLIDE_SEP)
		.map((b) => b.trim())
		.filter((b) => b.length > 0);

	const slides = (blocks.length ? blocks : [""]).map((b) => ({
		html: renderSlideBody(b),
		title: firstTitle(b),
	}));

	return slides;
}
