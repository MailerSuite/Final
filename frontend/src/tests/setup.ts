// ResizeObserver polyfill for JSDOM
class ResizeObserverPolyfill {
	callback: ResizeObserverCallback
	constructor(callback: ResizeObserverCallback) {
		this.callback = callback
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

// @ts-ignore
if (typeof window !== 'undefined' && (window as any).ResizeObserver === undefined) {
	// @ts-ignore
	;(window as any).ResizeObserver = ResizeObserverPolyfill
}

// matchMedia polyfill
if (typeof window !== 'undefined' && !window.matchMedia) {
	// @ts-ignore
	window.matchMedia = (query: string) => ({
		matches: false,
		media: query,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
		onchange: null,
	}) as any
}

// scrollIntoView polyfill
if (typeof window !== 'undefined' && !Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = function () {}
}