import type { CreateDocumentOptions } from './types'
import type { WorkspaceManager } from './workspace-manager'

/**
 * Creates options for a new in-memory untitled text document.
 * No filesystem access — path is a workspace placeholder only.
 */
export function createUntitledDocumentOptions(workspace: WorkspaceManager): CreateDocumentOptions {
  const filePath = resolveUniqueUntitledPath(workspace)

  return {
    filePath,
    language: 'plaintext',
    content: '',
    activate: true,
  }
}

function resolveUniqueUntitledPath(workspace: WorkspaceManager): string {
  let index = 1

  while (index < 10_000) {
    const candidate = `workspace/untitled-${index}.txt`

    if (!workspace.getDocumentByPath(candidate)) {
      return candidate
    }

    index += 1
  }

  return `workspace/untitled-${Date.now()}.txt`
}
