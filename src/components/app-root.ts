import { html, nothing } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { AppElement } from "../lit-base";
import { store, type ColorMode } from "../store";
import { parseDeck } from "../markdown";
import { deckSettings } from "../derive";
import { SITE_DARK_THEME, SITE_LIGHT_THEME } from "../config";
import { icon, type IconName } from "../icons";
import "./md-editor";
import "./deck-preview";
import "./deck-overview";
import "./settings-panel";
import "./present-mode";
import { slideTag } from "./slide-view";

@customElement("app-root")
export class AppRoot extends AppElement {
	private unsub?: () => void;
	@state() private presenting = false;
	@state() private printing = false;
	@state() private dragging = false;
	@query("#file-input") private fileInput!: HTMLInputElement;

	connectedCallback() {
		super.connectedCallback();
		this.unsub = store.subscribe(() => this.requestUpdate());
		this.applyColorMode();
		this.mql.addEventListener("change", this.onSystemThemeChange);
		window.addEventListener("keydown", this.onKey);
	}

	disconnectedCallback() {
		this.unsub?.();
		this.mql.removeEventListener("change", this.onSystemThemeChange);
		window.removeEventListener("keydown", this.onKey);
		super.disconnectedCallback();
	}

	private mql = window.matchMedia("(prefers-color-scheme: dark)");
	private onSystemThemeChange = () => {
		// In system mode the OS just flipped light/dark — re-apply so the
		// explicit data-theme tracks it, and re-render the mode icon.
		if (store.state.colorMode === "system") {
			this.applyColorMode();
			this.requestUpdate();
		}
	};

	/**
	 * Map the site color mode onto a concrete daisyUI theme. We always set an
	 * explicit data-theme (even for "system") so selection never falls through
	 * to the CSS `:root` default — the bug where a `--prefersdark`-only theme
	 * isn't selectable by name. The theme names come from config so they stay in
	 * sync with the `@plugin "daisyui"` list.
	 */
	private applyColorMode() {
		const mode = store.state.colorMode;
		const dark = mode === "dark" || (mode === "system" && this.mql.matches);
		document.documentElement.setAttribute(
			"data-theme",
			dark ? SITE_DARK_THEME : SITE_LIGHT_THEME,
		);
	}

	private setColorMode(mode: ColorMode) {
		store.set({ colorMode: mode });
		this.applyColorMode();
	}

	/* ---------------------------- navigation ---------------------------- */
	private get total() {
		return parseDeck(store.state.markdown).length;
	}
	private nav(delta: number) {
		const next = Math.max(0, Math.min(this.total - 1, store.state.current + delta));
		store.set({ current: next });
	}

