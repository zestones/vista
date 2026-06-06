/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unnecessary-type-assertion -- jsdom polyfills */
import '@testing-library/jest-dom/vitest'

// jsdom lacks these; the Gantt uses them.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {}
}

if (!window.matchMedia) {
  window.matchMedia = (q: string) =>
    ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false
      },
    }) as unknown as MediaQueryList
}
