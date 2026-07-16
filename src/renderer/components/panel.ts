export interface PanelOptions {
  readonly title?: string
  readonly className?: string
}

export function createPanel(options: PanelOptions = {}): {
  root: HTMLElement
  header: HTMLElement | null
  body: HTMLElement
} {
  const root = globalThis.document.createElement('section')
  root.className = `deadeye-panel${options.className ? ` ${options.className}` : ''}`

  let header: HTMLElement | null = null

  if (options.title) {
    header = globalThis.document.createElement('div')
    header.className = 'deadeye-panel__header'

    const title = globalThis.document.createElement('h3')
    title.className = 'deadeye-panel__title'
    title.textContent = options.title

    header.append(title)
    root.append(header)
  }

  const body = globalThis.document.createElement('div')
  body.className = 'deadeye-panel__body'
  root.append(body)

  return { root, header, body }
}
