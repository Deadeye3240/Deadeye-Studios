export interface ContextMenuItem {
  readonly label: string
  readonly onClick: () => void
}

export function showContextMenu(
  anchorX: number,
  anchorY: number,
  items: readonly ContextMenuItem[],
): () => void {
  const menu = globalThis.document.createElement('div')
  menu.className = 'deadeye-context-menu'
  menu.setAttribute('role', 'menu')
  menu.style.left = `${anchorX}px`
  menu.style.top = `${anchorY}px`

  for (const item of items) {
    const button = globalThis.document.createElement('button')
    button.type = 'button'
    button.className = 'deadeye-dropdown__item'
    button.setAttribute('role', 'menuitem')
    button.textContent = item.label
    button.addEventListener('click', () => {
      cleanup()
      item.onClick()
    })
    menu.append(button)
  }

  const cleanup = (): void => {
    menu.remove()
    globalThis.document.removeEventListener('click', onDocumentClick)
    globalThis.document.removeEventListener('keydown', onKeyDown)
  }

  const onDocumentClick = (): void => {
    cleanup()
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      cleanup()
    }
  }

  globalThis.document.body.append(menu)
  globalThis.setTimeout(() => {
    globalThis.document.addEventListener('click', onDocumentClick)
    globalThis.document.addEventListener('keydown', onKeyDown)
  }, 0)

  return cleanup
}
