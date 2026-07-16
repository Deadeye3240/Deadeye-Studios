import { WorkspaceDocument } from './document'
import { getFilesystemClient } from '../filesystem'
import {
  detectLanguageFromPath,
  isDiskFilePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
} from './path-utils'
import { createStarterDocumentOptions } from './starter-document'
import { WorkspaceRoot } from './workspace-root'
import type {
  ActiveDocumentChangeListener,
  CreateDocumentOptions,
  DocumentAddedListener,
  DocumentId,
  DocumentRemovedListener,
  ExplorerRefreshListener,
  WorkspaceRootChangeListener,
  WorkspaceRootSnapshot,
  WorkspaceState,
  WorkspaceUnsubscribe,
} from './types'
import type { FileWatchEvent } from '../../shared/filesystem'

export class WorkspaceManager {
  private readonly documents = new Map<DocumentId, WorkspaceDocument>()
  private readonly documentUnsubscribers = new Map<DocumentId, WorkspaceUnsubscribe>()
  private readonly workspaceRoot = new WorkspaceRoot()
  private activeDocumentId: DocumentId | null = null

  private readonly activeDocumentListeners = new Set<ActiveDocumentChangeListener>()
  private readonly documentAddedListeners = new Set<DocumentAddedListener>()
  private readonly documentRemovedListeners = new Set<DocumentRemovedListener>()
  private readonly documentDirtyListeners = new Set<(document: WorkspaceDocument) => void>()
  private readonly documentPathListeners = new Set<(document: WorkspaceDocument) => void>()
  private readonly documentExternalUpdateListeners = new Set<(document: WorkspaceDocument) => void>()
  private readonly workspaceRootListeners = new Set<WorkspaceRootChangeListener>()
  private readonly explorerRefreshListeners = new Set<ExplorerRefreshListener>()
  private fileWatchUnsubscribe: WorkspaceUnsubscribe | null = null

  static createWithStarterDocument(): WorkspaceManager {
    const workspace = new WorkspaceManager()
    workspace.createDocument(createStarterDocumentOptions())
    workspace.bindFileWatcher()
    return workspace
  }

  static createEmpty(): WorkspaceManager {
    const workspace = new WorkspaceManager()
    workspace.bindFileWatcher()
    return workspace
  }

  createDocument(options: CreateDocumentOptions): WorkspaceDocument {
    const normalizedPath = normalizeWorkspacePath(options.filePath)

    if (this.getDocumentByPath(normalizedPath)) {
      throw new Error(`A document is already open for path: ${normalizedPath}`)
    }

    const document = new WorkspaceDocument({
      ...options,
      filePath: normalizedPath,
    })

    this.documents.set(document.id, document)
    this.bindDocumentDirtyForwarding(document)
    this.emitDocumentAdded(document)

    const shouldActivate = options.activate ?? this.documents.size === 1
    if (shouldActivate) {
      this.setActiveDocument(document.id)
    }

    return document
  }

  async openDocument(filePath: string): Promise<WorkspaceDocument> {
    const normalizedPath = normalizeWorkspacePath(filePath)
    const existingDocument = this.getDocumentByPath(normalizedPath)

    if (existingDocument) {
      this.setActiveDocument(existingDocument.id)
      return existingDocument
    }

    const filesystem = getFilesystemClient()
    const fileResult = await filesystem.readFile(normalizedPath)
    const language = detectLanguageFromPath(normalizedPath)

    return this.createDocument({
      filePath: fileResult.path,
      language,
      content: fileResult.content,
      activate: true,
    })
  }

  async saveActiveDocument(): Promise<WorkspaceDocument | null> {
    const activeDocument = this.getActiveDocument()
    if (!activeDocument) {
      return null
    }

    return this.saveDocument(activeDocument.id)
  }

  async saveActiveDocumentAs(): Promise<WorkspaceDocument | null> {
    const activeDocument = this.getActiveDocument()
    if (!activeDocument) {
      return null
    }

    return this.saveDocumentAs(activeDocument.id)
  }

  async saveAllDocuments(): Promise<number> {
    let savedCount = 0

    for (const document of this.getOpenDocuments()) {
      if (!document.isDirty) {
        continue
      }

      const saved = await this.saveDocument(document.id)
      if (saved) {
        savedCount += 1
      }
    }

    return savedCount
  }