	private onKey = (e: KeyboardEvent) => {
		if (this.presenting) return;
		const el = e.target as HTMLElement;
		const typing = /^(TEXTAREA|INPUT|SELECT)$/.test(el?.tagName ?? "");

		if ((e.key === "F5" || e.key === "p" || e.key === "P") && !typing) {
			e.preventDefault();
			this.startPresenting();
			return;
		}
		if (typing) return;
		if (e.key === "ArrowRight" || e.key === "ArrowDown") {
			e.preventDefault();
			this.nav(1);
		} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
			e.preventDefault();
			this.nav(-1);
		} else if (e.key === "Home") {
			store.set({ current: 0 });
		} else if (e.key === "End") {
			store.set({ current: this.total - 1 });
		}
	};

	/* ---------------------------- presenting ---------------------------- */
	private startPresenting() {
		this.presenting = true;
		document.documentElement.requestFullscreen?.().catch(() => {});
	}

	/* ------------------------------ files ------------------------------- */
	private async onFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) await this.loadFile(file);
		input.value = "";
	}

	private async loadFile(file: File) {
		const text = await file.text();
		store.set({ markdown: text, current: 0, view: "edit" });
	}

	private onDrop = async (e: DragEvent) => {
		e.preventDefault();
		this.dragging = false;
		const file = [...(e.dataTransfer?.files ?? [])].find((f) =>
			/\.(md|markdown|txt|mdown)$/i.test(f.name),
		);
		if (file) await this.loadFile(file);
	};

	private downloadMarkdown() {
		const blob = new Blob([store.state.markdown], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "slides.md";
		a.click();
		URL.revokeObjectURL(url);
	}

	private exportPdf() {
		this.printing = true;
		this.updateComplete.then(() => {
			// let fonts/layout settle, then open the print dialog
			setTimeout(() => {
				window.print();
				this.printing = false;
			}, 250);
		});
	}

	/* ------------------------------ render ------------------------------ */
	private iconBtn(ic: IconName, label: string, fn: () => void, extra = "", active = false) {
		return html`
			<button
				class="btn btn-ghost btn-sm btn-square ${active ? "btn-active" : ""} ${extra}"
				title=${label}
				aria-label=${label}
				@click=${fn}
			>
				${icon(ic)}
			</button>
		`;
	}

	private colorModeMenu() {
		const mode = store.state.colorMode;
		const activeIc: IconName = mode === "light" ? "sun" : mode === "dark" ? "moon" : "desktop";
		const opt = (m: ColorMode, ic: IconName, label: string) => html`
			<li>
				<a class=${mode === m ? "active" : ""} @click=${() => this.setColorMode(m)}>
					${icon(ic, "sm")} ${label}
				</a>
			</li>
		`;
		return html`
			<div class="dropdown dropdown-end">
				<div
					tabindex="0"
					role="button"
					class="btn btn-ghost btn-sm btn-square"
					title="Color mode"
				>
					${icon(activeIc)}
				</div>
				<ul
					tabindex="0"
					class="dropdown-content menu bg-base-100 rounded-box z-50 w-44 p-2 shadow-lg border border-base-300 mt-1"
				>
					${opt("light", "sun", "Light")} ${opt("dark", "moon", "Dark")}
					${opt("system", "desktop", "System")}
				</ul>
			</div>
		`;
	}

	private navbar() {
		const s = store.state;
		return html`
			<div
				class="navbar min-h-0 h-14 px-2 sm:px-4 bg-base-100 border-b border-base-300 gap-1 no-print"
			>
				<!-- Brand -->
				<div class="flex items-center gap-2 mr-2">
					${icon("present", "lg", "text-primary")}
					<span class="font-bold text-base hidden sm:inline">Markdown Slides</span>
				</div>

				<!-- View switch -->
				<div class="join">
					<button
						class="btn btn-sm join-item gap-1 ${s.view === "edit"
							? "btn-primary"
							: "btn-ghost"}"
						@click=${() => store.set({ view: "edit" })}
					>
						${icon("eye", "sm")}<span class="hidden md:inline">Slides</span>
					</button>
					<button
						class="btn btn-sm join-item gap-1 ${s.view === "overview"
							? "btn-primary"
							: "btn-ghost"}"
						@click=${() => store.set({ view: "overview" })}
					>
						${icon("grid", "sm")}<span class="hidden md:inline">Overview</span>
					</button>
				</div>

				${s.view === "edit"
					? this.iconBtn(
							s.showEditor ? "eyeSlash" : "code",
							s.showEditor ? "Hide editor" : "Show editor",
							() => store.set({ showEditor: !s.showEditor }),
							"ml-1",
							s.showEditor,
						)
					: nothing}

				<div class="flex-1"></div>

				<!-- File actions -->
				${this.iconBtn("upload", "Open .md file", () => this.fileInput.click())}
				<div class="dropdown dropdown-end">
					<div
						tabindex="0"
						role="button"
						class="btn btn-ghost btn-sm btn-square"
						title="Export"
					>
						${icon("download")}
					</div>
					<ul
						tabindex="0"
						class="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300 mt-1"
					>
						<li>
							<a @click=${() => this.downloadMarkdown()}
								>${icon("doc", "sm")} Download .md</a
							>
						</li>
						<li>
							<a @click=${() => this.exportPdf()}
								>${icon("present", "sm")} Export PDF…</a
							>
						</li>
					</ul>
				</div>

				${this.colorModeMenu()}

				<button
					class="btn btn-primary btn-sm gap-1 ml-1"
					@click=${() => this.startPresenting()}
					title="Present (P)"
				>
					${icon("play", "sm")}<span class="hidden sm:inline">Present</span>
				</button>

				<label
					for="settings-drawer"
					class="btn btn-ghost btn-sm btn-square"
					title="Slide design"
					aria-label="Slide design"
				>
					${icon("cog")}
				</label>
			</div>
		`;
	}

	private mainContent() {
		const s = store.state;
		if (s.view === "overview") return html`<deck-overview></deck-overview>`;
		return html`
			<div class="flex flex-col lg:flex-row h-full min-h-0">
				${s.showEditor
					? html`<md-editor
							class="lg:w-[42%] h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-base-300 min-h-0"
						></md-editor>`
					: nothing}
				<deck-preview class="flex-1 min-w-0 min-h-0"></deck-preview>
			</div>
		`;
	}

	private printRoot() {
		if (!this.printing) return nothing;
		const slides = parseDeck(store.state.markdown);
		const cfg = deckSettings();
		return html`
			<div class="print-root hidden fixed inset-0 z-100 bg-white">
				${slides.map(
					(slide) => html`
						<div class="print-slide" style="width:${cfg.w}px;height:${cfg.h}px">
							${slideTag(slide, cfg, { class: "w-full h-full" })}
						</div>
					`,
				)}
			</div>
		`;
	}

	render() {
		return html`
			<div
				class="drawer drawer-end no-print"
				@dragover=${(e: DragEvent) => {
					e.preventDefault();
					this.dragging = true;
				}}
				@dragleave=${(e: DragEvent) => {
					if (e.relatedTarget === null) this.dragging = false;
				}}
				@drop=${this.onDrop}
			>
				<input id="settings-drawer" type="checkbox" class="drawer-toggle" />

				<div class="drawer-content flex flex-col h-screen overflow-hidden">
					${this.navbar()}
					<main class="flex-1 min-h-0">${this.mainContent()}</main>
				</div>

				<div class="drawer-side z-70 no-print">
					<label
						for="settings-drawer"
						class="drawer-overlay"
						aria-label="Close settings"
					></label>
					<settings-panel></settings-panel>
				</div>
			</div>

			<input
				id="file-input"
				type="file"
				accept=".md,.markdown,.txt,.mdown,text/markdown,text/plain"
				class="hidden"
				@change=${this.onFile}
			/>

			${this.dragging
				? html`<div
						class="fixed inset-0 z-80 bg-primary/20 backdrop-blur-sm grid place-items-center pointer-events-none no-print"
					>
						<div
							class="rounded-2xl border-4 border-dashed border-primary bg-base-100/90 px-10 py-8 text-center shadow-2xl"
						>
							<div class="text-primary flex justify-center mb-2">
								${icon("upload", "lg")}
							</div>
							<p class="font-semibold text-lg">Drop a Markdown file to open</p>
						</div>
					</div>`
				: nothing}
			${this.presenting
				? html`<present-mode @exit=${() => (this.presenting = false)}></present-mode>`
				: nothing}
			${this.printRoot()}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
	}
}
