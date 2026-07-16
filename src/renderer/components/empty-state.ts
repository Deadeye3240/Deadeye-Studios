export interface EmptyStateOptions {
  readonly title: string
  readonly body?: string
}

export function createEmptyState(options: EmptyStateOptions): HTMLElement {
  const root = globalThis.document.createElement('div')
  root.className = 'deadeye-empty-state'

  const title = globalThis.document.createElement('div')
  title.className = 'deadeye-empty-state__title'
  title.textContent = options.title

  root.append(title)

  if (options.body) {
    const body = globalThis.document.createElement('div')
    body.className = 'deadeye-empty-state__body'
    body.textContent = options.body
    root.append(body)
  }

  return root
}
