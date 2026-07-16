import { getFileIconClass } from '../../shared/language-registry'
import { getFilesystemClient } from '../filesystem'
import type { FileSystemEntry } from '../../shared/filesystem'
import { getDialogService } from '../dialogs'
import { showContextMenu } from '../components/context-menu'
import { createNewTextFile } from '../workspace/new-text-file'
import type { WorkspaceManager } from '../workspace/workspace-manager'
import type { WorkspaceUnsubscribe } from '../workspace/types'

export interface FileExplorerMountTarget {
  readonly container: HTMLElement
}

interface DirectoryLoadState {
  readonly entries: FileSystemEntry[]
  readonly loaded: boolean
  readonly loading: boolean
  readonly error: string | null
}

/**
 * Sidebar file explorer — UI over workspace root and filesystem bridge.
 * File opens always delegate to WorkspaceManager.openDocument().
 */
export class FileExplorer {
  private readonly workspace: WorkspaceManager
  private readonly elements: {
    root: HTMLElement
    header: HTMLElement
    rootLabel: HTMLElement
    openFolderButton: HTMLButtonElement
    newFileButton: HTMLButtonElement
    refreshButton: HTMLButtonElement
    renameButton: HTMLButtonElement
    deleteButton: HTMLButtonElement
    treeContainer: HTMLElement
    emptyState: HTMLElement
  }

  private readonly expandedDirectories = new Set<string>()
  private readonly directoryState = new Map<string, DirectoryLoadState>()
  private readonly unsubscribers: WorkspaceUnsubscribe[] = []
  private selectedFilePath: string | null = null
  private disposed = false

  constructor(workspace: WorkspaceManager, target: FileExplorerMountTarget) {
    this.workspace = workspace
    this.elements = this.mount(target.container)
  }

