import { html, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { AppElement } from "../lit-base";
import type { Slide } from "../markdown";
import type { DeckSettings } from "../derive";

/**
 * Entrance keyframes for a transition, mirrored by navigation direction
 * (`dir`: 1 = forward, -1 = backward) so going back doesn't replay the
 * forward animation. `fade` has no direction.
 */
function enterFrames(transition: string, dir: number): Keyframe[] | null {
	switch (transition) {
		case "fade":
			return [{ opacity: 0 }, { opacity: 1 }];
		case "slide":
			return [
				{ opacity: 0, transform: `translateX(${dir >= 0 ? 6 : -6}%)` },
				{ opacity: 1, transform: "translateX(0)" },
			];
		case "zoom":
			return [
				{ opacity: 0, transform: `scale(${dir >= 0 ? 0.92 : 1.06})` },
				{ opacity: 1, transform: "scale(1)" },
			];
		default:
			return null;
	}
}

/**
 * Renders a single slide on a fixed logical canvas (w x h) and scales it with
 * a CSS transform to fit its container, so every theme looks pixel-identical
 * regardless of viewport size.
 *
 * The fit-scale transform lives on `.slide-surface`; entrance transitions are
 * played on the inner `.slide-canvas` via the Web Animations API so the two
 * never fight over the `transform` property.
 */
@customElement("slide-view")
export class SlideView extends AppElement {
	@property({ attribute: false }) slide!: Slide;
	@property() themeClass = "deck-minimal";
	@property() bodyFont = "";
	@property() codeFont = "";
	@property({ type: Number }) fontScale = 1;
	@property({ type: Number }) w = 1280;
	@property({ type: Number }) h = 720;
	@property({ type: Number }) index = 0;
	@property({ type: Number }) total = 1;
	@property({ type: Boolean }) showNumber = false;
	/** Transition id: fade | slide | zoom | none. */
	@property() transition = "none";
	/** When true, fill the container width even if height overflows (thumbnails). */
	@property({ type: Boolean }) fitWidth = false;

	@state() private scale = 1;
	@query(".slide-canvas") private canvas?: HTMLElement;
	private ro?: ResizeObserver;

	connectedCallback() {
		super.connectedCallback();
		this.ro = new ResizeObserver(() => this.recompute());
		this.ro.observe(this);
	}

	disconnectedCallback() {
		this.ro?.disconnect();
		super.disconnectedCallback();
	}

	protected updated(changed: PropertyValues) {
		// Measure after the DOM has committed so we never set state mid-update.
		if (changed.has("w") || changed.has("h") || changed.has("fitWidth"))
			requestAnimationFrame(() => this.recompute());

		// Replay the entrance transition only when the slide actually changes
		// (navigation), not on every re-render — otherwise editing the source
		// would re-animate the preview on each keystroke. Direction is inferred
		// from the index delta (prev is undefined on the first render → forward).
		if (changed.has("index")) {
			const prev = changed.get("index");
			const dir = typeof prev === "number" ? Math.sign(this.index - prev) || 1 : 1;
			this.playTransition(dir);
		}
	}

	private playTransition(dir: number) {
		if (!this.canvas) return;
		// Drop any prior (finished, fill:both) animation so transforms don't stack.
		this.canvas.getAnimations().forEach((a) => a.cancel());
		const frames = enterFrames(this.transition, dir);
		if (!frames) return;
		this.canvas.animate(frames, {
			duration: 380,
			easing: "cubic-bezier(0.22, 1, 0.36, 1)",
			fill: "both",
		});
	}

	private recompute() {
		const rect = this.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		const sw = rect.width / this.w;
		const sh = rect.height / this.h;
		const next = this.fitWidth ? sw : Math.min(sw, sh);
		if (Math.abs(next - this.scale) > 0.0005) this.scale = next;
	}

	render() {
		const deckStyle = [
			`--slide-w:${this.w}`,
			`--slide-h:${this.h}`,
			`--slide-scale:${this.fontScale}`,
			this.bodyFont && `--slide-font:${this.bodyFont}`,
			this.bodyFont && `--slide-heading-font:${this.bodyFont}`,
			this.codeFont && `--slide-code-font:${this.codeFont}`,
		]
			.filter(Boolean)
			.join(";");

		const s = this.scale;
		return html`
			<div
				class="deck ${this.themeClass} w-full h-full flex items-center justify-center"
				style=${deckStyle}
			>
				<div style="width:${this.w * s}px;height:${this.h * s}px">
					<div
						class="slide-surface shadow-xl rounded-(--slide-radius)"
						style="width:${this.w}px;height:${this
							.h}px;transform:scale(${s});transform-origin:top left"
					>
						<div class="slide-canvas">${unsafeHTML(this.slide?.html ?? "")}</div>
						${this.showNumber
							? html`<div class="slide-badge">${this.index + 1} / ${this.total}</div>`
							: null}
					</div>
				</div>
			</div>
		`;
	}
}

export interface SlideTagOptions {
	/** Extra classes for the host element. */
	class?: string;
	index?: number;
	total?: number;
	showNumber?: boolean;
	transition?: string;
	fitWidth?: boolean;
}

/**
 * Render a <slide-view> from resolved deck settings. Centralizes the shared
 * property bindings used by the preview, filmstrip, overview, presenter and
 * print views. Importing this also registers the custom element.
 */
export function slideTag(
	slide: Slide,
	cfg: DeckSettings,
	opts: SlideTagOptions = {},
): TemplateResult {
	return html`
		<slide-view
			class=${opts.class ?? ""}
			.slide=${slide}
			.themeClass=${cfg.themeClass}
			.bodyFont=${cfg.bodyStack}
			.codeFont=${cfg.codeStack}
			.fontScale=${cfg.fontScale}
			.w=${cfg.w}
			.h=${cfg.h}
			.index=${opts.index ?? 0}
			.total=${opts.total ?? 1}
			.showNumber=${opts.showNumber ?? false}
			.transition=${opts.transition ?? "none"}
			.fitWidth=${opts.fitWidth ?? false}
		></slide-view>
	`;
}

declare global {
	interface HTMLElementTagNameMap {
		"slide-view": SlideView;
	}
}