  async saveDocument(documentId: DocumentId): Promise<WorkspaceDocument | null> {
    const document = this.getDocument(documentId)
    if (!document) {
      throw new Error(`Cannot save unknown document: ${documentId}`)
    }

    if (document.isUntitled || !document.isDiskBacked) {
      return this.saveDocumentAs(documentId)
    }

    const filesystem = getFilesystemClient()
    await filesystem.writeFile(document.filePath, document.content)
    document.markClean()
    this.requestExplorerRefresh()
    return document
  }

  async saveDocumentAs(documentId: DocumentId): Promise<WorkspaceDocument | null> {
    const document = this.getDocument(documentId)
    if (!document) {
      throw new Error(`Cannot save unknown document: ${documentId}`)
    }

    const filesystem = getFilesystemClient()
    const workspaceRoot = this.getWorkspaceRootSnapshot().path

    const dialogResult = await filesystem.saveFileDialog({
      defaultPath: document.isDiskBacked ? document.filePath : workspaceRoot ?? undefined,
      defaultFilename: document.isUntitled ? document.displayName : undefined,
    })

    if (dialogResult.canceled || !dialogResult.path) {
      return null
    }

    const targetPath = normalizeWorkspacePath(dialogResult.path)
    const existingDocument = this.getDocumentByPath(targetPath)

    await filesystem.writeFile(targetPath, document.content)

    if (existingDocument && existingDocument.id !== document.id) {
      existingDocument.replaceContent(document.content, { markClean: true })
      this.setActiveDocument(existingDocument.id)
      this.requestExplorerRefresh()
      return existingDocument
    }

    document.reassignPath(targetPath)
    document.setLanguage(detectLanguageFromPath(targetPath))
    document.markClean()
    this.emitDocumentPathChanged(document)
    this.requestExplorerRefresh()
    return document
  }

  async createWorkspaceFile(fileName: string, content = ''): Promise<WorkspaceDocument> {
    const workspaceRoot = this.getWorkspaceRootSnapshot().path

    if (!workspaceRoot) {
      throw new Error('Open a workspace folder before creating files')
    }

    const targetPath = joinWorkspacePath(workspaceRoot, fileName)
    const filesystem = getFilesystemClient()
    await filesystem.createFile(targetPath, content)
    this.requestExplorerRefresh()
    return this.openDocument(targetPath)
  }

  async renameWorkspaceFile(oldPath: string, newName: string): Promise<WorkspaceDocument | null> {
    const normalizedOldPath = normalizeWorkspacePath(oldPath)
    const parentDirectory = normalizedOldPath.split('/').slice(0, -1).join('/')
    const normalizedNewPath = normalizeWorkspacePath(`${parentDirectory}/${newName}`)

    if (!isDiskFilePath(normalizedOldPath)) {
      throw new Error('Only workspace files can be renamed')
    }

    const filesystem = getFilesystemClient()
    await filesystem.renameFile(normalizedOldPath, normalizedNewPath)

    const openDocument = this.getDocumentByPath(normalizedOldPath)
    if (openDocument) {
      openDocument.reassignPath(normalizedNewPath)
      openDocument.setLanguage(detectLanguageFromPath(normalizedNewPath))
      this.emitDocumentPathChanged(openDocument)
    }

    this.requestExplorerRefresh()
    return openDocument
  }

  async deleteWorkspaceFile(filePath: string): Promise<void> {
    const normalizedPath = normalizeWorkspacePath(filePath)

    if (!isDiskFilePath(normalizedPath)) {
      throw new Error('Only workspace files can be deleted')
    }

    const openDocument = this.getDocumentByPath(normalizedPath)
    if (openDocument) {
      if (this.documents.size <= 1) {
        throw new Error('Cannot delete the only open document')
      }

      this.removeDocument(openDocument.id)
    }

    const filesystem = getFilesystemClient()
    await filesystem.deleteFile(normalizedPath)
    this.requestExplorerRefresh()
  }

  async handleExternalFileChange(event: FileWatchEvent): Promise<void> {
    if (event.type === 'unlink' || event.type === 'unlinkDir') {
      this.requestExplorerRefresh()
      return
    }

    const normalizedPath = normalizeWorkspacePath(event.path)
    const openDocument = this.getDocumentByPath(normalizedPath)

    if (!openDocument) {
      this.requestExplorerRefresh()
      return
    }

    if (openDocument.isDirty) {
      return
    }

    try {
      const filesystem = getFilesystemClient()
      const fileResult = await filesystem.readFile(normalizedPath)
      openDocument.replaceContent(fileResult.content, { markClean: true })
      this.emitDocumentExternallyUpdated(openDocument)
    } catch (error) {
      console.error('[Deadeye Studio] Failed to apply external file change:', error)
    }

    this.requestExplorerRefresh()
  }

