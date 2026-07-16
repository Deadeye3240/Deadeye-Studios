export class GitDiffViewer {
  private readonly overlay: HTMLElement
  private readonly title: HTMLElement
  private readonly content: HTMLElement

  constructor(container: HTMLElement) {
    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'git-diff-overlay'
    this.overlay.hidden = true

    const panel = globalThis.document.createElement('div')
    panel.className = 'git-diff-panel'

    this.title = globalThis.document.createElement('div')
    this.title.className = 'git-diff-title'

    this.content = globalThis.document.createElement('pre')
    this.content.className = 'git-diff-content'

    const closeButton = globalThis.document.createElement('button')
    closeButton.type = 'button'
    closeButton.className = 'git-diff-close'
    closeButton.textContent = 'Close'
    closeButton.addEventListener('click', () => {
      this.hide()
    })

    panel.append(this.title, this.content, closeButton)
    this.overlay.append(panel)
    container.append(this.overlay)

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.hide()
      }
    })
  }

  show(filePath: string, diff: string): void {
    this.title.textContent = `Diff: ${filePath}`
    this.content.textContent = diff || 'No diff available.'
    this.overlay.hidden = false
  }

  hide(): void {
    this.overlay.hidden = true
  }

  dispose(): void {
    this.overlay.remove()
  }
}
