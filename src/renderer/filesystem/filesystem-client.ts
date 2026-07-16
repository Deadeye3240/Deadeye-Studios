import type {
  CreateFileResult,
  DeleteFileResult,
  FileMetadata,
  FileWatchEvent,
  FileWatchUnsubscribe,
  OpenFileDialogResult,
  OpenFolderDialogResult,
  ReadDirectoryResult,
  ReadFileResult,
  RenameFileResult,
  SaveFileDialogOptions,
  SaveFileDialogResult,
  WriteFileResult,
} from '../../shared/filesystem'

function getBridge() {
  if (!window.deadeye?.filesystem) {
    throw new Error('Deadeye filesystem bridge is unavailable')
  }

  return window.deadeye.filesystem
}

export class FilesystemClient {
  openFolderDialog(): Promise<OpenFolderDialogResult> {
    return getBridge().openFolderDialog()
  }

  openFileDialog(): Promise<OpenFileDialogResult> {
    return getBridge().openFileDialog()
  }

  saveFileDialog(options?: SaveFileDialogOptions): Promise<SaveFileDialogResult> {
    return getBridge().saveFileDialog(options)
  }

  readDirectory(directoryPath: string): Promise<ReadDirectoryResult> {
    return getBridge().readDirectory(directoryPath)
  }

  readFile(filePath: string): Promise<ReadFileResult> {
    return getBridge().readFile(filePath)
  }

  writeFile(filePath: string, content: string): Promise<WriteFileResult> {
    return getBridge().writeFile(filePath, content)
  }

  createFile(filePath: string, content = ''): Promise<CreateFileResult> {
    return getBridge().createFile(filePath, content)
  }

  renameFile(oldPath: string, newPath: string): Promise<RenameFileResult> {
    return getBridge().renameFile(oldPath, newPath)
  }

  deleteFile(filePath: string): Promise<DeleteFileResult> {
    return getBridge().deleteFile(filePath)
  }

  getFileMetadata(filePath: string): Promise<FileMetadata> {
    return getBridge().getFileMetadata(filePath)
  }

  syncWorkspaceRoot(rootPath: string | null): Promise<void> {
    return getBridge().syncWorkspaceRoot(rootPath)
  }

  onFileChanged(listener: (event: FileWatchEvent) => void): FileWatchUnsubscribe {
    return getBridge().onFileChanged(listener)
  }
}

let filesystemClientInstance: FilesystemClient | null = null

export function getFilesystemClient(): FilesystemClient {
  if (!filesystemClientInstance) {
    filesystemClientInstance = new FilesystemClient()
  }

  return filesystemClientInstance
}
