import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import markdownLang from "@shikijs/langs/markdown";
import githubLight from "@shikijs/themes/github-light";
import githubDark from "@shikijs/themes/github-dark";
import { findSlideTheme } from "./config";
import { store } from "./store";

/**
 * Single Shiki highlighter shared by both surfaces:
 *   - the editor (Markdown source in the left pane), and
 *   - fenced code blocks rendered inside the slides.
 *
 * Built on the fine-grained `shiki/core` API with the JavaScript RegExp engine
 * (no Oniguruma WASM). The Markdown grammar and two themes ship in the main
 * bundle; every other language grammar is a lazy chunk loaded on demand the
 * first time a slide uses it, so the initial download stays small.
 */

export const THEME_LIGHT = "github-light";
export const THEME_DARK = "github-dark";

/** Languages we support in slide code blocks — each loaded on first use. */
const LANGS: Record<string, () => Promise<unknown>> = {
	javascript: () => import("@shikijs/langs/javascript"),
	typescript: () => import("@shikijs/langs/typescript"),
	jsx: () => import("@shikijs/langs/jsx"),
	tsx: () => import("@shikijs/langs/tsx"),
	python: () => import("@shikijs/langs/python"),
	bash: () => import("@shikijs/langs/bash"),
	json: () => import("@shikijs/langs/json"),
	yaml: () => import("@shikijs/langs/yaml"),
	html: () => import("@shikijs/langs/html"),
	css: () => import("@shikijs/langs/css"),
	scss: () => import("@shikijs/langs/scss"),
	sql: () => import("@shikijs/langs/sql"),
	rust: () => import("@shikijs/langs/rust"),
	go: () => import("@shikijs/langs/go"),
	java: () => import("@shikijs/langs/java"),
	c: () => import("@shikijs/langs/c"),
	cpp: () => import("@shikijs/langs/cpp"),
	csharp: () => import("@shikijs/langs/csharp"),
	php: () => import("@shikijs/langs/php"),
	ruby: () => import("@shikijs/langs/ruby"),
	diff: () => import("@shikijs/langs/diff"),
	docker: () => import("@shikijs/langs/docker"),
	graphql: () => import("@shikijs/langs/graphql"),
	kotlin: () => import("@shikijs/langs/kotlin"),
	swift: () => import("@shikijs/langs/swift"),
	toml: () => import("@shikijs/langs/toml"),
	lua: () => import("@shikijs/langs/lua"),
	xml: () => import("@shikijs/langs/xml"),
};

/** Common language aliases → canonical id above. */
const ALIAS: Record<string, string> = {
	js: "javascript",
	ts: "typescript",
	py: "python",
	sh: "bash",
	shell: "bash",
	zsh: "bash",
	yml: "yaml",
	rs: "rust",
	"c++": "cpp",
	cs: "csharp",
	"c#": "csharp",
	rb: "ruby",
	dockerfile: "docker",
	kt: "kotlin",
	htm: "html",
};

let hl: HighlighterCore | null = null;
let initPromise: Promise<HighlighterCore> | null = null;
const loading = new Set<string>();

/** Nudge every store subscriber to re-render (used when async grammars load). */
function notify() {
	store.touch();
}

function init(): Promise<HighlighterCore> {
	if (!initPromise) {
		initPromise = createHighlighterCore({
			themes: [githubLight, githubDark],
			// markdown for the editor; embeddedLangs stripped so it pulls nothing else.
			langs: [{ ...markdownLang[0], embeddedLangs: [] }],
			engine: createJavaScriptRegexEngine({ forgiving: true }),
		}).then((h) => {
			hl = h;
			notify();
			return h;
		});
	}
	return initPromise;
}
init();

/** Resolve an info-string to a supported canonical language id, or null. */
function resolveLang(lang: string | undefined): string | null {
	if (!lang) return null;
	const key = lang.toLowerCase();
	if (key === "markdown" || key === "md") return "markdown";
	const name = ALIAS[key] ?? key;
	return LANGS[name] ? name : null;
}

/** Lazily register a language grammar, then re-render once it's available. */
function ensureLang(name: string) {
	if (!hl || loading.has(name) || hl.getLoadedLanguages().includes(name)) return;
	loading.add(name);
	LANGS[name]()
		.then((mod) => hl!.loadLanguage((mod as { default: never }).default))
		.then(() => {
			loading.delete(name);
			notify();
		})
		.catch(() => loading.delete(name));
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainPre(code: string): string {
	return `<pre class="shiki shiki-plain"><code>${escapeHtml(code)}</code></pre>`;
}

function slideIsDark(): boolean {
	const [bg] = findSlideTheme(store.state.slideTheme).swatch;
	const c = bg.replace("#", "");
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/**
 * Highlight a fenced code block for the slides (synchronous — marked needs it).
 * Falls back to escaped plain text until the grammar has loaded.
 */
export function highlightCodeBlock(code: string, lang: string | undefined): string {
	const name = resolveLang(lang);
	const theme = slideIsDark() ? THEME_DARK : THEME_LIGHT;
	if (hl && name && hl.getLoadedLanguages().includes(name)) {
		return hl.codeToHtml(code, { lang: name, theme });
	}
	if (name) ensureLang(name);
	return plainPre(code);
}

/** Highlight Markdown source for the editor overlay (async is fine there). */
export async function highlightMarkdown(code: string, dark: boolean): Promise<string> {
	const h = await init();
	return h.codeToHtml(code, {
		lang: "markdown",
		theme: dark ? THEME_DARK : THEME_LIGHT,
	});
}
