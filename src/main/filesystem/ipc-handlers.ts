import { BrowserWindow, ipcMain } from 'electron'
import type {
  CreateFileResult,
  DeleteFileResult,
  FileMetadata,
  OpenFileDialogResult,
  OpenFolderDialogResult,
  ReadDirectoryResult,
  ReadFileResult,
  RenameFileResult,
  SaveFileDialogOptions,
  SaveFileDialogResult,
  WriteFileResult,
} from '../../shared/filesystem'
import { FILESYSTEM_IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createFile,
  deleteFile,
  getFileMetadata,
  openFolderDialog,
  openFileDialog,
  readDirectory,
  readFile,
  renameFile,
  saveFileDialog,
  setWorkspaceRootPath,
  writeFile,
} from './filesystem-service'
import { setFileWatcherWindowGetter } from './file-watcher'

export { FILESYSTEM_IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerFilesystemIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  setFileWatcherWindowGetter(getMainWindow)

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.openFolderDialog,
    async (event): Promise<OpenFolderDialogResult> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender)
      return openFolderDialog(parentWindow)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.openFileDialog,
    async (event): Promise<OpenFileDialogResult> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender)
      return openFileDialog(parentWindow)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.saveFileDialog,
    async (event, options?: SaveFileDialogOptions): Promise<SaveFileDialogResult> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender)
      return saveFileDialog(parentWindow, options ?? {})
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.readDirectory,
    async (_event, directoryPath: string): Promise<ReadDirectoryResult> => {
      if (typeof directoryPath !== 'string' || directoryPath.trim().length === 0) {
        throw new Error('readDirectory requires a non-empty directory path')
      }

      return readDirectory(directoryPath)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.readFile,
    async (_event, filePath: string): Promise<ReadFileResult> => {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        throw new Error('readFile requires a non-empty file path')
      }

      return readFile(filePath)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.writeFile,
    async (_event, filePath: string, content: string): Promise<WriteFileResult> => {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        throw new Error('writeFile requires a non-empty file path')
      }

      if (typeof content !== 'string') {
        throw new Error('writeFile requires string content')
      }

      return writeFile(filePath, content)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.createFile,
    async (_event, filePath: string, content = ''): Promise<CreateFileResult> => {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        throw new Error('createFile requires a non-empty file path')
      }

      if (typeof content !== 'string') {
        throw new Error('createFile requires string content')
      }

      return createFile(filePath, content)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.renameFile,
    async (_event, oldPath: string, newPath: string): Promise<RenameFileResult> => {
      if (typeof oldPath !== 'string' || typeof newPath !== 'string') {
        throw new Error('renameFile requires old and new paths')
      }

      return renameFile(oldPath, newPath)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.deleteFile,
    async (_event, filePath: string): Promise<DeleteFileResult> => {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        throw new Error('deleteFile requires a non-empty file path')
      }

      return deleteFile(filePath)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.getFileMetadata,
    async (_event, filePath: string): Promise<FileMetadata> => {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        throw new Error('getFileMetadata requires a non-empty file path')
      }

      return getFileMetadata(filePath)
    },
  )

  ipcMain.handle(
    FILESYSTEM_IPC_CHANNELS.setWorkspaceRoot,
    async (_event, rootPath: string | null): Promise<void> => {
      if (rootPath !== null && typeof rootPath !== 'string') {
        throw new Error('setWorkspaceRoot requires a string path or null')
      }

      setWorkspaceRootPath(rootPath)
    },
  )
}
