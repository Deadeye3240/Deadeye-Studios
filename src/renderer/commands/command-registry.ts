import type { CommandDefinition, CommandId } from '../../shared/commands'

export interface CommandRegistryOptions {
  readonly onError?: (error: unknown, commandId: CommandId) => void
}

export class CommandRegistry {
  private readonly commands = new Map<CommandId, CommandDefinition>()
  private readonly onError?: (error: unknown, commandId: CommandId) => void
  private disposed = false

  constructor(options: CommandRegistryOptions = {}) {
    this.onError = options.onError
  }

  register(definition: CommandDefinition): () => void {
    if (this.disposed) {
      throw new Error('Cannot register commands on a disposed CommandRegistry')
    }

    this.commands.set(definition.id, definition)

    return () => {
      this.commands.delete(definition.id)
    }
  }

  registerMany(definitions: readonly CommandDefinition[]): () => void {
    const unsubscribers = definitions.map((definition) => this.register(definition))
    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    }
  }

  getCommand(id: CommandId): CommandDefinition | null {
    return this.commands.get(id) ?? null
  }

  getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values()).sort((a, b) => a.title.localeCompare(b.title))
  }

  async execute(id: CommandId): Promise<boolean> {
    if (this.disposed) {
      return false
    }

    const command = this.commands.get(id)
    if (!command) {
      return false
    }

    try {
      await command.handler()
      return true
    } catch (error) {
      this.onError?.(error, id)
      return false
    }
  }

  bindKeyboardShortcuts(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (this.disposed) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        const isSaveShortcut =
          (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's'
        const isPalette =
          (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p'
        const isQuickOpen =
          (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'p'
        const isSearch =
          (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f'
        const isGoToLine =
          (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g'
        const isTerminal =
          (event.ctrlKey || event.metaKey) && event.key === '`'

        if (
          !isSaveShortcut &&
          !isPalette &&
          !isQuickOpen &&
          !isSearch &&
          !isGoToLine &&
          !isTerminal
        ) {
          return
        }
      }

      for (const command of this.commands.values()) {
        if (!command.shortcut) {
          continue
        }

        if (matchesShortcut(event, command.shortcut)) {
          event.preventDefault()
          void this.execute(command.id)
          return
        }
      }
    }

    globalThis.document.addEventListener('keydown', handler, true)
    return () => {
      globalThis.document.removeEventListener('keydown', handler, true)
    }
  }

  bindMenuCommands(): () => void {
    if (!window.deadeye?.menu) {
      return () => {}
    }

    const unsubscribe = window.deadeye.menu.onExecuteCommand((commandId) => {
      void this.execute(commandId)
    })

    return unsubscribe
  }

  dispose(): void {
    this.disposed = true
    this.commands.clear()
  }
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+').map((part) => part.trim().toLowerCase())
  const key = parts.at(-1) ?? ''
  const needsCtrl = parts.includes('ctrl') || parts.includes('cmdorctrl')
  const needsShift = parts.includes('shift')
  const needsAlt = parts.includes('alt')

  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase()

  if (key === 'cmdorctrl') {
    return false
  }

  const ctrlPressed = event.ctrlKey || event.metaKey

  if (needsCtrl !== ctrlPressed) {
    return false
  }

  if (needsShift !== event.shiftKey) {
    return false
  }

  if (needsAlt !== event.altKey) {
    return false
  }

  if (key === '`') {
    return event.key === '`' || event.code === 'Backquote'
  }

  return eventKey === key
}
