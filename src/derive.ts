import { store } from "./store";
import { ASPECTS, BODY_FONTS, CODE_FONTS, findFont, findSlideTheme, loadFont } from "./config";

export interface DeckSettings {
	themeClass: string;
	bodyStack: string;
	codeStack: string;
	w: number;
	h: number;
	transition: string;
	fontScale: number;
	showNumber: boolean;
}

/** Resolve the current store state into concrete values for rendering slides. */
export function deckSettings(): DeckSettings {
	const s = store.state;
	const theme = findSlideTheme(s.slideTheme);
	const body = findFont(BODY_FONTS, s.bodyFont);
	const code = findFont(CODE_FONTS, s.codeFont);
	const aspect = ASPECTS.find((a) => a.id === s.aspect) ?? ASPECTS[0];

	// Ensure any web fonts in use are actually loaded.
	loadFont(body);
	loadFont(code);

	return {
		themeClass: theme.cls,
		bodyStack: body.stack,
		codeStack: code.stack,
		w: aspect.w,
		h: aspect.h,
		transition: s.transition,
		fontScale: s.fontScale,
		showNumber: s.showPageNumbers,
	};
}
