import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { AppElement } from "../lit-base";
import { store } from "../store";
import { parseDeck } from "../markdown";
import { deckSettings } from "../derive";
import { icon } from "../icons";
import { slideTag } from "./slide-view";

/** Center stage: the current slide plus navigation and a thumbnail filmstrip. */
@customElement("deck-preview")
export class DeckPreview extends AppElement {
	private unsub?: () => void;

	connectedCallback() {
		super.connectedCallback();
		this.unsub = store.subscribe(() => this.requestUpdate());
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
			<div class="flex flex-col h-full min-w-0 bg-base-200/40">
				<!-- Stage -->
				<div class="relative flex-1 min-h-0 grid place-items-center p-4 sm:p-8">
					${slideTag(slide, cfg, {
						class: "w-full h-full",
						index: current,
						total,
						showNumber: cfg.showNumber,
						transition: cfg.transition,
					})}

					<!-- Prev / next arrows -->
					<button
						class="btn btn-circle btn-sm sm:btn-md absolute left-3 top-1/2 -translate-y-1/2 shadow-lg"
						?disabled=${current <= 0}
						@click=${() => this.go(current - 1, total)}
						aria-label="Previous slide"
					>
						${icon("prev")}
					</button>
					<button
						class="btn btn-circle btn-sm sm:btn-md absolute right-3 top-1/2 -translate-y-1/2 shadow-lg"
						?disabled=${current >= total - 1}
						@click=${() => this.go(current + 1, total)}
						aria-label="Next slide"
					>
						${icon("next")}
					</button>
				</div>

				<!-- Filmstrip -->
				<div
					class="flex items-center gap-3 px-3 py-2 border-t border-base-300 bg-base-100/70 overflow-x-auto"
				>
					<div class="text-xs font-mono opacity-70 whitespace-nowrap px-1">
						${current + 1} / ${total}
					</div>
					${slides.map(
						(s, i) => html`
							<button
								class="relative shrink-0 rounded-md overflow-hidden border-2 transition
                  ${i === current
									? "border-primary ring-2 ring-primary/30"
									: "border-base-300 hover:border-base-content/30"}"
								style="width:116px;height:${Math.round((116 * cfg.h) / cfg.w)}px"
								title=${s.title}
								@click=${() => this.go(i, total)}
							>
								${slideTag(s, cfg, {
									class: "pointer-events-none w-full h-full",
									fitWidth: true,
								})}
								<span
									class="absolute bottom-0.5 right-1 text-[10px] font-mono px-1 rounded bg-base-100/80 text-base-content"
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
