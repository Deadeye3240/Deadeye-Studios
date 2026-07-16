import type {
  CreateDocumentOptions,
  DocumentDirtyStateListener,
  DocumentId,
  DocumentPathChangeListener,
  WorkspaceDocumentSnapshot,
} from './types'
import { isDiskFilePath, isInMemoryDocumentPath, normalizeWorkspacePath } from './path-utils'

export function createDocumentId(): DocumentId {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function deriveDisplayName(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const segments = normalized.split('/').filter(Boolean)
  return segments.at(-1) ?? filePath
}

export function countLines(content: string): number {
  if (content.length === 0) {
    return 1
  }

  return content.split('\n').length
}

export interface WorkspaceDocumentInit extends CreateDocumentOptions {
  readonly id?: DocumentId
}

/**
 * Application-level representation of an open file.
 *
 * WorkspaceDocument is the source of truth for document metadata and dirty state.
 * Monaco models are attached externally by EditorManager for rendering only.
 */
export class WorkspaceDocument {
  readonly id: DocumentId
  readonly createdAt: number

  private _filePath: string
  language: string

  private savedContent: string
  private liveContent: string
  private dirty: boolean
  private readonly dirtyListeners = new Set<DocumentDirtyStateListener>()
  private readonly pathChangeListeners = new Set<DocumentPathChangeListener>()

  constructor(options: WorkspaceDocumentInit) {
    if (!options.filePath.trim()) {
      throw new Error('WorkspaceDocument requires a non-empty file path placeholder')
    }

    if (!options.language.trim()) {
      throw new Error('WorkspaceDocument requires a language')
    }

    this.id = options.id ?? createDocumentId()
    this._filePath = normalizeWorkspacePath(options.filePath)
    this.language = options.language
    this.savedContent = options.content
    this.liveContent = options.content
    this.dirty = false
    this.createdAt = Date.now()
  }

  get filePath(): string {
    return this._filePath
  }

  get displayName(): string {
    return deriveDisplayName(this._filePath)
  }

  get isDiskBacked(): boolean {
    return isDiskFilePath(this._filePath)
  }

  get isUntitled(): boolean {
    return isInMemoryDocumentPath(this._filePath)
  }

  get content(): string {
    return this.liveContent
  }

  get isDirty(): boolean {
    return this.dirty
  }

  get savedContentSnapshot(): string {
    return this.savedContent
  }

  get lineCount(): number {
    return countLines(this.liveContent)
  }

  get contentLength(): number {
    return this.liveContent.length
  }

  setContentFromEditor(content: string): void {
    this.liveContent = content
    this.updateDirtyState()
  }

  replaceContent(content: string, options: { markClean?: boolean } = {}): void {
    this.liveContent = content

    if (options.markClean) {
      this.savedContent = content
      this.setDirty(false)
      return
    }

    this.updateDirtyState()
  }

  markClean(content?: string): void {
    const resolvedContent = content ?? this.liveContent
    this.savedContent = resolvedContent
    this.liveContent = resolvedContent
    this.setDirty(false)
  }

  revertToSaved(): string {
    this.liveContent = this.savedContent
    this.setDirty(false)
    return this.savedContent
  }

  reassignPath(nextPath: string): void {
    const normalizedPath = normalizeWorkspacePath(nextPath)

    if (!normalizedPath.trim()) {
      throw new Error('Document path cannot be empty')
    }

    if (this._filePath === normalizedPath) {
      return
    }

    const previousPath = this._filePath
    this._filePath = normalizedPath
    this.notifyPathChangeListeners(previousPath)
  }

  setLanguage(language: string): void {
    if (!language.trim()) {
      throw new Error('WorkspaceDocument language cannot be empty')
    }

    this.language = language
  }

  onDidChangeDirtyState(listener: DocumentDirtyStateListener): () => void {
    this.dirtyListeners.add(listener)
    return () => {
      this.dirtyListeners.delete(listener)
    }
  }

  onDidChangePath(listener: DocumentPathChangeListener): () => void {
    this.pathChangeListeners.add(listener)
    return () => {
      this.pathChangeListeners.delete(listener)
    }
  }

  toSnapshot(): WorkspaceDocumentSnapshot {
    return {
      id: this.id,
      filePath: this._filePath,
      displayName: this.displayName,
      language: this.language,
      isDirty: this.dirty,
      isDiskBacked: this.isDiskBacked,
      isUntitled: this.isUntitled,
      contentLength: this.contentLength,
      lineCount: this.lineCount,
    }
  }

  private updateDirtyState(): void {
    this.setDirty(this.liveContent !== this.savedContent)
  }

  private setDirty(nextDirty: boolean): void {
    if (this.dirty === nextDirty) {
      return
    }

    this.dirty = nextDirty
    this.notifyDirtyListeners()
  }

  private notifyDirtyListeners(): void {
    for (const listener of this.dirtyListeners) {
      listener(this.dirty)
    }
  }

  private notifyPathChangeListeners(previousPath: string): void {
    for (const listener of this.pathChangeListeners) {
      listener(this._filePath, previousPath)
    }
  }
}
