import { contextBridge, ipcRenderer } from 'electron'
import type { DeadeyeAPI } from './shared/api'
import type { CommandId } from './shared/commands'
import type {
  CreateFileResult,
  DeleteFileResult,
  FileMetadata,
  FileWatchEvent,
  FileWatchListener,
  FileWatchUnsubscribe,
  OpenFolderDialogResult,
  OpenFileDialogResult,
  ReadDirectoryResult,
  ReadFileResult,
  RenameFileResult,
  SaveFileDialogOptions,
  SaveFileDialogResult,
  WriteFileResult,
} from './shared/filesystem'
import {
  APPEARANCE_IPC_CHANNELS,
  EXTENSION_IPC_CHANNELS,
  FILESYSTEM_IPC_CHANNELS,
  GIT_IPC_CHANNELS,
  MENU_IPC_CHANNELS,
  SETTINGS_IPC_CHANNELS,
  TERMINAL_IPC_CHANNELS,
  THEME_IPC_CHANNELS,
  WINDOW_IPC_CHANNELS,
  WORKSPACE_STATE_IPC_CHANNELS,
} from './shared/ipc-channels'
import type {
  CreateTerminalOptions,
  CreateTerminalResult,
  TerminalDataEvent,
  TerminalExitEvent,
} from './shared/terminal'
import type { DiscoveredExtensionSnapshot } from './shared/extensions-bridge'
import type { DeadeyeSettings } from './shared/settings'
import type { ApplyShellThemePayload } from './shared/themes'
import { APP_VERSION } from './shared/version'
import type { GitCommitOptions, GitDiffResult, GitRepositoryStatus } from './shared/git'
import type { LastSessionSnapshot, WorkspaceStateSnapshot } from './shared/workspace-state'

