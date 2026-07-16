import type { CommandDefinition } from '../../shared/commands'

export class CommandPalette {
  private readonly overlay: HTMLElement
  private readonly input: HTMLInputElement
  private readonly list: HTMLElement
  private commands: CommandDefinition[] = []
  private filtered: CommandDefinition[] = []
  private selectedIndex = 0
  private onExecute: ((command: CommandDefinition) => void) | null = null
  private visible = false

  constructor(container: HTMLElement) {
    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'command-palette-overlay'
    this.overlay.hidden = true

    const panel = globalThis.document.createElement('div')
    panel.className = 'command-palette'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'Command Palette')

    const header = globalThis.document.createElement('div')
    header.className = 'command-palette-header'

    this.input = globalThis.document.createElement('input')
    this.input.className = 'command-palette-input'
    this.input.type = 'text'
    this.input.placeholder = 'Type a command name...'
    this.input.setAttribute('aria-label', 'Command search')

    const shortcut = globalThis.document.createElement('span')
    shortcut.className = 'command-palette-shortcut'
    shortcut.textContent = 'Ctrl+Shift+P'

    header.append(this.input, shortcut)

    this.list = globalThis.document.createElement('div')
    this.list.className = 'command-palette-list'
    this.list.setAttribute('role', 'listbox')

    const footer = globalThis.document.createElement('div')
    footer.className = 'command-palette-footer'
    footer.innerHTML = `
      <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
      <span><kbd>↵</kbd> to run</span>
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
      this.filterCommands(this.input.value)
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
        const command = this.filtered[this.selectedIndex]
        if (command) {
          this.onExecute?.(command)
          this.hide()
        }
      }
    })
  }

  setCommands(commands: readonly CommandDefinition[]): void {
    this.commands = [...commands]
  }

  show(onExecute: (command: CommandDefinition) => void): void {
    this.onExecute = onExecute
    this.visible = true
    this.overlay.hidden = false
    this.input.value = ''
    this.filterCommands('')
    this.input.focus()
  }

  hide(): void {
    this.visible = false
    this.overlay.hidden = true
    this.onExecute = null
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    this.overlay.remove()
  }

  private filterCommands(query: string): void {
    const normalized = query.trim().toLowerCase()

    this.filtered = this.commands.filter((command) => {
      if (!normalized) {
        return true
      }

      const haystack = `${command.title} ${command.category ?? ''} ${command.shortcut ?? ''}`.toLowerCase()
      return haystack.includes(normalized)
    })

    this.selectedIndex = 0
    this.renderList()
  }

  private renderList(): void {
    this.list.replaceChildren()

    for (const [index, command] of this.filtered.entries()) {
      const item = globalThis.document.createElement('button')
      item.type = 'button'
      item.className = 'command-palette-item'
      item.setAttribute('role', 'option')

      if (index === this.selectedIndex) {
        item.classList.add('command-palette-item--selected')
      }

      const title = globalThis.document.createElement('span')
      title.className = 'command-palette-item-title'
      title.textContent = command.title

      const meta = globalThis.document.createElement('span')
      meta.className = 'command-palette-item-meta'
      meta.textContent = command.shortcut ?? command.category ?? ''

      item.append(title, meta)

      item.addEventListener('click', () => {
        this.onExecute?.(command)
        this.hide()
      })

      this.list.append(item)
    }
  }
}
