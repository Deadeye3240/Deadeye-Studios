export type DeadeyeButtonVariant = 'default' | 'primary' | 'danger' | 'ghost'

export interface DeadeyeButtonOptions {
  readonly label: string
  readonly variant?: DeadeyeButtonVariant
  readonly size?: 'default' | 'sm'
  readonly disabled?: boolean
  readonly type?: 'button' | 'submit'
  readonly onClick?: () => void
}

export function createButton(options: DeadeyeButtonOptions): HTMLButtonElement {
  const button = globalThis.document.createElement('button')
  button.type = options.type ?? 'button'
  button.className = 'deadeye-btn'

  if (options.variant && options.variant !== 'default') {
    button.classList.add(`deadeye-btn--${options.variant}`)
  }

  if (options.size === 'sm') {
    button.classList.add('deadeye-btn--sm')
  }

  button.textContent = options.label
  button.disabled = options.disabled ?? false

  if (options.onClick) {
    button.addEventListener('click', options.onClick)
  }

  return button
}
