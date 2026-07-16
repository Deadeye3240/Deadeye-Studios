import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type {
  LastSessionSnapshot,
  RecentFileEntry,
  RecentProjectEntry,
  WorkspaceStateSnapshot,
} from '../../shared/workspace-state'

const STATE_DIR = path.join(os.homedir(), '.deadeye')
const STATE_PATH = path.join(STATE_DIR, 'workspace-state.json')
const MAX_RECENT_PROJECTS = 12
const MAX_RECENT_FILES = 30

const EMPTY_STATE: WorkspaceStateSnapshot = {
  recentProjects: [],
  recentFiles: [],
  lastSession: null,
}

let cachedState: WorkspaceStateSnapshot = structuredClone(EMPTY_STATE)

export async function loadWorkspaceState(): Promise<WorkspaceStateSnapshot> {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<WorkspaceStateSnapshot>
    cachedState = normalizeState(parsed)
    return cachedState
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await saveWorkspaceState(EMPTY_STATE)
      cachedState = structuredClone(EMPTY_STATE)
      return cachedState
    }

    throw error
  }
}

export async function saveWorkspaceState(
  state: WorkspaceStateSnapshot,
): Promise<WorkspaceStateSnapshot> {
  await fs.mkdir(STATE_DIR, { recursive: true })
  const normalized = normalizeState(state)
  await fs.writeFile(STATE_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  cachedState = normalized
  return normalized
}

export async function recordRecentProject(projectPath: string): Promise<WorkspaceStateSnapshot> {
  const state = await loadWorkspaceState()
  const normalizedPath = normalizePath(projectPath)
  const recentProjects = prependRecent(
    state.recentProjects,
    { path: normalizedPath, openedAt: Date.now() },
    MAX_RECENT_PROJECTS,
    (entry) => entry.path,
  )

  return saveWorkspaceState({
    ...state,
    recentProjects,
  })
}

export async function recordRecentFile(filePath: string): Promise<WorkspaceStateSnapshot> {
  const state = await loadWorkspaceState()
  const normalizedPath = normalizePath(filePath)
  const recentFiles = prependRecent(
    state.recentFiles,
    { path: normalizedPath, openedAt: Date.now() },
    MAX_RECENT_FILES,
    (entry) => entry.path,
  )

  return saveWorkspaceState({
    ...state,
    recentFiles,
  })
}

export async function saveLastSession(
  snapshot: LastSessionSnapshot,
): Promise<WorkspaceStateSnapshot> {
  const state = await loadWorkspaceState()
  return saveWorkspaceState({
    ...state,
    lastSession: {
      ...snapshot,
      workspaceRoot: snapshot.workspaceRoot ? normalizePath(snapshot.workspaceRoot) : null,
      openDocuments: snapshot.openDocuments.map((document) => ({
        ...document,
        path: normalizePath(document.path),
      })),
      activeDocumentPath: snapshot.activeDocumentPath
        ? normalizePath(snapshot.activeDocumentPath)
        : null,
      savedAt: Date.now(),
    },
  })
}

export async function clearLastSession(): Promise<WorkspaceStateSnapshot> {
  const state = await loadWorkspaceState()
  return saveWorkspaceState({
    ...state,
    lastSession: null,
  })
}

export function getCachedWorkspaceState(): WorkspaceStateSnapshot {
  return cachedState
}

function normalizeState(partial: Partial<WorkspaceStateSnapshot>): WorkspaceStateSnapshot {
  return {
    recentProjects: Array.isArray(partial.recentProjects) ? partial.recentProjects : [],
    recentFiles: Array.isArray(partial.recentFiles) ? partial.recentFiles : [],
    lastSession: partial.lastSession ?? null,
  }
}

function prependRecent<T extends RecentProjectEntry | RecentFileEntry>(
  entries: readonly T[],
  next: T,
  max: number,
  keySelector: (entry: T) => string,
): T[] {
  const filtered = entries.filter((entry) => keySelector(entry) !== keySelector(next))
  return [next, ...filtered].slice(0, max)
}

function normalizePath(value: string): string {
  return path.normalize(value).replace(/\\/g, '/')
}
