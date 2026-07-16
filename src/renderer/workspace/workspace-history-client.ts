import type { LastSessionSnapshot, WorkspaceStateSnapshot } from '../../shared/workspace-state'

function getBridge() {
  if (!window.deadeye?.workspaceState) {
    throw new Error('Deadeye workspace state bridge is unavailable')
  }

  return window.deadeye.workspaceState
}

export class WorkspaceHistoryClient {
  get(): Promise<WorkspaceStateSnapshot> {
    return getBridge().get()
  }

  recordProject(path: string): Promise<WorkspaceStateSnapshot> {
    return getBridge().recordProject(path)
  }

  recordFile(path: string): Promise<WorkspaceStateSnapshot> {
    return getBridge().recordFile(path)
  }

  saveSession(snapshot: LastSessionSnapshot): Promise<WorkspaceStateSnapshot> {
    return getBridge().saveSession(snapshot)
  }

  clearSession(): Promise<WorkspaceStateSnapshot> {
    return getBridge().clearSession()
  }
}

let workspaceHistoryClient: WorkspaceHistoryClient | null = null

export function getWorkspaceHistoryClient(): WorkspaceHistoryClient {
  if (!workspaceHistoryClient) {
    workspaceHistoryClient = new WorkspaceHistoryClient()
  }

  return workspaceHistoryClient
}