  initialize(): void {
    if (this.disposed) {
      throw new Error('Cannot initialize a disposed FileExplorer')
    }

    this.render()
    this.bindControls()

    this.unsubscribers.push(
      this.workspace.onDidChangeWorkspaceRoot((snapshot) => {
        this.expandedDirectories.clear()
        this.directoryState.clear()

        if (snapshot.path) {
          this.expandedDirectories.add(snapshot.path)
        }

        this.render()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeActiveDocument(() => {
        this.updateActiveFileHighlight()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidRequestExplorerRefresh(() => {
        this.refresh()
      }),
    )
  }

  refresh(): void {
    if (this.disposed) {
      return
    }

    this.directoryState.clear()
    this.render()
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

  private mount(container: HTMLElement): FileExplorer['elements'] {
    container.className = 'file-explorer'
    container.innerHTML = `
      <div class="file-explorer-header">
        <div class="file-explorer-title">Explorer</div>
        <button
          class="file-explorer-open-folder"
          type="button"
          aria-label="Open folder"
          title="Open folder"
        >Open Folder</button>
      </div>
      <div class="file-explorer-toolbar">
        <button
          class="file-explorer-action"
          type="button"
          data-action="new-file"
          aria-label="New Text File"
          title="New Text File"
        >+</button>
        <button
          class="file-explorer-action"
          type="button"
          data-action="refresh"
          aria-label="Refresh explorer"
          title="Refresh"
        >↻</button>
        <button
          class="file-explorer-action"
          type="button"
          data-action="rename"
          aria-label="Rename file"
          title="Rename"
        >✎</button>
        <button
          class="file-explorer-action"
          type="button"
          data-action="delete"
          aria-label="Delete file"
          title="Delete"
        >×</button>
      </div>
      <div class="file-explorer-root-label" id="explorer-root-label">No folder open</div>
      <div class="file-explorer-tree" role="tree" aria-label="Workspace files"></div>
      <div class="file-explorer-empty" id="explorer-empty-state" hidden>
        Open a folder to browse project files.
      </div>
    `

    const header = container.querySelector<HTMLElement>('.file-explorer-header')
    const rootLabel = container.querySelector<HTMLElement>('#explorer-root-label')
    const openFolderButton = container.querySelector<HTMLButtonElement>('.file-explorer-open-folder')
    const newFileButton = container.querySelector<HTMLButtonElement>('[data-action="new-file"]')
    const refreshButton = container.querySelector<HTMLButtonElement>('[data-action="refresh"]')
    const renameButton = container.querySelector<HTMLButtonElement>('[data-action="rename"]')
    const deleteButton = container.querySelector<HTMLButtonElement>('[data-action="delete"]')
    const treeContainer = container.querySelector<HTMLElement>('.file-explorer-tree')
    const emptyState = container.querySelector<HTMLElement>('#explorer-empty-state')

    if (
      !header ||
      !rootLabel ||
      !openFolderButton ||
      !newFileButton ||
      !refreshButton ||
      !renameButton ||
      !deleteButton ||
      !treeContainer ||
      !emptyState
    ) {
      throw new Error('Failed to mount file explorer: required elements are missing')
    }

    return {
      root: container,
      header,
      rootLabel,
      openFolderButton,
      newFileButton,
      refreshButton,
      renameButton,
      deleteButton,
      treeContainer,
      emptyState,
    }
  }

  private bindControls(): void {
    this.bindButton(this.elements.openFolderButton, this.handleOpenFolderClick)
    this.bindButton(this.elements.newFileButton, this.handleNewTextFileClick)
    this.bindButton(this.elements.refreshButton, this.handleRefreshClick)
    this.bindButton(this.elements.renameButton, this.handleRenameClick)
    this.bindButton(this.elements.deleteButton, this.handleDeleteClick)
    this.bindExplorerContextMenu()
    this.updateToolbarState()
  }

  private bindButton(button: HTMLButtonElement, handler: () => void | Promise<void>): void {
    const listener = (): void => {
      void handler()
    }

    button.addEventListener('click', listener)
    this.unsubscribers.push(() => {
      button.removeEventListener('click', listener)
    })
  }

  private readonly handleOpenFolderClick = async (): Promise<void> => {
    if (this.disposed) {
      return
    }

    try {
      await this.workspace.openWorkspaceRootFromDialog()
      this.updateToolbarState()
    } catch (error) {
      console.error('[Deadeye Studio] Failed to open workspace folder:', error)
      this.showTreeMessage('Unable to open folder. Check console for details.')
    }
  }

  private readonly handleNewTextFileClick = (): void => {
    if (this.disposed) {
      return
    }

    try {
      const document = createNewTextFile(this.workspace)
      this.selectedFilePath = document.filePath
      this.updateSelectionHighlight()
      this.updateToolbarState()
    } catch (error) {
      console.error('[Deadeye Studio] Failed to create text file:', error)
      void getDialogService().alert({
        title: 'Create File Failed',
        message: 'Unable to create text file. Check console for details.',
      })
    }
  }

  private bindExplorerContextMenu(): void {
    const onContextMenu = (event: MouseEvent): void => {
      if (this.disposed) {
        return
      }

      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target.closest('.tree-item--file, .tree-item--directory')) {
        return
      }

      event.preventDefault()
      showContextMenu(event.clientX, event.clientY, [
        {
          label: 'New Text File',
          onClick: () => this.handleNewTextFileClick(),
        },
      ])
    }

    this.elements.treeContainer.addEventListener('contextmenu', onContextMenu)
    this.elements.emptyState.addEventListener('contextmenu', onContextMenu)
    this.unsubscribers.push(() => {
      this.elements.treeContainer.removeEventListener('contextmenu', onContextMenu)
      this.elements.emptyState.removeEventListener('contextmenu', onContextMenu)
    })
  }

  private readonly handleRefreshClick = (): void => {
    if (this.disposed) {
      return
    }

    this.refresh()
  }

  private readonly handleRenameClick = async (): Promise<void> => {
    if (this.disposed || !this.selectedFilePath) {
      return
    }

    const currentName = this.selectedFilePath.split('/').pop() ?? ''
    const newName = await getDialogService().prompt({
      title: 'Rename File',
      message: 'Enter a new file name.',
      defaultValue: currentName,
    })

    if (!newName?.trim() || newName.trim() === currentName) {
      return
    }

    const oldPath = this.selectedFilePath

    try {
      const openDocument = await this.workspace.renameWorkspaceFile(oldPath, newName.trim())
      const parentDirectory = oldPath.split('/').slice(0, -1).join('/')
      this.selectedFilePath = openDocument?.filePath ?? `${parentDirectory}/${newName.trim()}`
      this.updateSelectionHighlight()
      this.updateToolbarState()
    } catch (error) {
      console.error('[Deadeye Studio] Failed to rename workspace file:', error)
      await getDialogService().alert({
        title: 'Rename Failed',
        message: 'Unable to rename file. Check console for details.',
      })
    }
  }

  private readonly handleDeleteClick = async (): Promise<void> => {
    if (this.disposed || !this.selectedFilePath) {
      return
    }

    const fileName = this.selectedFilePath.split('/').pop() ?? this.selectedFilePath
    const confirmed = await getDialogService().confirm({
      title: 'Delete File',
      message: `Delete "${fileName}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    const deletedPath = this.selectedFilePath

    try {
      await this.workspace.deleteWorkspaceFile(deletedPath)
      this.selectedFilePath = null
      this.updateSelectionHighlight()
      this.updateToolbarState()
    } catch (error) {
      console.error('[Deadeye Studio] Failed to delete workspace file:', error)
      await getDialogService().alert({
        title: 'Delete Failed',
        message: 'Unable to delete file. Check console for details.',
      })
    }
  }

  private render(): void {
    const rootSnapshot = this.workspace.getWorkspaceRootSnapshot()

    if (!rootSnapshot.isOpen || !rootSnapshot.path) {
      this.selectedFilePath = null
      this.elements.rootLabel.textContent = 'No folder open'
      this.elements.emptyState.hidden = false
      this.elements.treeContainer.replaceChildren()
      this.updateToolbarState()
      return
    }

    this.elements.rootLabel.textContent = rootSnapshot.name ?? rootSnapshot.path
    this.elements.emptyState.hidden = true
    this.renderDirectoryTree(rootSnapshot.path, 0)
  }

  private renderDirectoryTree(directoryPath: string, depth: number): void {
    if (depth === 0) {
      this.elements.treeContainer.replaceChildren()
    }

    const state = this.directoryState.get(directoryPath)
    const isExpanded = this.expandedDirectories.has(directoryPath)

    const directoryItem = this.createDirectoryNode(directoryPath, depth, isExpanded, state)
    this.elements.treeContainer.appendChild(directoryItem)

    if (!isExpanded) {
      return
    }

    if (state?.loading) {
      this.elements.treeContainer.appendChild(this.createMessageNode('Loading...', depth + 1))
      return
    }

    if (state?.error) {
      this.elements.treeContainer.appendChild(this.createMessageNode(state.error, depth + 1))
      return
    }

    if (!state?.loaded) {
      void this.loadDirectory(directoryPath, depth)
      return
    }

    if (state.entries.length === 0) {
      this.elements.treeContainer.appendChild(
        this.createMessageNode('Empty folder', depth + 1),
      )
      return
    }

    for (const entry of state.entries) {
      if (entry.kind === 'directory') {
        this.renderNestedDirectory(entry.path, depth + 1)
        continue
      }

      this.elements.treeContainer.appendChild(this.createFileNode(entry, depth + 1))
    }
  }

  private renderNestedDirectory(directoryPath: string, depth: number): void {
    const state = this.directoryState.get(directoryPath)
    const isExpanded = this.expandedDirectories.has(directoryPath)

    this.elements.treeContainer.appendChild(
      this.createDirectoryNode(directoryPath, depth, isExpanded, state),
    )

    if (!isExpanded) {
      return
    }

    if (state?.loading) {
      this.elements.treeContainer.appendChild(this.createMessageNode('Loading...', depth + 1))
      return
    }

    if (state?.error) {
      this.elements.treeContainer.appendChild(this.createMessageNode(state.error, depth + 1))
      return
    }

    if (!state?.loaded) {
      void this.loadDirectory(directoryPath, depth)
      return
    }

    if (state.entries.length === 0) {
      this.elements.treeContainer.appendChild(
        this.createMessageNode('Empty folder', depth + 1),
      )
      return
    }

    for (const entry of state.entries) {
      if (entry.kind === 'directory') {
        this.renderNestedDirectory(entry.path, depth + 1)
        continue
      }

      this.elements.treeContainer.appendChild(this.createFileNode(entry, depth + 1))
    }
  }

  private createDirectoryNode(
    directoryPath: string,
    depth: number,
    isExpanded: boolean,
    state: DirectoryLoadState | undefined,
  ): HTMLElement {
    const name = directoryPath.split('/').pop() ?? directoryPath
    const item = globalThis.document.createElement('div')
    item.className = 'tree-item tree-item--directory'
    item.style.paddingLeft = `${depth * 14 + 8}px`
    item.setAttribute('role', 'treeitem')
    item.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
    item.dataset.path = directoryPath
    item.dataset.kind = 'directory'

    const twistie = globalThis.document.createElement('span')
    twistie.className = 'tree-twistie'
    twistie.textContent = isExpanded ? '▾' : '▸'

    const icon = globalThis.document.createElement('span')
    icon.className = `tree-icon tree-icon--directory${isExpanded ? ' tree-icon--directory-open' : ''}`
    icon.setAttribute('aria-hidden', 'true')

    const label = globalThis.document.createElement('span')
    label.className = 'tree-label'
    label.textContent = name

    item.append(twistie, icon, label)

    if (state?.loading) {
      item.classList.add('tree-item--loading')
    }

    item.addEventListener('click', () => {
      this.selectedFilePath = null
      this.updateSelectionHighlight()
      this.updateToolbarState()
      void this.toggleDirectory(directoryPath, depth)
    })

    return item
  }

  private createFileNode(entry: FileSystemEntry, depth: number): HTMLElement {
    const item = globalThis.document.createElement('div')
    item.className = 'tree-item tree-item--file'
    item.style.paddingLeft = `${depth * 14 + 8}px`
    item.setAttribute('role', 'treeitem')
    item.dataset.path = entry.path
    item.dataset.kind = 'file'

    const twistie = globalThis.document.createElement('span')
    twistie.className = 'tree-twistie tree-twistie--spacer'
    twistie.textContent = ' '

    const icon = globalThis.document.createElement('span')
    icon.className = `tree-icon ${getFileIconClass(entry.path)}`
    icon.setAttribute('aria-hidden', 'true')
    icon.title = entry.name

    const label = globalThis.document.createElement('span')
    label.className = 'tree-label'
    label.textContent = entry.name

    item.append(twistie, icon, label)

    item.addEventListener('click', () => {
      this.selectedFilePath = entry.path
      this.updateSelectionHighlight()
      this.updateToolbarState()
      void this.handleFileOpen(entry.path)
    })

    this.applyFileItemState(item, entry.path)
    return item
  }

  private createMessageNode(message: string, depth: number): HTMLElement {
    const item = globalThis.document.createElement('div')
    item.className = 'tree-item tree-item--message'
    item.style.paddingLeft = `${depth * 14 + 8}px`
    item.textContent = message
    return item
  }

  private showTreeMessage(message: string): void {
    this.elements.treeContainer.replaceChildren(this.createMessageNode(message, 0))
  }

  private async toggleDirectory(directoryPath: string, depth: number): Promise<void> {
    if (this.expandedDirectories.has(directoryPath)) {
      this.expandedDirectories.delete(directoryPath)
    } else {
      this.expandedDirectories.add(directoryPath)
    }

    const rootPath = this.workspace.getWorkspaceRootSnapshot().path
    if (!rootPath) {
      return
    }

    if (directoryPath === rootPath) {
      this.render()
      return
    }

    this.render()
  }

  private async loadDirectory(directoryPath: string, depth: number): Promise<void> {
    const existing = this.directoryState.get(directoryPath)
    if (existing?.loaded || existing?.loading) {
      return
    }

    this.directoryState.set(directoryPath, {
      entries: [],
      loaded: false,
      loading: true,
      error: null,
    })
    this.render()

    try {
      const result = await getFilesystemClient().readDirectory(directoryPath)
      this.directoryState.set(directoryPath, {
        entries: [...result.entries],
        loaded: true,
        loading: false,
        error: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.directoryState.set(directoryPath, {
        entries: [],
        loaded: false,
        loading: false,
        error: message,
      })
    }

    this.render()
  }

  private async handleFileOpen(filePath: string): Promise<void> {
    if (this.disposed) {
      return
    }

    try {
      await this.workspace.openDocument(filePath)
      this.updateActiveFileHighlight()
    } catch (error) {
      console.error('[Deadeye Studio] Failed to open file:', error)
    }
  }

  private updateActiveFileHighlight(): void {
    const fileItems = this.elements.treeContainer.querySelectorAll<HTMLElement>('.tree-item--file')

    for (const item of fileItems) {
      this.applyFileItemState(item, item.dataset.path ?? '')
    }
  }

  private updateSelectionHighlight(): void {
    const fileItems = this.elements.treeContainer.querySelectorAll<HTMLElement>('.tree-item--file')

    for (const item of fileItems) {
      const itemPath = item.dataset.path ?? ''
      item.classList.toggle('tree-item--selected', itemPath === this.selectedFilePath)
    }
  }

  private updateToolbarState(): void {
    const workspaceOpen = this.workspace.getWorkspaceRootSnapshot().isOpen
    const hasFileSelection = Boolean(this.selectedFilePath)

    this.elements.newFileButton.disabled = false
    this.elements.refreshButton.disabled = !workspaceOpen
    this.elements.renameButton.disabled = !workspaceOpen || !hasFileSelection
    this.elements.deleteButton.disabled = !workspaceOpen || !hasFileSelection
  }

  private applyFileItemState(item: HTMLElement, itemPath: string): void {
    const activePath = this.workspace.getActiveDocument()?.filePath ?? null
    const isActive = Boolean(activePath && itemPath === activePath)
    const isSelected = itemPath === this.selectedFilePath

    item.classList.toggle('tree-item--active', isActive)
    item.classList.toggle('tree-item--selected', isSelected)
  }
}
