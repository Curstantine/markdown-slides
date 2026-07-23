import { SAMPLE_MARKDOWN } from "./config";

export type ColorMode = "light" | "dark" | "system";
export type ViewMode = "edit" | "preview" | "overview";

export interface AppState {
	/** Raw markdown source. */
	markdown: string;
	/** Site chrome color mode. */
	colorMode: ColorMode;
	/** Editor pane visible alongside the preview. */
	showEditor: boolean;
	view: ViewMode;
	/** Current slide index (0-based). */
	current: number;

	/* Slide look & feel */
	slideTheme: string;
	bodyFont: string;
	codeFont: string;
	fontScale: number;
	aspect: string;
	transition: string;
	showPageNumbers: boolean;
}

const STORAGE_KEY = "markdown-slides:v1";

const DEFAULTS: AppState = {
	markdown: SAMPLE_MARKDOWN,
	colorMode: "system",
	showEditor: true,
	view: "edit",
	current: 0,
	slideTheme: "minimal",
	bodyFont: "inter",
	codeFont: "jetbrains",
	fontScale: 1,
	aspect: "16:9",
	transition: "slide",
	showPageNumbers: true,
};

/** Fields that are persisted (transient UI state like `current` is not). */
const PERSISTED: (keyof AppState)[] = [
	"markdown",
	"colorMode",
	"showEditor",
	"slideTheme",
	"bodyFont",
	"codeFont",
	"fontScale",
	"aspect",
	"transition",
	"showPageNumbers",
];

function load(): AppState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<AppState>;
		return { ...DEFAULTS, ...parsed, current: 0, view: DEFAULTS.view };
	} catch {
		return { ...DEFAULTS };
	}
}

class Store extends EventTarget {
	state: AppState = load();

	private persist() {
		const out: Partial<AppState> = {};
		for (const k of PERSISTED) (out as Record<string, unknown>)[k] = this.state[k];
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
		} catch {
			/* ignore quota / private-mode errors */
		}
	}

	/** Patch one or more fields and notify subscribers. */
	set(patch: Partial<AppState>) {
		this.state = { ...this.state, ...patch };
		this.persist();
		this.dispatchEvent(new CustomEvent("change", { detail: patch }));
	}

	/** Notify subscribers without changing state (e.g. async resources loaded). */
	touch() {
		this.dispatchEvent(new CustomEvent("change", { detail: {} }));
	}

	/** Subscribe to any change; returns an unsubscribe fn. */
	subscribe(fn: () => void): () => void {
		const handler = () => fn();
		this.addEventListener("change", handler);
		return () => this.removeEventListener("change", handler);
	}

	reset() {
		this.state = { ...DEFAULTS };
		this.persist();
		this.dispatchEvent(new CustomEvent("change", { detail: this.state }));
	}
}

export const store = new Store();
