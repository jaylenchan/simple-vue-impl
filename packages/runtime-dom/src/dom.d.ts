type HTMLEvents = {
  [K in keyof HTMLElementEventMap]: HTMLElementEventMap[K]
}

interface Invoker {
  (event: Event): void
  value: (event: Event) => void
}

interface HTMLElement {
  invokerCache: {
    [K in keyof HTMLEvents]: Invoker | undefined
  }
}