  async openWorkspaceRootFromDialog(): Promise<WorkspaceRootSnapshot | null> {
    const filesystem = getFilesystemClient()
    const dialogResult = await filesystem.openFolderDialog()

    if (dialogResult.canceled || !dialogResult.path) {
      return this.getWorkspaceRootSnapshot()
    }

    return this.openWorkspaceRoot(dialogResult.path)
  }

  async openWorkspaceRoot(rootPath: string): Promise<WorkspaceRootSnapshot> {
    const normalizedPath = normalizeWorkspacePath(rootPath)
    const filesystem = getFilesystemClient()

    this.workspaceRoot.open(normalizedPath)
    await filesystem.syncWorkspaceRoot(normalizedPath)
    this.emitWorkspaceRootChanged()
    this.requestExplorerRefresh()

    return this.getWorkspaceRootSnapshot()
  }

  async closeWorkspaceRoot(): Promise<void> {
    if (!this.workspaceRoot.isOpen) {
      return
    }

    this.workspaceRoot.close()
    await getFilesystemClient().syncWorkspaceRoot(null)
    this.emitWorkspaceRootChanged()
    this.requestExplorerRefresh()
  }

  getWorkspaceRoot(): WorkspaceRoot {
    return this.workspaceRoot
  }

  getWorkspaceRootSnapshot(): WorkspaceRootSnapshot {
    return this.workspaceRoot.toSnapshot()
  }

  requestExplorerRefresh(): void {
    for (const listener of this.explorerRefreshListeners) {
      listener()
    }
  }

  removeDocument(documentId: DocumentId): void {
    const document = this.documents.get(documentId)

    if (!document) {
      throw new Error(`Cannot remove unknown document: ${documentId}`)
    }

    const wasActive = this.activeDocumentId === documentId

    this.unbindDocumentDirtyForwarding(documentId)
    this.documents.delete(documentId)
    this.emitDocumentRemoved(documentId)

    if (wasActive) {
      const fallbackDocument = this.documents.values().next().value ?? null
      this.activeDocumentId = fallbackDocument?.id ?? null
      this.emitActiveDocumentChanged(fallbackDocument)
    }
  }

  setActiveDocument(documentId: DocumentId): void {
    const document = this.documents.get(documentId)

    if (!document) {
      throw new Error(`Cannot activate unknown document: ${documentId}`)
    }

    if (this.activeDocumentId === documentId) {
      return
    }

    this.activeDocumentId = documentId
    this.emitActiveDocumentChanged(document)
  }

  getActiveDocument(): WorkspaceDocument | null {
    if (!this.activeDocumentId) {
      return null
    }

    return this.documents.get(this.activeDocumentId) ?? null
  }

  getActiveDocumentId(): DocumentId | null {
    return this.activeDocumentId
  }

  getDocument(documentId: DocumentId): WorkspaceDocument | null {
    return this.documents.get(documentId) ?? null
  }

  getDocumentByPath(filePath: string): WorkspaceDocument | null {
    const normalizedPath = normalizeWorkspacePath(filePath)

    for (const document of this.documents.values()) {
      if (normalizeWorkspacePath(document.filePath) === normalizedPath) {
        return document
      }
    }

    return null
  }

  getOpenDocuments(): readonly WorkspaceDocument[] {
    return Array.from(this.documents.values())
  }

  hasDocument(documentId: DocumentId): boolean {
    return this.documents.has(documentId)
  }

  getWorkspaceState(): WorkspaceState {
    const documents = this.getOpenDocuments().map((document) => document.toSnapshot())
    const activeDocument = this.getActiveDocument()

    return {
      activeDocumentId: this.activeDocumentId,
      openDocumentCount: documents.length,
      activeDocument: activeDocument?.toSnapshot() ?? null,
      documents,
      workspaceRoot: this.getWorkspaceRootSnapshot(),
    }
  }

  onDidChangeActiveDocument(listener: ActiveDocumentChangeListener): WorkspaceUnsubscribe {
    this.activeDocumentListeners.add(listener)
    return () => {
      this.activeDocumentListeners.delete(listener)
    }
  }

