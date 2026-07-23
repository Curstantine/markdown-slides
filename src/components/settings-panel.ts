import { html } from "lit";
import { customElement } from "lit/decorators.js";

import {
	ASPECTS,
	BODY_FONTS,
	CODE_FONTS,
	SLIDE_THEMES,
	TRANSITIONS,
	loadFont,
	findFont,
} from "@/config";
import { icon } from "@/icons";
import { AppElement } from "@/lit-base";
import { store } from "@/store";

/** Slide look-and-feel controls: theme, fonts, sizing, transitions. */
@customElement("settings-panel")
export class SettingsPanel extends AppElement {
	private unsub?: () => void;

	connectedCallback() {
		super.connectedCallback();
		this.unsub = store.subscribe(
			[
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

	private section(title: string, ic: Parameters<typeof icon>[0], body: unknown) {
		return html`
			<div class="mb-6">
				<div
					class="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wide opacity-70"
				>
					${icon(ic, "sm")} ${title}
				</div>
				${body}
			</div>
		`;
	}

	render() {
		const s = store.state;

		return html`
			<aside
				class="w-80 max-w-[85vw] h-dvh bg-base-100 border-l border-base-300 flex flex-col shadow-2xl"
			>
				<div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
					<h2 class="font-bold text-lg flex items-center gap-2">
						${icon("paintBrush")} Slide design
					</h2>
					<label
						for="settings-drawer"
						class="btn btn-ghost btn-sm btn-circle"
						aria-label="Close settings"
					>
						${icon("close")}
					</label>
				</div>

				<div class="flex-1 overflow-y-auto p-4">
					<!-- Theme -->
					${this.section(
						"Theme",
						"swatch",
						html`
							<div class="grid grid-cols-2 gap-2">
								${SLIDE_THEMES.map(
									(t) => html`
										<button
											class="relative rounded-lg border-2 p-2 text-left transition hover:shadow-md
                        ${s.slideTheme === t.id
												? "border-primary ring-2 ring-primary/30"
												: "border-base-300"}"
											@click=${() => store.set({ slideTheme: t.id })}
										>
											<div
												class="h-9 rounded-md mb-1.5 flex items-center px-2 gap-1"
												style="background:${t.swatch[0]}"
											>
												<span
													class="text-sm font-bold"
													style="color:${t.swatch[1]}"
													>Aa</span
												>
												<span
													class="ml-auto w-3.5 h-3.5 rounded-full"
													style="background:${t.swatch[2]}"
												></span>
											</div>
											<span class="text-xs font-medium">${t.name}</span>
										</button>
									`,
								)}
							</div>
						`,
					)}

					<!-- Body font -->
					${this.section(
						"Body font",
						"doc",
						html`
							<select
								class="select select-bordered w-full"
								@change=${(e: Event) => {
									const id = (e.target as HTMLSelectElement).value;
									loadFont(findFont(BODY_FONTS, id));
									store.set({ bodyFont: id });
								}}
							>
								${BODY_FONTS.map(
									(f) =>
										html`<option value=${f.id} ?selected=${f.id === s.bodyFont}>
											${f.name}
										</option>`,
								)}
							</select>
							<div
								class="mt-2 px-3 py-2 rounded-lg bg-base-200 text-lg"
								style="font-family:${findFont(BODY_FONTS, s.bodyFont).stack}"
							>
								The quick brown fox jumps
							</div>
						`,
					)}

					<!-- Code font -->
					${this.section(
						"Code font",
						"code",
						html`
							<select
								class="select select-bordered w-full"
								@change=${(e: Event) => {
									const id = (e.target as HTMLSelectElement).value;
									loadFont(findFont(CODE_FONTS, id));
									store.set({ codeFont: id });
								}}
							>
								${CODE_FONTS.map(
									(f) =>
										html`<option value=${f.id} ?selected=${f.id === s.codeFont}>
											${f.name}
										</option>`,
								)}
							</select>
							<div
								class="mt-2 px-3 py-2 rounded-lg bg-base-200 text-sm"
								style="font-family:${findFont(CODE_FONTS, s.codeFont).stack}"
							>
								const sum = (a, b) =&gt; a + b;
							</div>
						`,
					)}

					<!-- Sizing -->
					${this.section(
						"Text size",
						"adjustments",
						html`
							<div class="flex items-center gap-3">
								<input
									type="range"
									min="0.7"
									max="1.4"
									step="0.05"
									class="range range-primary range-sm flex-1"
									.value=${String(s.fontScale)}
									@input=${(e: Event) =>
										store.set({
											fontScale: Number((e.target as HTMLInputElement).value),
										})}
								/>
								<span class="text-sm font-mono w-12 text-right"
									>${Math.round(s.fontScale * 100)}%</span
								>
							</div>
						`,
					)}

					<!-- Aspect ratio -->
					${this.section(
						"Aspect ratio",
						"present",
						html`
							<div class="join w-full">
								${ASPECTS.map(
									(a) => html`
										<button
											class="btn join-item flex-1 ${s.aspect === a.id
												? "btn-primary"
												: "btn-outline"}"
											@click=${() => store.set({ aspect: a.id })}
										>
											${a.name}
										</button>
									`,
								)}
							</div>
						`,
					)}

					<!-- Transition -->
					${this.section(
						"Transition",
						"sparkles",
						html`
							<div class="grid grid-cols-4 gap-2">
								${TRANSITIONS.map(
									(t) => html`
										<button
											class="btn btn-sm ${s.transition === t.id
												? "btn-primary"
												: "btn-outline"}"
											@click=${() => store.set({ transition: t.id })}
										>
											${t.name}
										</button>
									`,
								)}
							</div>
						`,
					)}

					<!-- Toggles -->
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="checkbox"
								class="toggle toggle-primary"
								.checked=${s.showPageNumbers}
								@change=${(e: Event) =>
									store.set({
										showPageNumbers: (e.target as HTMLInputElement).checked,
									})}
							/>
							<span class="label-text">Show page numbers</span>
						</label>
					</div>
				</div>

				<div class="p-4 border-t border-base-300">
					<button
						class="btn btn-outline btn-error btn-sm w-full gap-2"
						@click=${() => {
							if (confirm("Reset all slide design settings to defaults?"))
								store.set({
									slideTheme: "minimal",
									bodyFont: "inter",
									codeFont: "jetbrains",
									fontScale: 1,
									aspect: "16:9",
									transition: "slide",
									showPageNumbers: true,
								});
						}}
					>
						${icon("trash", "sm")} Reset design
					</button>
				</div>
			</aside>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"settings-panel": SettingsPanel;
	}
}
