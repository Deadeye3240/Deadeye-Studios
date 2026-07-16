export interface DropdownItem {
  readonly label: string
  readonly onClick: () => void
}

export function createDropdown(trigger: HTMLElement, items: readonly DropdownItem[]): HTMLElement {
  const root = globalThis.document.createElement('div')
  root.className = 'deadeye-dropdown'

  const menu = globalThis.document.createElement('div')
  menu.className = 'deadeye-dropdown__menu'
  menu.hidden = true

  for (const item of items) {
    const button = globalThis.document.createElement('button')
    button.type = 'button'
    button.className = 'deadeye-dropdown__item'
    button.textContent = item.label
    button.addEventListener('click', () => {
      menu.hidden = true
      item.onClick()
    })
    menu.append(button)
  }

  trigger.addEventListener('click', () => {
    menu.hidden = !menu.hidden
  })

  root.append(trigger, menu)
  return root
}
