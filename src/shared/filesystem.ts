export type FileSystemEntryKind = 'file' | 'directory'

export interface FileSystemEntry {
  readonly name: string
  readonly path: string
  readonly kind: FileSystemEntryKind
}

export interface FileMetadata {
  readonly path: string
  readonly name: string
  readonly size: number
  readonly modifiedAt: number
  readonly createdAt: number
  readonly isFile: boolean
  readonly isDirectory: boolean
}

export interface ReadDirectoryResult {
  readonly path: string
  readonly entries: readonly FileSystemEntry[]
}

export interface ReadFileResult {
  readonly path: string
  readonly content: string
  readonly encoding: 'utf-8'
}

export interface WriteFileResult {
  readonly path: string
  readonly bytesWritten: number
}

export interface CreateFileResult {
  readonly path: string
  readonly created: boolean
}

export interface RenameFileResult {
  readonly oldPath: string
  readonly newPath: string
}

export interface DeleteFileResult {
  readonly path: string
  readonly deleted: boolean
}

export interface OpenFolderDialogResult {
  readonly canceled: boolean
  readonly path: string | null
}

export interface OpenFileDialogResult {
  readonly canceled: boolean
  readonly path: string | null
}

export interface SaveFileDialogOptions {
  readonly defaultPath?: string
  readonly defaultFilename?: string
}

export interface SaveFileDialogResult {
  readonly canceled: boolean
  readonly path: string | null
}

export type FileWatchEventType = 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir'

export interface FileWatchEvent {
  readonly path: string
  readonly type: FileWatchEventType
}

export type FileWatchListener = (event: FileWatchEvent) => void
export type FileWatchUnsubscribe = () => void

export interface FileSystemBridge {
  openFolderDialog(): Promise<OpenFolderDialogResult>
  openFileDialog(): Promise<OpenFileDialogResult>
  readDirectory(directoryPath: string): Promise<ReadDirectoryResult>
  readFile(filePath: string): Promise<ReadFileResult>
  writeFile(filePath: string, content: string): Promise<WriteFileResult>
  createFile(filePath: string, content?: string): Promise<CreateFileResult>
  renameFile(oldPath: string, newPath: string): Promise<RenameFileResult>
  deleteFile(filePath: string): Promise<DeleteFileResult>
  getFileMetadata(filePath: string): Promise<FileMetadata>
  saveFileDialog(options?: SaveFileDialogOptions): Promise<SaveFileDialogResult>
  syncWorkspaceRoot(rootPath: string | null): Promise<void>
  onFileChanged(listener: FileWatchListener): FileWatchUnsubscribe
}