  onDidAddDocument(listener: DocumentAddedListener): WorkspaceUnsubscribe {
    this.documentAddedListeners.add(listener)
    return () => {
      this.documentAddedListeners.delete(listener)
    }
  }

  onDidRemoveDocument(listener: DocumentRemovedListener): WorkspaceUnsubscribe {
    this.documentRemovedListeners.add(listener)
    return () => {
      this.documentRemovedListeners.delete(listener)
    }
  }

  onDidChangeDocumentDirtyState(
    listener: (document: WorkspaceDocument) => void,
  ): WorkspaceUnsubscribe {
    this.documentDirtyListeners.add(listener)
    return () => {
      this.documentDirtyListeners.delete(listener)
    }
  }

  onDidChangeDocumentPath(listener: (document: WorkspaceDocument) => void): WorkspaceUnsubscribe {
    this.documentPathListeners.add(listener)
    return () => {
      this.documentPathListeners.delete(listener)
    }
  }

  onDidExternallyUpdateDocument(
    listener: (document: WorkspaceDocument) => void,
  ): WorkspaceUnsubscribe {
    this.documentExternalUpdateListeners.add(listener)
    return () => {
      this.documentExternalUpdateListeners.delete(listener)
    }
  }

  onDidChangeWorkspaceRoot(listener: WorkspaceRootChangeListener): WorkspaceUnsubscribe {
    this.workspaceRootListeners.add(listener)
    return () => {
      this.workspaceRootListeners.delete(listener)
    }
  }

  onDidRequestExplorerRefresh(listener: ExplorerRefreshListener): WorkspaceUnsubscribe {
    this.explorerRefreshListeners.add(listener)
    return () => {
      this.explorerRefreshListeners.delete(listener)
    }
  }

  dispose(): void {
    this.fileWatchUnsubscribe?.()
    this.fileWatchUnsubscribe = null

    for (const documentId of this.documentUnsubscribers.keys()) {
      this.unbindDocumentDirtyForwarding(documentId)
    }

    this.documents.clear()
    this.activeDocumentId = null
    this.workspaceRoot.close()
    void getFilesystemClient().syncWorkspaceRoot(null)
    this.activeDocumentListeners.clear()
    this.documentAddedListeners.clear()
    this.documentRemovedListeners.clear()
    this.documentDirtyListeners.clear()
    this.documentPathListeners.clear()
    this.documentExternalUpdateListeners.clear()
    this.workspaceRootListeners.clear()
    this.explorerRefreshListeners.clear()
  }

  private bindFileWatcher(): void {
    const filesystem = getFilesystemClient()
    this.fileWatchUnsubscribe = filesystem.onFileChanged((event) => {
      void this.handleExternalFileChange(event)
    })
  }

  private bindDocumentDirtyForwarding(document: WorkspaceDocument): void {
    const unsubscribe = document.onDidChangeDirtyState(() => {
      this.emitDocumentDirtyChanged(document)
    })

    this.documentUnsubscribers.set(document.id, unsubscribe)
  }

  private unbindDocumentDirtyForwarding(documentId: DocumentId): void {
    const unsubscribe = this.documentUnsubscribers.get(documentId)
    unsubscribe?.()
    this.documentUnsubscribers.delete(documentId)
  }

  private emitActiveDocumentChanged(document: WorkspaceDocument | null): void {
    for (const listener of this.activeDocumentListeners) {
      listener(document)
    }
  }

  private emitDocumentAdded(document: WorkspaceDocument): void {
    for (const listener of this.documentAddedListeners) {
      listener(document)
    }
  }

  private emitDocumentRemoved(documentId: DocumentId): void {
    for (const listener of this.documentRemovedListeners) {
      listener(documentId)
    }
  }

  private emitDocumentDirtyChanged(document: WorkspaceDocument): void {
    for (const listener of this.documentDirtyListeners) {
      listener(document)
    }
  }

  private emitDocumentPathChanged(document: WorkspaceDocument): void {
    for (const listener of this.documentPathListeners) {
      listener(document)
    }
  }

  private emitDocumentExternallyUpdated(document: WorkspaceDocument): void {
    for (const listener of this.documentExternalUpdateListeners) {
      listener(document)
    }
  }

  private emitWorkspaceRootChanged(): void {
    const snapshot = this.getWorkspaceRootSnapshot()

    for (const listener of this.workspaceRootListeners) {
      listener(snapshot)
    }
  }
}
