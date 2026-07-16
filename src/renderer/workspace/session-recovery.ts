import { getDialogService } from '../dialogs'
import type { WorkspaceManager } from './workspace-manager'
import { isDiskFilePath } from './path-utils'
import { getWorkspaceHistoryClient } from './workspace-history-client'

export async function recoverLastSession(workspace: WorkspaceManager): Promise<boolean> {
  const state = await getWorkspaceHistoryClient().get()
  const session = state.lastSession

  if (!session?.workspaceRoot) {
    return false
  }

  const confirmed = await getDialogService().confirm({
    title: 'Restore Session',
    message: `Restore previous session for "${session.workspaceRoot}"?`,
    confirmLabel: 'Restore',
    cancelLabel: 'Start Fresh',
  })

  if (!confirmed) {
    await getWorkspaceHistoryClient().clearSession()
    return false
  }

  await workspace.openWorkspaceRoot(session.workspaceRoot)

  for (const document of session.openDocuments) {
    if (!isDiskFilePath(document.path)) {
      continue
    }

    try {
      const opened = await workspace.openDocument(document.path)
      if (document.active) {
        workspace.setActiveDocument(opened.id)
      }
    } catch {
      continue
    }
  }

  return true
}

export async function persistSessionSnapshot(workspace: WorkspaceManager): Promise<void> {
  const workspaceRoot = workspace.getWorkspaceRootSnapshot().path
  const activeDocument = workspace.getActiveDocument()

  await getWorkspaceHistoryClient().saveSession({
    workspaceRoot,
    openDocuments: workspace.getOpenDocuments().map((document) => ({
      path: document.filePath,
      active: document.id === workspace.getActiveDocumentId(),
    })),
    activeDocumentPath: activeDocument?.filePath ?? null,
    savedAt: Date.now(),
  })
}

export async function recordWorkspaceProject(path: string): Promise<void> {
  await getWorkspaceHistoryClient().recordProject(path)
}

export async function recordWorkspaceFile(path: string): Promise<void> {
  if (!isDiskFilePath(path)) {
    return
  }

  await getWorkspaceHistoryClient().recordFile(path)
}
