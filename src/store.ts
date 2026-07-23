import { SAMPLE_MARKDOWN } from "@/config";

export type ColorMode = "light" | "dark" | "system";
export type ViewMode = "edit" | "preview" | "overview";

export interface AppState {
	markdown: string;
	colorMode: ColorMode;
	showEditor: boolean;
	view: ViewMode;
	current: number;

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

	/** Patch one or more fields and notify only subscribers that use changed fields. */
	set(p: Partial<AppState>) {
		const changed = Object.fromEntries(
			Object.entries(p).filter(([k, v]) =>
				Object.is(this.state[k as keyof AppState], v) ? false : true,
			),
		) as Partial<AppState>;
		if (Object.keys(changed).length === 0) return;

		this.state = { ...this.state, ...changed };
		this.persist();
		this.dispatchEvent(new CustomEvent("change", { detail: changed }));
	}

	/** Notify subscribers without changing state (e.g. async resources loaded). */
	touch() {
		this.dispatchEvent(new CustomEvent("change", { detail: {} }));
	}

	/** Subscribe to any change; returns an unsubscribe function. */
	subscribe(fn: () => void): () => void;
	/** Subscribe to changes to specific state fields; `touch()` still notifies every subscriber. */
	subscribe<K extends keyof AppState>(keys: readonly K[], fn: () => void): () => void;
	subscribe<K extends keyof AppState>(
		keysOrFn: readonly K[] | (() => void),
		maybeFn?: () => void,
	): () => void {
		const keys = typeof keysOrFn === "function" ? undefined : keysOrFn;
		const fn = typeof keysOrFn === "function" ? keysOrFn : maybeFn;
		if (!fn) throw new Error("A store subscription callback is required");

		const handler = (event: Event) => {
			const changed = (event as CustomEvent<Partial<AppState>>).detail;
			// An empty patch is a resource refresh (for example a Shiki grammar loading).
			if (!keys || Object.keys(changed).length === 0 || keys.some((key) => key in changed))
				fn();
		};

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
