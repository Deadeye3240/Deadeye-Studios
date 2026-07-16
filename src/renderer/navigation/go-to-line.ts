export class GoToLinePanel {
  private readonly overlay: HTMLElement
  private readonly input: HTMLInputElement
  private onSubmit: ((line: number) => void) | null = null
  private visible = false

  constructor(container: HTMLElement) {
    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'go-to-line-overlay'
    this.overlay.hidden = true

    const panel = globalThis.document.createElement('div')
    panel.className = 'go-to-line-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'Go to Line')

    const label = globalThis.document.createElement('label')
    label.className = 'go-to-line-label'
    label.textContent = 'Go to line:'

    this.input = globalThis.document.createElement('input')
    this.input.className = 'go-to-line-input'
    this.input.type = 'text'
    this.input.inputMode = 'numeric'
    this.input.placeholder = 'Line number'
    label.append(this.input)

    panel.append(label)
    this.overlay.append(panel)
    container.append(this.overlay)

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.hide()
      }
    })

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.hide()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const line = Number.parseInt(this.input.value, 10)
        if (Number.isFinite(line) && line > 0) {
          this.onSubmit?.(line)
          this.hide()
        }
      }
    })
  }

  show(onSubmit: (line: number) => void): void {
    this.onSubmit = onSubmit
    this.visible = true
    this.overlay.hidden = false
    this.input.value = ''
    this.input.focus()
  }

  hide(): void {
    this.visible = false
    this.overlay.hidden = true
    this.onSubmit = null
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    this.overlay.remove()
  }
}
