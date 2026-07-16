import type { WorkspaceDocument } from './document'
import type { WorkspaceManager } from './workspace-manager'
import { createUntitledDocumentOptions } from './untitled-document'

/**
 * Opens a new in-memory untitled text file in the editor.
 * Persists to disk on first save (Save / Save As).
 */
export function createNewTextFile(workspace: WorkspaceManager): WorkspaceDocument {
  return workspace.createDocument(createUntitledDocumentOptions(workspace))
}
