import { deriveRootName, normalizeWorkspacePath } from './path-utils'
import type { WorkspaceRootChangeListener, WorkspaceRootSnapshot, WorkspaceUnsubscribe } from './types'

/**
 * Workspace root metadata — separate from editor/document state.
 * Represents the currently opened project folder on disk.
 */
export class WorkspaceRoot {
  private rootPath: string | null = null
  private openedAt: number | null = null
  private readonly listeners = new Set<WorkspaceRootChangeListener>()

  get path(): string | null {
    return this.rootPath
  }

  get name(): string | null {
    return this.rootPath ? deriveRootName(this.rootPath) : null
  }

  get isOpen(): boolean {
    return this.rootPath !== null
  }

  open(rootPath: string): void {
    const normalizedPath = normalizeWorkspacePath(rootPath)

    if (!normalizedPath.trim()) {
      throw new Error('Workspace root path cannot be empty')
    }

    if (this.rootPath === normalizedPath) {
      return
    }

    this.rootPath = normalizedPath
    this.openedAt = Date.now()
    this.emitChange()
  }

  close(): void {
    if (!this.isOpen) {
      return
    }

    this.rootPath = null
    this.openedAt = null
    this.emitChange()
  }

  toSnapshot(): WorkspaceRootSnapshot {
    return {
      path: this.rootPath,
      name: this.name,
      openedAt: this.openedAt,
      isOpen: this.isOpen,
    }
  }

  onDidChange(listener: WorkspaceRootChangeListener): WorkspaceUnsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emitChange(): void {
    const snapshot = this.toSnapshot()

    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }
}
