import { html } from "lit";
import { customElement, state } from "lit/decorators.js";

import { slideTag } from "@/components/slide-view";

import { deckSettings } from "@/derive";
import { icon } from "@/icons";
import { AppElement } from "@/lit-base";
import { parseDeck } from "@/markdown";
import { store } from "@/store";

/**
 * Fullscreen presentation overlay. Owns keyboard navigation while open and
 * auto-hides its control bar when the pointer is idle. Emits `exit` to close.
 */
@customElement("present-mode")
export class PresentMode extends AppElement {
	private unsub?: () => void;
	@state() private controlsVisible = true;
	@state() private isFullscreen = false;
	private idleTimer?: number;

	connectedCallback() {
		super.connectedCallback();
		this.unsub = store.subscribe(
			[
				"markdown",
				"current",
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
		window.addEventListener("keydown", this.onKey, { capture: true });
		document.addEventListener("fullscreenchange", this.onFsChange);
		this.armIdle();
	}

	disconnectedCallback() {
		this.unsub?.();
		window.removeEventListener("keydown", this.onKey, { capture: true });
		document.removeEventListener("fullscreenchange", this.onFsChange);
		clearTimeout(this.idleTimer);
		super.disconnectedCallback();
	}

	private get total() {
		return parseDeck(store.state.markdown).length;
	}

	private go(delta: number) {
		const total = this.total;
		const next = Math.max(0, Math.min(total - 1, store.state.current + delta));
		if (next !== store.state.current) store.set({ current: next });
	}

	private onFsChange = () => {
		this.isFullscreen = !!document.fullscreenElement;
	};

	private onKey = (e: KeyboardEvent) => {
		switch (e.key) {
			case "ArrowRight":
			case "ArrowDown":
			case "PageDown":
			case " ":
				e.preventDefault();
				this.go(1);
				break;
			case "ArrowLeft":
			case "ArrowUp":
			case "PageUp":
				e.preventDefault();
				this.go(-1);
				break;
			case "Home":
				e.preventDefault();
				store.set({ current: 0 });
				break;
			case "End":
				e.preventDefault();
				store.set({ current: this.total - 1 });
				break;
			case "f":
			case "F":
				this.toggleFullscreen();
				break;
			case "Escape":
				if (!document.fullscreenElement) this.exit();
				break;
		}
		this.wake();
	};

	private async toggleFullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await document.documentElement.requestFullscreen();
		} catch {
			/* fullscreen may be blocked; ignore */
		}
	}

	private exit() {
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
		this.dispatchEvent(new CustomEvent("exit", { bubbles: true, composed: true }));
	}

	private armIdle() {
		clearTimeout(this.idleTimer);
		this.idleTimer = window.setTimeout(() => (this.controlsVisible = false), 2600);
	}
	private wake = () => {
		this.controlsVisible = true;
		this.armIdle();
	};

	render() {
		const slides = parseDeck(store.state.markdown);
		const total = slides.length;
		const current = Math.min(store.state.current, total - 1);
		const cfg = deckSettings();

		return html`
			<div
				class="present-stage ${this.controlsVisible ? "" : "cursor-none"}"
				@mousemove=${this.wake}
				@click=${() => this.go(1)}
			>
				${slideTag(slides[current], cfg, {
					class: "w-screen h-screen",
					index: current,
					total,
					showNumber: cfg.showNumber,
					transition: cfg.transition,
				})}

				<!-- Progress bar -->
				<div class="fixed top-0 left-0 right-0 h-1 bg-white/10">
					<div
						class="h-full bg-white/70 transition-all"
						style="width:${total > 1 ? (current / (total - 1)) * 100 : 100}%"
					></div>
				</div>

				<!-- Controls -->
				<div
					class="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2 py-1.5 text-white shadow-2xl transition-opacity duration-300 ${this
						.controlsVisible
						? "opacity-100"
						: "opacity-0 pointer-events-none"}"
					@click=${(e: Event) => e.stopPropagation()}
				>
					<button
						class="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15"
						?disabled=${current <= 0}
						@click=${() => this.go(-1)}
						aria-label="Previous"
					>
						${icon("prev")}
					</button>
					<span class="text-sm font-mono tabular-nums px-2 select-none"
						>${current + 1} / ${total}</span
					>
					<button
						class="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15"
						?disabled=${current >= total - 1}
						@click=${() => this.go(1)}
						aria-label="Next"
					>
						${icon("next")}
					</button>
					<div class="w-px h-5 bg-white/20 mx-1"></div>
					<button
						class="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15"
						@click=${() => this.toggleFullscreen()}
						aria-label="Toggle fullscreen"
					>
						${icon(this.isFullscreen ? "contract" : "expand")}
					</button>
					<button
						class="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15"
						@click=${() => this.exit()}
						aria-label="Exit presentation"
					>
						${icon("close")}
					</button>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"present-mode": PresentMode;
	}
}
