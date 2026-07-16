import { getDialogService } from '../dialogs'
import {
  replaceInWorkspace,
  searchWorkspace,
  type SearchMatch,
  type WorkspaceSearchOptions,
} from './search-service'

export interface WorkspaceSearchPanelCallbacks {
  readonly onOpenMatch: (match: SearchMatch) => void
  readonly onSearchComplete: (matchCount: number) => void
  readonly onReplaceComplete: (replacementCount: number) => void
  readonly onError: (message: string) => void
}

export class WorkspaceSearchPanel {
  private readonly overlay: HTMLElement
  private readonly queryInput: HTMLInputElement
  private readonly replaceInput: HTMLInputElement
  private readonly filterInput: HTMLInputElement
  private readonly regexToggle: HTMLInputElement
  private readonly caseToggle: HTMLInputElement
  private readonly results: HTMLElement
  private readonly searchButton: HTMLButtonElement
  private readonly replaceButton: HTMLButtonElement
  private callbacks: WorkspaceSearchPanelCallbacks | null = null
  private workspaceRoot: string | null = null
  private visible = false

  constructor(container: HTMLElement) {
    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'search-overlay'
    this.overlay.hidden = true

    const panel = globalThis.document.createElement('div')
    panel.className = 'search-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'Workspace Search')

    this.queryInput = this.createInput('Search')
    this.replaceInput = this.createInput('Replace with')
    this.filterInput = this.createInput('File filter')

    const optionsRow = globalThis.document.createElement('div')
    optionsRow.className = 'search-options'

    this.regexToggle = this.createCheckbox('Regex')
    this.caseToggle = this.createCheckbox('Match case')
    optionsRow.append(this.regexToggle.parentElement!, this.caseToggle.parentElement!)

    const actions = globalThis.document.createElement('div')
    actions.className = 'search-actions'

    this.searchButton = globalThis.document.createElement('button')
    this.searchButton.type = 'button'
    this.searchButton.className = 'search-action-button'
    this.searchButton.textContent = 'Search'

    this.replaceButton = globalThis.document.createElement('button')
    this.replaceButton.type = 'button'
    this.replaceButton.className = 'search-action-button search-action-button--accent'
    this.replaceButton.textContent = 'Replace All'

    actions.append(this.searchButton, this.replaceButton)

    this.results = globalThis.document.createElement('div')
    this.results.className = 'search-results'

    panel.append(
      this.queryInput.parentElement!,
      this.replaceInput.parentElement!,
      this.filterInput.parentElement!,
      optionsRow,
      actions,
      this.results,
    )
    this.overlay.append(panel)
    container.append(this.overlay)

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.hide()
      }
    })

    this.searchButton.addEventListener('click', () => {
      void this.runSearch()
    })

    this.replaceButton.addEventListener('click', () => {
      void this.runReplace()
    })

    this.queryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hide()
      }

      if (event.key === 'Enter') {
        void this.runSearch()
      }
    })
  }

  show(workspaceRoot: string | null, callbacks: WorkspaceSearchPanelCallbacks): void {
    this.callbacks = callbacks
    this.workspaceRoot = workspaceRoot
    this.visible = true
    this.overlay.hidden = false
    this.results.replaceChildren()
    this.queryInput.focus()
  }

  hide(): void {
    this.visible = false
    this.overlay.hidden = true
    this.callbacks = null
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    this.overlay.remove()
  }

  private createInput(labelText: string): HTMLInputElement {
    const field = globalThis.document.createElement('label')
    field.className = 'search-field'

    const label = globalThis.document.createElement('span')
    label.className = 'search-field-label'
    label.textContent = labelText

    const input = globalThis.document.createElement('input')
    input.className = 'search-field-input'
    input.type = 'text'

    field.append(label, input)
    return input
  }

  private createCheckbox(labelText: string): HTMLInputElement {
    const field = globalThis.document.createElement('label')
    field.className = 'search-checkbox'

    const input = globalThis.document.createElement('input')
    input.type = 'checkbox'

    const label = globalThis.document.createElement('span')
    label.textContent = labelText

    field.append(input, label)
    return input
  }

  private getOptions(): WorkspaceSearchOptions {
    return {
      query: this.queryInput.value,
      replaceWith: this.replaceInput.value,
      useRegex: this.regexToggle.checked,
      caseSensitive: this.caseToggle.checked,
      fileFilter: this.filterInput.value,
    }
  }

  private async runSearch(): Promise<void> {
    if (!this.workspaceRoot) {
      this.callbacks?.onError('Open a workspace folder before searching.')
      return
    }

    const options = this.getOptions()
    if (!options.query.trim()) {
      return
    }

    try {
      const matches = await searchWorkspace(this.workspaceRoot, options)
      this.renderResults(matches)
      this.callbacks?.onSearchComplete(matches.length)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  private async runReplace(): Promise<void> {
    if (!this.workspaceRoot) {
      this.callbacks?.onError('Open a workspace folder before replacing.')
      return
    }

    const options = this.getOptions()
    if (!options.query.trim()) {
      return
    }

    const confirmed = await getDialogService().confirm({
      title: 'Replace All',
      message: `Replace all matches of "${options.query}" across the workspace?`,
      confirmLabel: 'Replace All',
      cancelLabel: 'Cancel',
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      const count = await replaceInWorkspace(this.workspaceRoot, options)
      this.callbacks?.onReplaceComplete(count)
      await this.runSearch()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  private renderResults(matches: readonly SearchMatch[]): void {
    this.results.replaceChildren()

    if (matches.length === 0) {
      const empty = globalThis.document.createElement('div')
      empty.className = 'search-results-empty'
      empty.textContent = 'No matches found.'
      this.results.append(empty)
      return
    }

    for (const match of matches) {
      const item = globalThis.document.createElement('button')
      item.type = 'button'
      item.className = 'search-result-item'

      const path = globalThis.document.createElement('span')
      path.className = 'search-result-path'
      path.textContent = `${match.filePath}:${match.line}:${match.column}`

      const preview = globalThis.document.createElement('span')
      preview.className = 'search-result-preview'
      preview.textContent = match.preview

      item.append(path, preview)

      item.addEventListener('click', () => {
        this.callbacks?.onOpenMatch(match)
      })

      this.results.append(item)
    }
  }
}
