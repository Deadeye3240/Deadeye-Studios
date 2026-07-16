import fs from 'node:fs'
import path from 'node:path'
import type { BrowserWindow } from 'electron'
import { FILESYSTEM_IPC_CHANNELS } from '../../shared/ipc-channels'
import type { FileWatchEvent, FileWatchEventType } from '../../shared/filesystem'
import { getWorkspaceRootPath, normalizePath, toNativePath } from './filesystem-service'

interface PendingWatchEvent {
  readonly path: string
  readonly type: FileWatchEventType
}

let workspaceWatcher: fs.FSWatcher | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let mainWindowGetter: (() => BrowserWindow | null) | null = null

const pendingWatchEvents = new Map<string, PendingWatchEvent>()
const recentlyWrittenPaths = new Map<string, number>()

const WATCH_DEBOUNCE_MS = 200
const SELF_WRITE_SUPPRESS_MS = 1500

export function setFileWatcherWindowGetter(getter: () => BrowserWindow | null): void {
  mainWindowGetter = getter
}

export function startWorkspaceWatcher(rootPath: string): void {
  stopWorkspaceWatcher()

  const nativeRoot = toNativePath(rootPath)

  workspaceWatcher = fs.watch(nativeRoot, { recursive: true }, (eventType, filename) => {
    if (!filename) {
      return
    }

    const resolvedPath = normalizePath(path.join(nativeRoot, filename.toString()))
    queueWatchEvent(resolvedPath, mapWatchEventType(eventType))
  })

  workspaceWatcher.on('error', (error) => {
    console.error('[Deadeye Studio] Workspace watcher error:', error)
  })
}

export function stopWorkspaceWatcher(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (workspaceWatcher) {
    workspaceWatcher.close()
    workspaceWatcher = null
  }

  pendingWatchEvents.clear()
}

export function markPathWrittenByApp(filePath: string): void {
  const normalizedPath = normalizePath(filePath)
  recentlyWrittenPaths.set(normalizedPath, Date.now())
}

export function wasRecentlyWrittenByApp(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath)
  const writtenAt = recentlyWrittenPaths.get(normalizedPath)

  if (!writtenAt) {
    return false
  }

  if (Date.now() - writtenAt > SELF_WRITE_SUPPRESS_MS) {
    recentlyWrittenPaths.delete(normalizedPath)
    return false
  }

  return true
}

function mapWatchEventType(eventType: string): FileWatchEventType {
  if (eventType === 'rename') {
    return 'unlink'
  }

  return 'change'
}

function queueWatchEvent(filePath: string, type: FileWatchEventType): void {
  const rootPath = getWorkspaceRootPath()

  if (!rootPath) {
    return
  }

  const normalizedPath = normalizePath(filePath)

  if (!isPathInsideRoot(normalizedPath, rootPath)) {
    return
  }

  if (wasRecentlyWrittenByApp(normalizedPath)) {
    return
  }

  pendingWatchEvents.set(normalizedPath, { path: normalizedPath, type })

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    flushWatchEvents()
  }, WATCH_DEBOUNCE_MS)
}

function flushWatchEvents(): void {
  debounceTimer = null

  const window = mainWindowGetter?.()
  if (!window || window.isDestroyed()) {
    pendingWatchEvents.clear()
    return
  }

  for (const event of pendingWatchEvents.values()) {
    const payload: FileWatchEvent = {
      path: event.path,
      type: event.type,
    }

    window.webContents.send(FILESYSTEM_IPC_CHANNELS.fileChanged, payload)
  }

  pendingWatchEvents.clear()
}

function isPathInsideRoot(targetPath: string, rootPath: string): boolean {
  const resolvedTarget = path.resolve(toNativePath(targetPath))
  const resolvedRoot = path.resolve(toNativePath(rootPath))
  const relative = path.relative(resolvedRoot, resolvedTarget)

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}
