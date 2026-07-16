import { getDialogService } from '../dialogs'
import type { WorkspaceManager } from '../workspace'
import { createUntitledDocumentOptions } from '../workspace/untitled-document'
import type { WorkspaceDocument } from '../workspace/document'
import type { DocumentId, WorkspaceUnsubscribe } from '../workspace/types'

export interface TabBarMountTarget {
  readonly container: HTMLElement
}

export interface TabBarElements {
  readonly root: HTMLElement
  readonly tabList: HTMLElement
  readonly newTabButton: HTMLButtonElement
}

/**
 * Tab bar UI — a read/write view over WorkspaceManager state.
 *
 * Tabs never own document content and never touch Monaco directly.
 * All actions delegate to WorkspaceManager APIs.
 */
export class TabBar {
  private readonly workspace: WorkspaceManager
  private readonly elements: TabBarElements
  private readonly unsubscribers: WorkspaceUnsubscribe[] = []
  private disposed = false

  constructor(workspace: WorkspaceManager, target: TabBarMountTarget) {
    this.workspace = workspace
    this.elements = this.mount(target.container)
  }

  initialize(): void {
    if (this.disposed) {
      throw new Error('Cannot initialize a disposed TabBar')
    }

    this.renderTabs()
    this.bindWorkspaceEvents()
    this.bindControls()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true

    for (const unsubscribe of this.unsubscribers) {
      unsubscribe()
    }

    this.unsubscribers.length = 0
    this.elements.root.replaceChildren()
  }

  private mount(container: HTMLElement): TabBarElements {
    container.className = 'tab-bar'
    container.innerHTML = `
      <div class="tab-bar-scroll">
        <div class="tab-list" role="tablist" aria-label="Open documents"></div>
      </div>
      <button
        class="tab-new-button"
        type="button"
        aria-label="New document"
        title="New document"
      >+</button>
    `

    const tabList = container.querySelector<HTMLElement>('.tab-list')
    const newTabButton = container.querySelector<HTMLButtonElement>('.tab-new-button')

    if (!tabList || !newTabButton) {
      throw new Error('Failed to mount tab bar: required elements are missing')
    }

    return {
      root: container,
      tabList,
      newTabButton,
    }
  }

  private bindWorkspaceEvents(): void {
    this.unsubscribers.push(
      this.workspace.onDidAddDocument(() => {
        this.renderTabs()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidRemoveDocument(() => {
        this.renderTabs()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeActiveDocument(() => {
        this.updateActiveTabState()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeDocumentDirtyState(() => {
        this.updateDirtyIndicators()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeDocumentPath(() => {
        this.renderTabs()
      }),
    )
  }

  private bindControls(): void {
    this.elements.newTabButton.addEventListener('click', this.handleNewTabClick)
    this.unsubscribers.push(() => {
      this.elements.newTabButton.removeEventListener('click', this.handleNewTabClick)
    })
  }

  private readonly handleNewTabClick = (): void => {
    if (this.disposed) {
      return
    }

    try {
      this.workspace.createDocument(createUntitledDocumentOptions(this.workspace))
    } catch (error) {
      console.error('[Deadeye Studio] Failed to create a new document:', error)
    }
  }

  private renderTabs(): void {
    const documents = this.workspace.getOpenDocuments()
    const activeDocumentId = this.workspace.getActiveDocumentId()

    this.elements.tabList.replaceChildren()
    this.elements.root.classList.toggle('tab-bar--empty', documents.length === 0)

    for (const workspaceDocument of documents) {
      const tab = this.createTabElement(workspaceDocument, {
        isActive: workspaceDocument.id === activeDocumentId,
        canClose: true,
      })
      this.elements.tabList.appendChild(tab)
    }
  }

  private createTabElement(
    workspaceDocument: WorkspaceDocument,
    state: { isActive: boolean; canClose: boolean },
  ): HTMLElement {
    const tab = globalThis.document.createElement('div')
    tab.className = 'tab-item'
    tab.dataset.documentId = workspaceDocument.id
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-selected', state.isActive ? 'true' : 'false')
    tab.setAttribute('aria-label', workspaceDocument.displayName)
    tab.tabIndex = state.isActive ? 0 : -1

    if (state.isActive) {
      tab.classList.add('tab-item--active')
    }

    const dirtyIndicator = globalThis.document.createElement('span')
    dirtyIndicator.className = 'tab-dirty-indicator'
    dirtyIndicator.setAttribute('aria-hidden', 'true')
    dirtyIndicator.hidden = !workspaceDocument.isDirty

    const label = globalThis.document.createElement('span')
    label.className = 'tab-label'
    label.textContent = workspaceDocument.displayName

    const closeButton = globalThis.document.createElement('button')
    closeButton.className = 'tab-close-button'
    closeButton.type = 'button'
    closeButton.setAttribute('aria-label', `Close ${workspaceDocument.displayName}`)
    closeButton.title = 'Close'
    closeButton.textContent = '×'
    closeButton.disabled = !state.canClose

    if (!state.canClose) {
      closeButton.classList.add('tab-close-button--disabled')
    }

    tab.append(dirtyIndicator, label, closeButton)

    tab.addEventListener('click', (event) => {
      this.handleTabActivate(workspaceDocument.id, event)
    })

    closeButton.addEventListener('click', (event) => {
      void this.handleTabClose(workspaceDocument.id, event)
    })

    return tab
  }

  private handleTabActivate(documentId: DocumentId, event: MouseEvent): void {
    if (this.disposed) {
      return
    }

    const target = event.target
    if (target instanceof HTMLElement && target.closest('.tab-close-button')) {
      return
    }

    try {
      this.workspace.setActiveDocument(documentId)
    } catch (error) {
      console.error('[Deadeye Studio] Failed to activate document tab:', error)
    }
  }

  private async handleTabClose(documentId: DocumentId, event: MouseEvent): Promise<void> {
    event.stopPropagation()

    if (this.disposed) {
      return
    }

    const document = this.workspace.getDocument(documentId)
    if (!document) {
      return
    }

    if (document.isDirty) {
      const confirmed = await getDialogService().confirm({
        title: 'Unsaved Changes',
        message: `"${document.displayName}" has unsaved changes. Close without saving?`,
        confirmLabel: 'Close',
        cancelLabel: 'Cancel',
        variant: 'danger',
      })

      if (!confirmed) {
        return
      }
    }

    try {
      this.workspace.removeDocument(documentId)
    } catch (error) {
      console.error('[Deadeye Studio] Failed to close document tab:', error)
    }
  }

  private updateActiveTabState(): void {
    const activeDocumentId = this.workspace.getActiveDocumentId()
    const tabs = this.elements.tabList.querySelectorAll<HTMLElement>('.tab-item')

    for (const tab of tabs) {
      const documentId = tab.dataset.documentId
      const isActive = documentId === activeDocumentId

      tab.classList.toggle('tab-item--active', isActive)
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
      tab.tabIndex = isActive ? 0 : -1
    }
  }

  private updateDirtyIndicators(): void {
    const tabs = this.elements.tabList.querySelectorAll<HTMLElement>('.tab-item')

    for (const tab of tabs) {
      const documentId = tab.dataset.documentId
      if (!documentId) {
        continue
      }

      const document = this.workspace.getDocument(documentId)
      const indicator = tab.querySelector<HTMLElement>('.tab-dirty-indicator')

      if (!document || !indicator) {
        continue
      }

      indicator.hidden = !document.isDirty
    }
  }
}
