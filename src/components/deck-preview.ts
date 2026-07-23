import { html } from "lit";
import { customElement } from "lit/decorators.js";

import { slideTag } from "@/components/slide-view";

import { deckSettings } from "@/derive";
import { icon } from "@/icons";
import { AppElement } from "@/lit-base";
import { parseDeck } from "@/markdown";
import { store } from "@/store";

/** Center stage: the current slide plus navigation and a thumbnail filmstrip. */
@customElement("deck-preview")
export class DeckPreview extends AppElement {
	private unsub?: () => void;

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
	}
	disconnectedCallback() {
		this.unsub?.();
		super.disconnectedCallback();
	}

	private go(to: number, total: number) {
		const next = Math.max(0, Math.min(total - 1, to));
		if (next !== store.state.current) store.set({ current: next });
	}

	render() {
		const slides = parseDeck(store.state.markdown);
		const total = slides.length;
		const current = Math.min(store.state.current, total - 1);
		const cfg = deckSettings();
		const slide = slides[current];

		return html`
			<div class="flex h-full min-w-0 flex-col bg-base-200/40">
				<!-- Stage -->
				<div class="relative grid min-h-0 flex-1 place-items-center p-4 sm:p-8">
					${slideTag(slide, cfg, {
						class: "w-full h-full",
						index: current,
						total,
						showNumber: cfg.showNumber,
						transition: cfg.transition,
					})}

					<!-- Prev / next arrows -->
					<button
						class="btn absolute top-1/2 left-3 btn-circle -translate-y-1/2 shadow-lg btn-sm sm:btn-md"
						?disabled=${current <= 0}
						@click=${() => this.go(current - 1, total)}
						aria-label="Previous slide"
					>
						${icon("icon-[heroicons--chevron-left]")}
					</button>
					<button
						class="btn absolute top-1/2 right-3 btn-circle -translate-y-1/2 shadow-lg btn-sm sm:btn-md"
						?disabled=${current >= total - 1}
						@click=${() => this.go(current + 1, total)}
						aria-label="Next slide"
					>
						${icon("icon-[heroicons--chevron-right]")}
					</button>
				</div>

				<!-- Filmstrip -->
				<div
					class="flex items-center gap-3 overflow-x-auto border-t border-base-300 bg-base-100/70 px-3 py-2"
				>
					<div class="px-1 font-mono text-xs whitespace-nowrap opacity-70">
						${current + 1} / ${total}
					</div>
					${slides.map(
						(s, i) => html`
							<button
								class="${i === current
									? "border-primary ring-2 ring-primary/30"
									: "border-base-300 hover:border-base-content/30"} relative shrink-0 overflow-hidden rounded-md border-2 transition"
								style="width:116px;height:${Math.round((116 * cfg.h) / cfg.w)}px"
								title=${s.title}
								@click=${() => this.go(i, total)}
							>
								${slideTag(s, cfg, {
									class: "pointer-events-none w-full h-full",
									fitWidth: true,
								})}
								<span
									class="absolute right-1 bottom-0.5 rounded bg-base-100/80 px-1 font-mono text-[10px] text-base-content"
									>${i + 1}</span
								>
							</button>
						`,
					)}
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"deck-preview": DeckPreview;
	}
}
