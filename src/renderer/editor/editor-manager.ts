import type { editor } from 'monaco-editor'
import { createDefaultEditorOptions } from './editor-config'
import { isMonacoWorkerEnvironmentConfigured, monaco } from './monaco-setup'
import { registerAllMonacoThemes } from '../themes'
import { getLanguageProfileManager } from '../language/language-profiles'
import type { WorkspaceDocument } from '../workspace/document'
import { isDiskFilePath } from '../workspace/path-utils'
import type { DocumentId } from '../workspace/types'

export interface EditorManagerOptions {
  readonly container: HTMLElement
}

interface AttachedDocumentState {
  readonly model: monaco.editor.ITextModel
  readonly contentDisposable: monaco.IDisposable
}

/**
 * Renders workspace documents through Monaco.
 *
 * EditorManager does not own application document state.
 * WorkspaceDocument is the source of truth; Monaco models are rendering adapters.
 */
export class EditorManager {
  private readonly container: HTMLElement
  private editor: monaco.editor.IStandaloneCodeEditor | null = null
  private initialized = false
  private disposed = false

  private activeDocumentId: DocumentId | null = null
  private readonly attachedDocuments = new Map<DocumentId, AttachedDocumentState>()

  constructor(options: EditorManagerOptions) {
    if (!options.container) {
      throw new Error('EditorManager requires a valid container element')
    }

    this.container = options.container
  }

