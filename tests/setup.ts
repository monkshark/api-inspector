import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { chromeMock, resetChromeMock } from './helpers/chromeMock'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver =
  ResizeObserverStub as unknown as typeof ResizeObserver
;(globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get: () => 600,
})
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get: () => 800,
})
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get: () => 600,
})
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get: () => 800,
})
HTMLElement.prototype.getBoundingClientRect = () =>
  ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }) as DOMRect
HTMLElement.prototype.scrollTo = () => {}

beforeEach(() => {
  resetChromeMock()
})
