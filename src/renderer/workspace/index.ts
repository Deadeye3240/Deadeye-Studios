export { WorkspaceDocument, createDocumentId, deriveDisplayName } from './document'
export { WorkspaceManager } from './workspace-manager'
export { WorkspaceRoot } from './workspace-root'
export { createUntitledDocumentOptions } from './untitled-document'
export { createNewTextFile } from './new-text-file'
export {
  STARTER_DOCUMENT_CONTENT,
  STARTER_FILE_PATH,
  createStarterDocumentOptions,
} from './starter-document'
export {
  detectLanguageFromPath,
  deriveRootName,
  isDiskFilePath,
  normalizeWorkspacePath,
} from './path-utils'
export type {
  ActiveDocumentChangeListener,
  CreateDocumentOptions,
  DocumentAddedListener,
  DocumentDirtyStateListener,
  DocumentId,
  DocumentRemovedListener,
  WorkspaceDocumentSnapshot,
  WorkspaceRootChangeListener,
  WorkspaceRootSnapshot,
  WorkspaceState,
  WorkspaceUnsubscribe,
} from './types'
export {
  recoverLastSession,
  persistSessionSnapshot,
  recordWorkspaceProject,
  recordWorkspaceFile,
} from './session-recovery'
export { getWorkspaceHistoryClient } from './workspace-history-client'
