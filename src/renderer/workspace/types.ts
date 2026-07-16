import type { WorkspaceDocument } from './document'

export type DocumentId = string

export interface WorkspaceDocumentSnapshot {
  readonly id: DocumentId
  readonly filePath: string
  readonly displayName: string
  readonly language: string
  readonly isDirty: boolean
  readonly isDiskBacked: boolean
  readonly isUntitled: boolean
  readonly contentLength: number
  readonly lineCount: number
}

export interface WorkspaceState {
  readonly activeDocumentId: DocumentId | null
  readonly openDocumentCount: number
  readonly activeDocument: WorkspaceDocumentSnapshot | null
  readonly documents: readonly WorkspaceDocumentSnapshot[]
  readonly workspaceRoot: WorkspaceRootSnapshot
}

export interface WorkspaceRootSnapshot {
  readonly path: string | null
  readonly name: string | null
  readonly openedAt: number | null
  readonly isOpen: boolean
}

export type WorkspaceRootChangeListener = (snapshot: WorkspaceRootSnapshot) => void

export interface CreateDocumentOptions {
  readonly filePath: string
  readonly language: string
  readonly content: string
  readonly id?: DocumentId
  readonly activate?: boolean
}

export type DocumentDirtyStateListener = (isDirty: boolean) => void
export type DocumentPathChangeListener = (newPath: string, previousPath: string) => void
export type ActiveDocumentChangeListener = (document: WorkspaceDocument | null) => void
export type DocumentAddedListener = (document: WorkspaceDocument) => void
export type DocumentRemovedListener = (documentId: DocumentId) => void
export type ExplorerRefreshListener = () => void

export type WorkspaceUnsubscribe = () => void
