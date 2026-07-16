import { createButton } from './button'

export interface ModalAction {
  readonly label: string
  readonly variant?: 'default' | 'primary' | 'danger' | 'ghost'
  readonly onClick: () => void
}

export interface ModalOptions {
  readonly title: string
  readonly message?: string
  readonly wide?: boolean
  readonly input?: {
    readonly value?: string
    readonly placeholder?: string
  }
  readonly actions: readonly ModalAction[]
  readonly onClose?: () => void
}

export class Modal {
  private readonly overlay: HTMLElement
  private readonly panel: HTMLElement
  private readonly onClose?: () => void
  private inputElement: HTMLInputElement | null = null
  private disposed = false
  private readonly handleKeyDown: (event: KeyboardEvent) => void

  constructor(container: HTMLElement, options: ModalOptions) {
    this.onClose = options.onClose

    this.handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.close()
      }
    }

    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'deadeye-modal-overlay'
    this.overlay.setAttribute('role', 'presentation')

    this.panel = globalThis.document.createElement('div')
    this.panel.className = `deadeye-modal deadeye-panel${options.wide ? ' deadeye-modal--wide' : ''}`
    this.panel.setAttribute('role', 'dialog')
    this.panel.setAttribute('aria-modal', 'true')
    this.panel.setAttribute('aria-label', options.title)

    const header = globalThis.document.createElement('div')
    header.className = 'deadeye-modal__header'

    const title = globalThis.document.createElement('h2')
    title.className = 'deadeye-modal__title'
    title.textContent = options.title
    header.append(title)

    this.panel.append(header)

    if (options.message) {
      const message = globalThis.document.createElement('p')
      message.className = 'deadeye-modal__message'
      message.textContent = options.message
      this.panel.append(message)
    }

    if (options.input) {
      this.inputElement = globalThis.document.createElement('input')
      this.inputElement.className = 'deadeye-modal__input'
      this.inputElement.type = 'text'
      this.inputElement.value = options.input.value ?? ''
      this.inputElement.placeholder = options.input.placeholder ?? ''
      this.panel.append(this.inputElement)
    }

    const actions = globalThis.document.createElement('div')
    actions.className = 'deadeye-modal__actions'

    for (const action of options.actions) {
      actions.append(
        createButton({
          label: action.label,
          variant: action.variant,
          onClick: () => {
            action.onClick()
          },
        }),
      )
    }

    this.panel.append(actions)
    this.overlay.append(this.panel)
    container.append(this.overlay)

    this.panel.addEventListener('click', (event) => {
      event.stopPropagation()
    })

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.close()
      }
    })

    this.overlay.addEventListener('mousedown', (event) => {
      if (event.target === this.overlay) {
        event.preventDefault()
      }
    })

    globalThis.document.addEventListener('keydown', this.handleKeyDown)

    globalThis.setTimeout(() => {
      if (this.inputElement) {
        this.inputElement.focus()
        this.inputElement.select()
      } else {
        const firstButton = actions.querySelector<HTMLButtonElement>('button')
        firstButton?.focus()
      }
    }, 0)
  }

  getInputValue(): string {
    return this.inputElement?.value.trim() ?? ''
  }

  close(): void {
    if (this.disposed) {
      return
    }

    this.onClose?.()
    this.dispose()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    globalThis.document.removeEventListener('keydown', this.handleKeyDown)
    this.overlay.remove()
  }
}
