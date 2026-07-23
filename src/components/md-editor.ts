import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { SAMPLE_MARKDOWN } from "@/config";
import { highlightMarkdown } from "@/highlighter";
import { icon } from "@/icons";
import { AppElement } from "@/lit-base";
import { parseDeck } from "@/markdown";
import { store } from "@/store";

/**
 * Left-hand Markdown source editor. A transparent <textarea> sits exactly over
 * a Shiki-highlighted <pre>, giving live syntax highlighting while keeping full
 * native text-editing behaviour.
 */
@customElement("md-editor")
export class MdEditor extends AppElement {
	@query("textarea") private textarea!: HTMLTextAreaElement;
	@query(".editor-hl") private overlay?: HTMLElement;
	@state() private hlHtml = "";

	private unsub?: () => void;
	private mql = window.matchMedia("(prefers-color-scheme: dark)");
	private hlTimer?: number;
	private hlToken = 0;
	private cachedCode: string | null = null;
	private cachedDark: boolean | null = null;

	connectedCallback() {
		super.connectedCallback();
		this.unsub = store.subscribe(["markdown", "colorMode"], () => this.requestUpdate());
		this.mql.addEventListener("change", this.onSystemThemeChange);
	}
	disconnectedCallback() {
		this.unsub?.();
		this.mql.removeEventListener("change", this.onSystemThemeChange);
		clearTimeout(this.hlTimer);
		super.disconnectedCallback();
	}

	private onSystemThemeChange = () => {
		if (store.state.colorMode === "system") this.scheduleHighlight();
	};

	private isDark(): boolean {
		const m = store.state.colorMode;
		if (m === "dark") return true;
		if (m === "light") return false;
		return this.mql.matches;
	}

	protected updated() {
		// Re-highlight whenever the source or the effective color scheme changes.
		if (store.state.markdown !== this.cachedCode || this.isDark() !== this.cachedDark)
			this.scheduleHighlight();
	}

	private scheduleHighlight() {
		clearTimeout(this.hlTimer);
		this.hlTimer = window.setTimeout(() => void this.runHighlight(), 80);
	}

	private async runHighlight() {
		const code = store.state.markdown;
		const dark = this.isDark();
		this.cachedCode = code;
		this.cachedDark = dark;
		if (!code.trim()) {
			this.hlHtml = "";
			return;
		}
		const token = ++this.hlToken;
		try {
			const out = await highlightMarkdown(code, dark);
			if (token === this.hlToken) {
				this.hlHtml = out;
				this.updateComplete.then(() => this.syncScroll());
			}
		} catch {
			this.hlHtml = "";
		}
	}

	private syncScroll = () => {
		if (this.overlay && this.textarea) {
			this.overlay.scrollTop = this.textarea.scrollTop;
			this.overlay.scrollLeft = this.textarea.scrollLeft;
		}
	};

	private onInput(e: Event) {
		store.set({ markdown: (e.target as HTMLTextAreaElement).value });
	}

	private onKeydown(e: KeyboardEvent) {
		if (e.key === "Tab") {
			e.preventDefault();
			this.insert("  ", "");
		}
	}

	/** Wrap the current selection with before/after (or insert at caret). */
	private insert(before: string, after: string) {
		const ta = this.textarea;
		const { selectionStart: s, selectionEnd: en, value } = ta;
		const sel = value.slice(s, en);
		const next = value.slice(0, s) + before + sel + after + value.slice(en);
		store.set({ markdown: next });
		this.updateComplete.then(() => {
			ta.focus();
			const caret = s + before.length + sel.length;
			ta.setSelectionRange(caret, caret);
		});
	}

	private insertBlock(text: string) {
		const ta = this.textarea;
		const { selectionStart: s, value } = ta;
		const needsNlBefore = s > 0 && value[s - 1] !== "\n";
		this.insert((needsNlBefore ? "\n" : "") + text, "");
	}

	private loadSample() {
		store.set({ markdown: SAMPLE_MARKDOWN, current: 0 });
	}

	private clear() {
		store.set({ markdown: "", current: 0 });
		this.updateComplete.then(() => this.textarea?.focus());
	}

	render() {
		const md = store.state.markdown;
		const slides = parseDeck(md).length;
		const words = md.trim() ? md.trim().split(/\s+/).length : 0;

		const tool = (label: string, ic: Parameters<typeof icon>[0], fn: () => void) => html`
			<button
				class="btn btn-ghost btn-xs gap-1"
				title=${label}
				aria-label=${label}
				@click=${fn}
			>
				${icon(ic, "sm")}
			</button>
		`;

		return html`
			<div class="flex flex-col h-full bg-base-100">
				<div
					class="flex items-center gap-1 px-2 py-1.5 border-b border-base-300 bg-base-200/60 flex-wrap"
				>
					<span class="text-xs font-semibold px-2 opacity-70 flex items-center gap-1">
						${icon("code", "sm")} Markdown
					</span>
					<div class="flex-1"></div>
					${tool("Bold", "sparkles", () => this.insert("**", "**"))}
					${tool("Slide break", "plus", () => this.insertBlock("\n---\n\n"))}
					${tool("Two columns", "grid", () =>
						this.insertBlock("\nLeft\n\n===\n\nRight\n"),
					)}
					${tool("Code block", "code", () => this.insertBlock("\n```ts\n\n```\n"))}
					<div class="w-px h-4 bg-base-300 mx-1"></div>
					${tool("Load sample", "docNew", () => this.loadSample())}
					${tool("Clear", "trash", () => this.clear())}
				</div>

				<div class="editor-canvas flex-1 min-h-0">
					<div class="editor-hl" aria-hidden="true">${unsafeHTML(this.hlHtml)}</div>
					<textarea
						class="editor-ta ${this.hlHtml ? "" : "plain"}"
						spellcheck="false"
						autocapitalize="off"
						autocomplete="off"
						placeholder="# Start typing your slides…"
						.value=${md}
						@input=${this.onInput}
						@keydown=${this.onKeydown}
						@scroll=${this.syncScroll}
					></textarea>
				</div>

				<div
					class="flex items-center gap-4 px-3 py-1.5 border-t border-base-300 bg-base-200/60 text-xs opacity-70"
				>
					<span>${slides} slide${slides === 1 ? "" : "s"}</span>
					<span>${words} words</span>
					<span>${md.length} chars</span>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"md-editor": MdEditor;
	}
}
