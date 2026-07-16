import { basename, dirname } from '../workspace/path-utils'

export class BreadcrumbsBar {
  private readonly root: HTMLElement

  constructor(container: HTMLElement) {
    this.root = globalThis.document.createElement('nav')
    this.root.className = 'breadcrumbs-bar'
    this.root.setAttribute('aria-label', 'Breadcrumb')
    container.append(this.root)
  }

  update(filePath: string | null, workspaceRoot: string | null): void {
    this.root.replaceChildren()

    if (!filePath) {
      this.root.hidden = true
      return
    }

    this.root.hidden = false

    const segments = buildSegments(filePath, workspaceRoot)
    for (const [index, segment] of segments.entries()) {
      if (index > 0) {
        const separator = globalThis.document.createElement('span')
        separator.className = 'breadcrumbs-bar__separator'
        separator.setAttribute('aria-hidden', 'true')
        separator.textContent = '›'
        this.root.append(separator)
      }

      const crumb = globalThis.document.createElement('span')
      crumb.className = 'breadcrumbs-bar__segment'
      if (index === segments.length - 1) {
        crumb.classList.add('breadcrumbs-bar__segment--current')
      }

      crumb.textContent = segment
      this.root.append(crumb)
    }
  }

  dispose(): void {
    this.root.remove()
  }
}

function buildSegments(filePath: string, workspaceRoot: string | null): string[] {
  if (workspaceRoot && filePath.startsWith(workspaceRoot)) {
    const relative = filePath.slice(workspaceRoot.length).replace(/^[/\\]+/, '')
    if (!relative) {
      return [basename(workspaceRoot)]
    }

    return relative.split(/[/\\]/).filter(Boolean)
  }

  const parts = filePath.split(/[/\\]/).filter(Boolean)
  if (parts.length <= 4) {
    return parts
  }

  const parent = dirname(filePath)
  return ['…', basename(parent), basename(filePath)]
}
