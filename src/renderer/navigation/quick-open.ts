import {
  collectQuickOpenItems,
  filterQuickOpenItems,
  type QuickOpenItem,
} from './quick-open-service'
import { getFileIconClass } from '../../shared/language-registry'

export class QuickOpenPanel {
  private readonly overlay: HTMLElement
  private readonly input: HTMLInputElement
  private readonly list: HTMLElement
  private items: QuickOpenItem[] = []
  private filtered: QuickOpenItem[] = []
  private selectedIndex = 0
  private onSelect: ((item: QuickOpenItem) => void) | null = null
  private visible = false

  constructor(container: HTMLElement) {
    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'quick-open-overlay'
    this.overlay.hidden = true

    const panel = globalThis.document.createElement('div')
    panel.className = 'quick-open-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'Quick Open')

    const header = globalThis.document.createElement('div')
    header.className = 'quick-open-header'

    this.input = globalThis.document.createElement('input')
    this.input.className = 'quick-open-input'
    this.input.type = 'text'
    this.input.placeholder = 'Search files by name...'
    this.input.setAttribute('aria-label', 'Search files')

    const shortcut = globalThis.document.createElement('span')
    shortcut.className = 'quick-open-shortcut'
    shortcut.textContent = 'Ctrl+P'

    header.append(this.input, shortcut)

    this.list = globalThis.document.createElement('div')
    this.list.className = 'quick-open-list'

    const footer = globalThis.document.createElement('div')
    footer.className = 'quick-open-footer'
    footer.innerHTML = `
      <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
      <span><kbd>↵</kbd> to open</span>
      <span><kbd>esc</kbd> to close</span>
    `

    panel.append(header, this.list, footer)
    this.overlay.append(panel)
    container.append(this.overlay)

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.hide()
      }
    })

    this.input.addEventListener('input', () => {
      this.applyFilter(this.input.value)
    })

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.hide()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filtered.length - 1)
        this.renderList()
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
        this.renderList()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const item = this.filtered[this.selectedIndex]
        if (item) {
          this.onSelect?.(item)
          this.hide()
        }
      }
    })
  }

  async show(workspaceRoot: string | null, onSelect: (item: QuickOpenItem) => void): Promise<void> {
    this.onSelect = onSelect
    this.visible = true
    this.overlay.hidden = false
    this.input.value = ''
    this.items = await collectQuickOpenItems(workspaceRoot)
    this.applyFilter('')
    this.input.focus()
  }

  hide(): void {
    this.visible = false
    this.overlay.hidden = true
    this.onSelect = null
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    this.overlay.remove()
  }

  private applyFilter(query: string): void {
    this.filtered = filterQuickOpenItems(this.items, query)
    this.selectedIndex = 0
    this.renderList()
  }

  private renderList(): void {
    this.list.replaceChildren()

    if (this.filtered.length === 0) {
      const empty = globalThis.document.createElement('div')
      empty.className = 'quick-open-empty'
      empty.textContent = 'No matching files'
      this.list.append(empty)
      return
    }

    for (const [index, item] of this.filtered.entries()) {
      const row = globalThis.document.createElement('button')
      row.type = 'button'
      row.className = 'quick-open-item'

      if (index === this.selectedIndex) {
        row.classList.add('quick-open-item--selected')
      }

      const icon = globalThis.document.createElement('span')
      icon.className = `quick-open-item__icon file-icon file-icon--${getFileIconClass(item.path)}`
      icon.setAttribute('aria-hidden', 'true')

      const content = globalThis.document.createElement('span')
      content.className = 'quick-open-item__content'

      const label = globalThis.document.createElement('span')
      label.className = 'quick-open-item-label'
      label.textContent = item.label.split('/').pop() ?? item.label

      const path = globalThis.document.createElement('span')
      path.className = 'quick-open-item-path'
      path.textContent = item.path

      content.append(label, path)

      const meta = globalThis.document.createElement('span')
      meta.className = 'quick-open-item-meta'
      meta.textContent = item.kind === 'recent' ? 'recent' : ''

      row.append(icon, content, meta)

      row.addEventListener('click', () => {
        this.onSelect?.(item)
        this.hide()
      })

      this.list.append(row)
    }
  }
}
