import type { CommandId } from '../../shared/commands'
import { APPLICATION_MENU_DEFINITION, type ApplicationMenuItemDefinition } from '../../shared/menu-definition'

export type MenuCommandHandler = (commandId: CommandId) => void

export class ApplicationMenuBar {
  private readonly root: HTMLElement
  private readonly menubar: HTMLElement
  private openMenu: HTMLElement | null = null
  private readonly onCommand: MenuCommandHandler
  private readonly handleDocumentPointerDown: (event: PointerEvent) => void
  private readonly handleDocumentKeyDown: (event: KeyboardEvent) => void

  constructor(container: HTMLElement, onCommand: MenuCommandHandler) {
    this.onCommand = onCommand
    this.root = container
    this.root.className = 'app-menubar-host'
    this.root.setAttribute('role', 'presentation')

    this.menubar = globalThis.document.createElement('nav')
    this.menubar.className = 'app-menubar'
    this.menubar.setAttribute('role', 'menubar')
    this.menubar.setAttribute('aria-label', 'Application menu')

    for (const menu of APPLICATION_MENU_DEFINITION) {
      this.menubar.append(this.createTopLevelMenu(menu.label, menu.items))
    }

    this.root.append(this.menubar)

    this.handleDocumentPointerDown = (event) => {
      if (!this.openMenu) {
        return
      }

      const target = event.target
      if (target instanceof Node && this.openMenu.contains(target)) {
        return
      }

      this.closeOpenMenu()
    }

    this.handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        this.closeOpenMenu()
      }
    }

    globalThis.document.addEventListener('pointerdown', this.handleDocumentPointerDown, true)
    globalThis.document.addEventListener('keydown', this.handleDocumentKeyDown, true)
  }

  dispose(): void {
    globalThis.document.removeEventListener('pointerdown', this.handleDocumentPointerDown, true)
    globalThis.document.removeEventListener('keydown', this.handleDocumentKeyDown, true)
    this.closeOpenMenu()
    this.root.replaceChildren()
  }

  private createTopLevelMenu(
    label: string,
    items: readonly ApplicationMenuItemDefinition[],
  ): HTMLElement {
    const item = globalThis.document.createElement('div')
    item.className = 'app-menubar__item'

    const trigger = globalThis.document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'app-menubar__trigger'
    trigger.textContent = label
    trigger.setAttribute('role', 'menuitem')
    trigger.setAttribute('aria-haspopup', 'true')

    const submenu = globalThis.document.createElement('div')
    submenu.className = 'app-menubar__submenu'
    submenu.setAttribute('role', 'menu')
    submenu.hidden = true

    for (const entry of items) {
      if (entry.type === 'separator') {
        const separator = globalThis.document.createElement('div')
        separator.className = 'app-menubar__separator'
        separator.setAttribute('role', 'separator')
        submenu.append(separator)
        continue
      }

      submenu.append(this.createSubmenuButton(entry))
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation()
      if (this.openMenu === submenu) {
        this.closeOpenMenu()
        return
      }

      this.closeOpenMenu()
      submenu.hidden = false
      item.classList.add('app-menubar__item--open')
      this.openMenu = submenu
    })

    item.append(trigger, submenu)
    return item
  }

  private createSubmenuButton(entry: ApplicationMenuItemDefinition): HTMLButtonElement {
    const button = globalThis.document.createElement('button')
    button.type = 'button'
    button.className = 'app-menubar__action'
    button.setAttribute('role', 'menuitem')

    const label = globalThis.document.createElement('span')
    label.className = 'app-menubar__action-label'
    label.textContent = entry.label ?? ''

    button.append(label)

    if (entry.accelerator) {
      const shortcut = globalThis.document.createElement('span')
      shortcut.className = 'app-menubar__action-shortcut'
      shortcut.textContent = entry.accelerator
      button.append(shortcut)
    }

    button.addEventListener('click', () => {
      this.closeOpenMenu()
      if (entry.commandId) {
        this.onCommand(entry.commandId)
      }
    })

    return button
  }

  private closeOpenMenu(): void {
    if (!this.openMenu) {
      return
    }

    this.openMenu.hidden = true
    this.openMenu.parentElement?.classList.remove('app-menubar__item--open')
    this.openMenu = null
  }
}
