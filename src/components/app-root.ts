import { html, nothing } from "lit";
import { customElement, state, query } from "lit/decorators.js";

import { slideTag } from "@/components/slide-view";

import { SOURCE_URL, SITE_DARK_THEME, SITE_LIGHT_THEME } from "@/config";
import { deckSettings } from "@/derive";
import { icon, type IconName } from "@/icons";
import { AppElement } from "@/lit-base";
import { parseDeck } from "@/markdown";
import "@/components/md-editor";
import "@/components/deck-preview";
import "@/components/deck-overview";
import "@/components/settings-panel";
import "@/components/present-mode";

import { store, type ColorMode } from "@/store";

@customElement("app-root")
export class AppRoot extends AppElement {
	private unsub?: () => void;
	@state() private presenting = false;
	@state() private printing = false;
	@state() private dragging = false;
	@query("#file-input") private fileInput!: HTMLInputElement;

	connectedCallback() {
		super.connectedCallback();
		this.unsub = store.subscribe(
			[
				"markdown",
				"colorMode",
				"showEditor",
				"view",
				"slideTheme",
				"bodyFont",
				"codeFont",
				"fontScale",
				"aspect",
				"transition",
				"showPageNumbers",
			],
			() => this.requestUpdate(),
		);
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
		const blob = new Blob([store.state.markdown], {
			type: "text/markdown",
		});
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
				class="${active ? "btn-active" : ""} ${extra} btn btn-square btn-ghost btn-sm"
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
		const activeIc: IconName =
			mode === "light"
				? "icon-[heroicons--sun]"
				: mode === "dark"
					? "icon-[heroicons--moon]"
					: "icon-[heroicons--computer-desktop]";
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
					class="btn btn-square btn-ghost btn-sm"
					title="Color mode"
				>
					${icon(activeIc)}
				</div>
				<ul
					tabindex="0"
					class="dropdown-content menu z-50 mt-1 w-44 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
				>
					${opt("light", "icon-[heroicons--sun]", "Light")}
					${opt("dark", "icon-[heroicons--moon]", "Dark")}
					${opt("system", "icon-[heroicons--computer-desktop]", "System")}
				</ul>
			</div>
		`;
	}

	private navbar() {
		const s = store.state;
		return html`
			<div
				class="no-print navbar h-14 min-h-0 gap-1 border-b border-base-300 bg-base-100 px-2 sm:px-4"
			>
				<!-- Brand -->
				<span class="mr-2 flex items-center gap-2 font-bold">Markdown Slides</span>

				<!-- View switch -->
				<div class="join">
					<button
						class="${s.view === "edit"
							? "btn-primary"
							: "btn-ghost"} btn join-item gap-1 btn-sm"
						@click=${() => store.set({ view: "edit" })}
					>
						${icon("icon-[heroicons--eye]", "sm")}<span class="hidden md:inline"
							>Slides</span
						>
					</button>
					<button
						class="${s.view === "overview"
							? "btn-primary"
							: "btn-ghost"} btn join-item gap-1 btn-sm"
						@click=${() => store.set({ view: "overview" })}
					>
						${icon("icon-[heroicons--squares-2x2]", "sm")}<span class="hidden md:inline"
							>Overview</span
						>
					</button>
				</div>

				${s.view === "edit"
					? this.iconBtn(
							s.showEditor
								? "icon-[heroicons--eye-slash]"
								: "icon-[heroicons--code-bracket]",
							s.showEditor ? "Hide editor" : "Show editor",
							() => store.set({ showEditor: !s.showEditor }),
							"ml-1",
							s.showEditor,
						)
					: nothing}

				<div class="flex-1"></div>

				<a
					href=${SOURCE_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="btn gap-1 btn-ghost btn-sm"
					title="View on GitHub"
					aria-label="View Markdown Slides on GitHub"
				>
					${icon("icon-[heroicons--code-bracket]", "sm")}
					<span class="hidden sm:inline">Source</span>
				</a>

				<!-- File actions -->
				${this.iconBtn("icon-[heroicons--arrow-up-tray]", "Open .md file", () =>
					this.fileInput.click(),
				)}
				<div class="dropdown dropdown-end">
					<div
						tabindex="0"
						role="button"
						class="btn btn-square btn-ghost btn-sm"
						title="Export"
					>
						${icon("icon-[heroicons--arrow-down-tray]")}
					</div>
					<ul
						tabindex="0"
						class="dropdown-content menu z-50 mt-1 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
					>
						<li>
							<a @click=${() => this.downloadMarkdown()}>
								${icon("icon-[heroicons--document-text]", "sm")} Download .md
							</a>
						</li>
						<li>
							<a @click=${() => this.exportPdf()}>
								${icon("icon-[heroicons--presentation-chart-bar]", "sm")} Export PDF
							</a>
						</li>
					</ul>
				</div>

				${this.colorModeMenu()}

				<button
					class="btn mx-1 gap-1 btn-primary btn-sm"
					@click=${() => this.startPresenting()}
					title="Present (P)"
				>
					${icon("icon-[heroicons--play]", "sm")}<span class="hidden sm:inline"
						>Present</span
					>
				</button>

				<label
					for="settings-drawer"
					class="btn btn-square btn-ghost btn-sm"
					title="Slide design"
					aria-label="Slide design"
				>
					${icon("icon-[heroicons--cog-6-tooth]")}
				</label>
			</div>
		`;
	}

	private mainContent() {
		const s = store.state;
		if (s.view === "overview") return html`<deck-overview></deck-overview>`;
		return html`
			<div class="flex h-full min-h-0 flex-col lg:flex-row">
				${s.showEditor
					? html`<md-editor
							class="h-1/2 min-h-0 border-b border-base-300 lg:h-full lg:w-[42%] lg:border-r lg:border-b-0"
						/>`
					: nothing}
				<deck-preview class="min-h-0 min-w-0 flex-1"></deck-preview>
			</div>
		`;
	}

	private printRoot() {
		if (!this.printing) return nothing;
		const slides = parseDeck(store.state.markdown);
		const cfg = deckSettings();
		return html`
			<div class="print-root fixed inset-0 z-100 hidden bg-white">
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
				class="no-print drawer drawer-end"
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

				<div class="drawer-content flex h-screen flex-col overflow-hidden">
					${this.navbar()}
					<main class="min-h-0 flex-1">${this.mainContent()}</main>
				</div>

				<div class="no-print drawer-side z-70">
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
						class="no-print pointer-events-none fixed inset-0 z-80 grid place-items-center bg-primary/20 backdrop-blur-sm"
					>
						<div
							class="rounded-2xl border-4 border-dashed border-primary bg-base-100/90 px-10 py-8 text-center shadow-2xl"
						>
							<div class="mb-2 flex justify-center text-primary">
								${icon("icon-[heroicons--arrow-up-tray]", "lg")}
							</div>
							<p class="text-lg font-semibold">Drop a Markdown file to open</p>
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
