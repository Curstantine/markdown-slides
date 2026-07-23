import { LitElement } from "lit";

/**
 * Base class that renders into the light DOM instead of a shadow root.
 *
 * This is what lets global Tailwind v4 + daisyUI utility classes (and our
 * slide-theme CSS) style everything the components render — shadow DOM would
 * wall those styles off. Every component in the app extends this.
 */
export class AppElement extends LitElement {
	protected createRenderRoot() {
		return this;
	}
}
