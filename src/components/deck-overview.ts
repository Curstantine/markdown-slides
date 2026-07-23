import { html } from "lit";
import { customElement } from "lit/decorators.js";

import { slideTag } from "@/components/slide-view";

import { deckSettings } from "@/derive";
import { AppElement } from "@/lit-base";
import { parseDeck } from "@/markdown";
import { store } from "@/store";

/** Grid of every slide; clicking one jumps to it in the editor/preview view. */
@customElement("deck-overview")
export class DeckOverview extends AppElement {
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

	private pick(i: number) {
		store.set({ current: i, view: "edit" });
	}

	render() {
		const slides = parseDeck(store.state.markdown);
		const cfg = deckSettings();
		const current = Math.min(store.state.current, slides.length - 1);

		return html`
			<div class="h-full overflow-y-auto bg-base-200/40 p-6">
				<div
					class="grid gap-6"
					style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))"
				>
					${slides.map(
						(s, i) => html`
							<button
								class="group ${i === current
									? "border-primary"
									: "border-base-300"} overflow-hidden rounded-xl border-2 bg-base-100 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
								@click=${() => this.pick(i)}
							>
								<div class="relative w-full" style="aspect-ratio:${cfg.w}/${cfg.h}">
									${slideTag(s, cfg, {
										class: "pointer-events-none absolute inset-0",
										fitWidth: true,
									})}
								</div>
								<div
									class="flex items-center gap-2 border-t border-base-300 px-3 py-2"
								>
									<span
										class="${i === current
											? "badge-primary"
											: "badge-ghost"} badge badge-sm"
										>${i + 1}</span
									>
									<span class="truncate text-sm font-medium">${s.title}</span>
								</div>
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
		"deck-overview": DeckOverview;
	}
}
