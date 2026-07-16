export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  readonly kind?: ToastKind
  readonly durationMs?: number
}

export class ToastManager {
  private readonly container: HTMLElement
  private disposed = false

  constructor(container: HTMLElement) {
    this.container = container
    this.container.className = 'toast-container'
  }

  show(message: string, options: ToastOptions = {}): void {
    if (this.disposed) {
      return
    }

    const kind = options.kind ?? 'info'
    const durationMs = options.durationMs ?? 3500

    const toast = globalThis.document.createElement('div')
    toast.className = `deadeye-toast deadeye-toast--${kind}`
    toast.setAttribute('role', 'status')
    toast.textContent = message

    this.container.append(toast)

    globalThis.setTimeout(() => {
      toast.classList.add('deadeye-toast--dismiss')
      globalThis.setTimeout(() => {
        toast.remove()
      }, 200)
    }, durationMs)
  }

  success(message: string): void {
    this.show(message, { kind: 'success' })
  }

  error(message: string): void {
    this.show(message, { kind: 'error', durationMs: 5000 })
  }

  warning(message: string): void {
    this.show(message, { kind: 'warning', durationMs: 4500 })
  }

  info(message: string): void {
    this.show(message, { kind: 'info' })
  }

  dispose(): void {
    this.disposed = true
    this.container.replaceChildren()
  }
}