  /**
   * Configures Monaco workers, registers the Deadeye Dark theme,
   * and prepares the editor runtime. Safe to call multiple times.
   */
  async initialize(): Promise<void> {
    if (this.disposed) {
      throw new Error('Cannot initialize a disposed EditorManager')
    }

    if (this.initialized) {
      return
    }

    if (!isMonacoWorkerEnvironmentConfigured()) {
      throw new Error('Monaco worker environment is not configured')
    }

    try {
      registerAllMonacoThemes(monaco)
      getLanguageProfileManager().initialize()
      monaco.editor.setTheme(createDefaultEditorOptions().theme ?? 'deadeye-dark')
      this.initialized = true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to initialize Monaco editor runtime: ${message}`)
    }
  }

  /**
   * Creates the Monaco editor instance and mounts it into the container.
   * The editor is created without a model; use setActiveDocument afterwards.
   */
  mount(overrides?: editor.IStandaloneEditorConstructionOptions): monaco.editor.IStandaloneCodeEditor {
    if (this.disposed) {
      throw new Error('Cannot mount a disposed EditorManager')
    }

    if (!this.initialized) {
      throw new Error('EditorManager must be initialized before mounting')
    }

    if (this.editor) {
      return this.editor
    }

    if (!this.container.isConnected) {
      throw new Error('Editor container is not connected to the DOM')
    }

    try {
      const editorOptions = {
        ...createDefaultEditorOptions(),
        ...overrides,
      }

      this.editor = monaco.editor.create(this.container, {
        ...editorOptions,
        model: null,
      })

      return this.editor
    } catch (error) {
      this.cleanupEditorResources()

      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to mount Monaco editor: ${message}`)
    }
  }

  /**
   * Attaches a workspace document to a Monaco model if not already attached.
   */
  attachDocument(document: WorkspaceDocument): monaco.editor.ITextModel {
    this.assertNotDisposed('attach documents')

    const existing = this.attachedDocuments.get(document.id)
    if (existing) {
      return existing.model
    }

    const model = monaco.editor.createModel(
      document.content,
      document.language,
      createDocumentUri(document),
    )

    const contentDisposable = model.onDidChangeContent(() => {
      document.setContentFromEditor(model.getValue())
    })

    this.attachedDocuments.set(document.id, {
      model,
      contentDisposable,
    })

    return model
  }

  /**
   * Detaches and disposes the Monaco model for a workspace document.
   */
  detachDocument(documentId: DocumentId): void {
    const attached = this.attachedDocuments.get(documentId)

    if (!attached) {
      return
    }

    if (this.activeDocumentId === documentId && this.editor) {
      this.editor.setModel(null)
      this.activeDocumentId = null
    }

    attached.contentDisposable.dispose()
    attached.model.dispose()
    this.attachedDocuments.delete(documentId)
  }

  /**
   * Displays the given workspace document in the editor surface.
   */
  setActiveDocument(document: WorkspaceDocument): monaco.editor.IStandaloneCodeEditor {
    this.assertNotDisposed('set the active document')

    if (!this.editor) {
      throw new Error('EditorManager must be mounted before setting an active document')
    }

    const model = this.attachDocument(document)

    if (this.activeDocumentId !== document.id) {
      this.activeDocumentId = document.id
      this.editor.setModel(model)

      if (model.getLanguageId() !== document.language) {
        monaco.editor.setModelLanguage(model, document.language)
      }

      this.applyLanguageProfile(document.language)
    }

    this.editor.focus()
    return this.editor
  }

  /**
   * Synchronizes a workspace document's Monaco model with application state.
   * Used when document content changes outside the editor (future load/revert).
   */
  syncDocumentModel(document: WorkspaceDocument): void {
    const attached = this.attachedDocuments.get(document.id)

    if (!attached) {
      return
    }

    const modelValue = attached.model.getValue()
    if (modelValue !== document.content) {
      attached.model.setValue(document.content)
    }

    if (attached.model.getLanguageId() !== document.language) {
      monaco.editor.setModelLanguage(attached.model, document.language)
    }
  }

  /**
   * Rebinds a document to a new Monaco model after path or URI changes.
   */
  updateDocumentPath(document: WorkspaceDocument): void {
    const attached = this.attachedDocuments.get(document.id)

    if (!attached) {
      return
    }

    const wasActive = this.activeDocumentId === document.id
    const content = document.content
    const language = document.language

    attached.contentDisposable.dispose()
    attached.model.dispose()
    this.attachedDocuments.delete(document.id)

    const model = monaco.editor.createModel(content, language, createDocumentUri(document))
    const contentDisposable = model.onDidChangeContent(() => {
      document.setContentFromEditor(model.getValue())
    })

    this.attachedDocuments.set(document.id, {
      model,
      contentDisposable,
    })

    if (wasActive && this.editor) {
      this.editor.setModel(model)
      this.applyLanguageProfile(language)
    }
  }

  private applyLanguageProfile(languageId: string): void {
    if (!this.editor) {
      return
    }

    const profileOptions = getLanguageProfileManager().getEditorOptionsForLanguage(languageId)
    this.editor.updateOptions(profileOptions)
  }

  refreshDocumentContent(document: WorkspaceDocument): void {
    this.syncDocumentModel(document)
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor
  }

  getActiveModel(): monaco.editor.ITextModel | null {
    if (!this.activeDocumentId) {
      return null
    }

    return this.attachedDocuments.get(this.activeDocumentId)?.model ?? null
  }

  getModelForDocument(documentId: DocumentId): monaco.editor.ITextModel | null {
    return this.attachedDocuments.get(documentId)?.model ?? null
  }

  getActiveDocumentId(): DocumentId | null {
    return this.activeDocumentId
  }

  isDocumentAttached(documentId: DocumentId): boolean {
    return this.attachedDocuments.has(documentId)
  }

  focus(): void {
    this.editor?.focus()
  }

  layout(): void {
    this.editor?.layout()
  }

  undo(): void {
    this.editor?.trigger('keyboard', 'undo', null)
  }

  redo(): void {
    this.editor?.trigger('keyboard', 'redo', null)
  }

  cut(): void {
    this.editor?.trigger('keyboard', 'editor.action.clipboardCutAction', null)
  }

  copy(): void {
    this.editor?.trigger('keyboard', 'editor.action.clipboardCopyAction', null)
  }

  paste(): void {
    this.editor?.trigger('keyboard', 'editor.action.clipboardPasteAction', null)
  }

  find(): void {
    this.editor?.trigger('keyboard', 'actions.find', null)
  }

  replace(): void {
    this.editor?.trigger('keyboard', 'editor.action.startFindReplaceAction', null)
  }

  selectAll(): void {
    this.editor?.trigger('keyboard', 'editor.action.selectAll', null)
  }

  expandSelection(): void {
    this.editor?.trigger('keyboard', 'editor.action.smartSelect.expand', null)
  }

  shrinkSelection(): void {
    this.editor?.trigger('keyboard', 'editor.action.smartSelect.shrink', null)
  }

  goToSymbol(): void {
    this.editor?.trigger('keyboard', 'editor.action.quickOutline', null)
  }

  goBack(): void {
    this.editor?.trigger('keyboard', 'editor.action.navigateBack', null)
  }

  goForward(): void {
    this.editor?.trigger('keyboard', 'editor.action.navigateForward', null)
  }

  goToLine(lineNumber: number, column = 1): void {
    const editor = this.editor
    if (!editor) {
      return
    }

    editor.setPosition({ lineNumber, column })
    editor.revealLineInCenter(lineNumber)
    editor.focus()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true

    for (const documentId of Array.from(this.attachedDocuments.keys())) {
      this.detachDocument(documentId)
    }

    this.cleanupEditorResources()
    this.initialized = false
    this.activeDocumentId = null
  }

  private cleanupEditorResources(): void {
    if (this.editor) {
      this.editor.dispose()
      this.editor = null
    }
  }

  private assertNotDisposed(action: string): void {
    if (this.disposed) {
      throw new Error(`Cannot ${action} on a disposed EditorManager`)
    }
  }
}

function createDocumentUri(document: WorkspaceDocument): monaco.Uri {
  if (isDiskFilePath(document.filePath)) {
    return monaco.Uri.file(document.filePath)
  }

  const encodedPath = document.filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return monaco.Uri.parse(`inmemory://${document.id}/${encodedPath}`)
}