const deadeyeAPI: DeadeyeAPI = {
  version: APP_VERSION,
  platform: process.platform,
  filesystem: {
    openFolderDialog(): Promise<OpenFolderDialogResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.openFolderDialog)
    },
    openFileDialog(): Promise<OpenFileDialogResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.openFileDialog)
    },
    saveFileDialog(options?: SaveFileDialogOptions): Promise<SaveFileDialogResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.saveFileDialog, options ?? {})
    },
    readDirectory(directoryPath: string): Promise<ReadDirectoryResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.readDirectory, directoryPath)
    },
    readFile(filePath: string): Promise<ReadFileResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.readFile, filePath)
    },
    writeFile(filePath: string, content: string): Promise<WriteFileResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.writeFile, filePath, content)
    },
    createFile(filePath: string, content = ''): Promise<CreateFileResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.createFile, filePath, content)
    },
    renameFile(oldPath: string, newPath: string): Promise<RenameFileResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.renameFile, oldPath, newPath)
    },
    deleteFile(filePath: string): Promise<DeleteFileResult> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.deleteFile, filePath)
    },
    getFileMetadata(filePath: string): Promise<FileMetadata> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.getFileMetadata, filePath)
    },
    syncWorkspaceRoot(rootPath: string | null): Promise<void> {
      return ipcRenderer.invoke(FILESYSTEM_IPC_CHANNELS.setWorkspaceRoot, rootPath)
    },
    onFileChanged(listener: FileWatchListener): FileWatchUnsubscribe {
      const handler = (_event: Electron.IpcRendererEvent, payload: FileWatchEvent): void => {
        listener(payload)
      }

      ipcRenderer.on(FILESYSTEM_IPC_CHANNELS.fileChanged, handler)

      return () => {
        ipcRenderer.removeListener(FILESYSTEM_IPC_CHANNELS.fileChanged, handler)
      }
    },
  },
  terminal: {
    create(options?: CreateTerminalOptions): Promise<CreateTerminalResult> {
      return ipcRenderer.invoke(TERMINAL_IPC_CHANNELS.create, options ?? {})
    },
    write(id: string, data: string): Promise<void> {
      return ipcRenderer.invoke(TERMINAL_IPC_CHANNELS.write, id, data)
    },
    resize(id: string, cols: number, rows: number): Promise<void> {
      return ipcRenderer.invoke(TERMINAL_IPC_CHANNELS.resize, id, cols, rows)
    },
    kill(id: string): Promise<void> {
      return ipcRenderer.invoke(TERMINAL_IPC_CHANNELS.kill, id)
    },
    onData(listener) {
      const handler = (_event: Electron.IpcRendererEvent, payload: TerminalDataEvent): void => {
        listener(payload)
      }

      ipcRenderer.on(TERMINAL_IPC_CHANNELS.data, handler)

      return () => {
        ipcRenderer.removeListener(TERMINAL_IPC_CHANNELS.data, handler)
      }
    },
    onExit(listener) {
      const handler = (_event: Electron.IpcRendererEvent, payload: TerminalExitEvent): void => {
        listener(payload)
      }

      ipcRenderer.on(TERMINAL_IPC_CHANNELS.exit, handler)

      return () => {
        ipcRenderer.removeListener(TERMINAL_IPC_CHANNELS.exit, handler)
      }
    },
  },
  menu: {
    onExecuteCommand(listener) {
      const handler = (_event: Electron.IpcRendererEvent, commandId: CommandId): void => {
        listener(commandId)
      }

      ipcRenderer.on(MENU_IPC_CHANNELS.executeCommand, handler)

      return () => {
        ipcRenderer.removeListener(MENU_IPC_CHANNELS.executeCommand, handler)
      }
    },
  },
  window: {
    newWindow(): Promise<void> {
      return ipcRenderer.invoke(WINDOW_IPC_CHANNELS.newWindow)
    },
    exit(): Promise<void> {
      return ipcRenderer.invoke(WINDOW_IPC_CHANNELS.exit)
    },
    toggleFullScreen(): Promise<void> {
      return ipcRenderer.invoke(WINDOW_IPC_CHANNELS.toggleFullScreen)
    },
  },
  settings: {
    get(): Promise<DeadeyeSettings> {
      return ipcRenderer.invoke(SETTINGS_IPC_CHANNELS.get)
    },
    update(partial: Partial<DeadeyeSettings>): Promise<DeadeyeSettings> {
      return ipcRenderer.invoke(SETTINGS_IPC_CHANNELS.update, partial)
    },
    reset(): Promise<DeadeyeSettings> {
      return ipcRenderer.invoke(SETTINGS_IPC_CHANNELS.reset)
    },
    onDidChange(listener) {
      const handler = (_event: Electron.IpcRendererEvent, settings: DeadeyeSettings): void => {
        listener(settings)
      }

      ipcRenderer.on(SETTINGS_IPC_CHANNELS.changed, handler)

      return () => {
        ipcRenderer.removeListener(SETTINGS_IPC_CHANNELS.changed, handler)
      }
    },
  },
  git: {
    findRepository(startPath: string): Promise<string | null> {
      return ipcRenderer.invoke(GIT_IPC_CHANNELS.findRepository, startPath)
    },
    getStatus(repositoryRoot: string): Promise<GitRepositoryStatus> {
      return ipcRenderer.invoke(GIT_IPC_CHANNELS.getStatus, repositoryRoot)
    },
    stageFile(repositoryRoot: string, filePath: string): Promise<void> {
      return ipcRenderer.invoke(GIT_IPC_CHANNELS.stageFile, repositoryRoot, filePath)
    },
    unstageFile(repositoryRoot: string, filePath: string): Promise<void> {
      return ipcRenderer.invoke(GIT_IPC_CHANNELS.unstageFile, repositoryRoot, filePath)
    },
    commit(repositoryRoot: string, options: GitCommitOptions): Promise<void> {
      return ipcRenderer.invoke(GIT_IPC_CHANNELS.commit, repositoryRoot, options)
    },
    getDiff(repositoryRoot: string, filePath: string): Promise<GitDiffResult> {
      return ipcRenderer.invoke(GIT_IPC_CHANNELS.getDiff, repositoryRoot, filePath)
    },
  },
  workspaceState: {
    get(): Promise<WorkspaceStateSnapshot> {
      return ipcRenderer.invoke(WORKSPACE_STATE_IPC_CHANNELS.get)
    },
    recordProject(path: string): Promise<WorkspaceStateSnapshot> {
      return ipcRenderer.invoke(WORKSPACE_STATE_IPC_CHANNELS.recordProject, path)
    },
    recordFile(path: string): Promise<WorkspaceStateSnapshot> {
      return ipcRenderer.invoke(WORKSPACE_STATE_IPC_CHANNELS.recordFile, path)
    },
    saveSession(snapshot: LastSessionSnapshot): Promise<WorkspaceStateSnapshot> {
      return ipcRenderer.invoke(WORKSPACE_STATE_IPC_CHANNELS.saveSession, snapshot)
    },
    clearSession(): Promise<WorkspaceStateSnapshot> {
      return ipcRenderer.invoke(WORKSPACE_STATE_IPC_CHANNELS.clearSession)
    },
  },
  theme: {
    applyShell(payload: ApplyShellThemePayload): Promise<void> {
      return ipcRenderer.invoke(THEME_IPC_CHANNELS.applyShell, payload)
    },
  },
  appearance: {
    setZoomFactor(factor: number): Promise<void> {
      return ipcRenderer.invoke(APPEARANCE_IPC_CHANNELS.setZoomFactor, factor)
    },
  },
  extensions: {
    discoverUser(): Promise<readonly DiscoveredExtensionSnapshot[]> {
      return ipcRenderer.invoke(EXTENSION_IPC_CHANNELS.discoverUser)
    },
  },
}

contextBridge.exposeInMainWorld('deadeye', deadeyeAPI)
