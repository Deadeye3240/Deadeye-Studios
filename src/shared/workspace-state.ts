export interface RecentProjectEntry {
  readonly path: string
  readonly openedAt: number
}

export interface RecentFileEntry {
  readonly path: string
  readonly openedAt: number
}

export interface SessionDocumentEntry {
  readonly path: string
  readonly active: boolean
}

export interface LastSessionSnapshot {
  readonly workspaceRoot: string | null
  readonly openDocuments: readonly SessionDocumentEntry[]
  readonly activeDocumentPath: string | null
  readonly savedAt: number
}

export interface WorkspaceStateSnapshot {
  readonly recentProjects: readonly RecentProjectEntry[]
  readonly recentFiles: readonly RecentFileEntry[]
  readonly lastSession: LastSessionSnapshot | null
}

export interface WorkspaceStateBridge {
  get(): Promise<WorkspaceStateSnapshot>
  recordProject(path: string): Promise<WorkspaceStateSnapshot>
  recordFile(path: string): Promise<WorkspaceStateSnapshot>
  saveSession(snapshot: LastSessionSnapshot): Promise<WorkspaceStateSnapshot>
  clearSession(): Promise<WorkspaceStateSnapshot>
}
