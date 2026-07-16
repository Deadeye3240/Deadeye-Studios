import { dialog, BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  CreateFileResult,
  DeleteFileResult,
  FileMetadata,
  FileSystemEntry,
  OpenFileDialogResult,
  OpenFolderDialogResult,
  ReadDirectoryResult,
  ReadFileResult,
  RenameFileResult,
  SaveFileDialogOptions,
  SaveFileDialogResult,
  WriteFileResult,
} from '../../shared/filesystem'
import {
  markPathWrittenByApp,
  startWorkspaceWatcher,
  stopWorkspaceWatcher,
} from './file-watcher'

const TEXT_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.markdown',
  '.css',
  '.scss',
  '.less',
  '.html',
  '.htm',
  '.xml',
  '.svg',
  '.yaml',
  '.yml',
  '.txt',
  '.sql',
  '.sh',
  '.bash',
  '.ps1',
  '.bat',
  '.cmd',
  '.env',
  '.gitignore',
  '.gitattributes',
  '.prettierrc',
  '.editorconfig',
])

let workspaceRootPath: string | null = null

export function setWorkspaceRootPath(rootPath: string | null): void {
  workspaceRootPath = rootPath ? normalizePath(rootPath) : null

  if (workspaceRootPath) {
    startWorkspaceWatcher(workspaceRootPath)
    return
  }

  stopWorkspaceWatcher()
}

export function getWorkspaceRootPath(): string | null {
  return workspaceRootPath
}

export async function openFolderDialog(
  parentWindow: BrowserWindow | null,
): Promise<OpenFolderDialogResult> {
  const dialogOptions = {
    title: 'Open Folder',
    properties: ['openDirectory'] as ('openDirectory')[],
  }

  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, path: null }
  }

  const selectedPath = normalizePath(result.filePaths[0])
  setWorkspaceRootPath(selectedPath)

  return {
    canceled: false,
    path: selectedPath,
  }
}

export async function openFileDialog(
  parentWindow: BrowserWindow | null,
): Promise<OpenFileDialogResult> {
  const dialogOptions = {
    title: 'Open File',
    properties: ['openFile'] as ('openFile')[],
  }

  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, path: null }
  }

  return {
    canceled: false,
    path: normalizePath(result.filePaths[0]),
  }
}

export async function saveFileDialog(
  parentWindow: BrowserWindow | null,
  options: SaveFileDialogOptions = {},
): Promise<SaveFileDialogResult> {
  const defaultPath = options.defaultPath
    ? toNativePath(options.defaultPath)
    : workspaceRootPath
      ? toNativePath(
          options.defaultFilename
            ? path.join(workspaceRootPath, options.defaultFilename)
            : workspaceRootPath,
        )
      : undefined

  const dialogOptions = {
    title: 'Save File',
    defaultPath,
  }

  const result = parentWindow
    ? await dialog.showSaveDialog(parentWindow, dialogOptions)
    : await dialog.showSaveDialog(dialogOptions)

  if (result.canceled || !result.filePath) {
    return { canceled: true, path: null }
  }

  return {
    canceled: false,
    path: normalizePath(result.filePath),
  }
}

export async function readDirectory(directoryPath: string): Promise<ReadDirectoryResult> {
  const normalizedDirectoryPath = normalizePath(directoryPath)
  assertPathAllowed(normalizedDirectoryPath)

  const stats = await fs.stat(toNativePath(normalizedDirectoryPath))
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${normalizedDirectoryPath}`)
  }

  const dirents = await fs.readdir(toNativePath(normalizedDirectoryPath), { withFileTypes: true })
  const entries: FileSystemEntry[] = []

  for (const dirent of dirents) {
    const entryPath = normalizePath(path.join(toNativePath(normalizedDirectoryPath), dirent.name))

    if (dirent.isDirectory()) {
      entries.push({
        name: dirent.name,
        path: entryPath,
        kind: 'directory',
      })
      continue
    }

    if (dirent.isFile() && isSupportedTextFile(entryPath)) {
      entries.push({
        name: dirent.name,
        path: entryPath,
        kind: 'file',
      })
    }
  }

  entries.sort(compareFileSystemEntries)

  return {
    path: normalizedDirectoryPath,
    entries,
  }
}

export async function readFile(filePath: string): Promise<ReadFileResult> {
  const normalizedFilePath = normalizePath(filePath)
  assertPathAllowed(normalizedFilePath)

  const stats = await fs.stat(toNativePath(normalizedFilePath))
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${normalizedFilePath}`)
  }

  if (!isSupportedTextFile(normalizedFilePath)) {
    throw new Error(`Unsupported file type: ${normalizedFilePath}`)
  }

  const content = await fs.readFile(toNativePath(normalizedFilePath), 'utf8')

  return {
    path: normalizedFilePath,
    content,
    encoding: 'utf-8',
  }
}

export async function writeFile(filePath: string, content: string): Promise<WriteFileResult> {
  const normalizedFilePath = normalizePath(filePath)
  assertPathAllowed(normalizedFilePath)

  if (!isSupportedTextFile(normalizedFilePath)) {
    throw new Error(`Unsupported file type: ${normalizedFilePath}`)
  }

  const nativePath = toNativePath(normalizedFilePath)
  await fs.mkdir(path.dirname(nativePath), { recursive: true })
  await fs.writeFile(nativePath, content, 'utf8')
  markPathWrittenByApp(normalizedFilePath)

  return {
    path: normalizedFilePath,
    bytesWritten: Buffer.byteLength(content, 'utf8'),
  }
}

export async function createFile(
  filePath: string,
  content = '',
): Promise<CreateFileResult> {
  const normalizedFilePath = normalizePath(filePath)
  assertPathAllowed(normalizedFilePath)

  if (!isSupportedTextFile(normalizedFilePath)) {
    throw new Error(`Unsupported file type: ${normalizedFilePath}`)
  }

  const nativePath = toNativePath(normalizedFilePath)

  try {
    await fs.access(nativePath)
    throw new Error(`File already exists: ${normalizedFilePath}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await fs.mkdir(path.dirname(nativePath), { recursive: true })
  await fs.writeFile(nativePath, content, 'utf8')
  markPathWrittenByApp(normalizedFilePath)

  return {
    path: normalizedFilePath,
    created: true,
  }
}

export async function renameFile(
  oldPath: string,
  newPath: string,
): Promise<RenameFileResult> {
  const normalizedOldPath = normalizePath(oldPath)
  const normalizedNewPath = normalizePath(newPath)
  assertPathAllowed(normalizedOldPath)
  assertPathAllowed(normalizedNewPath)

  if (!isSupportedTextFile(normalizedNewPath)) {
    throw new Error(`Unsupported file type: ${normalizedNewPath}`)
  }

  const nativeOldPath = toNativePath(normalizedOldPath)
  const nativeNewPath = toNativePath(normalizedNewPath)

  await fs.mkdir(path.dirname(nativeNewPath), { recursive: true })
  await fs.rename(nativeOldPath, nativeNewPath)
  markPathWrittenByApp(normalizedNewPath)

  return {
    oldPath: normalizedOldPath,
    newPath: normalizedNewPath,
  }
}

export async function deleteFile(filePath: string): Promise<DeleteFileResult> {
  const normalizedFilePath = normalizePath(filePath)
  assertPathAllowed(normalizedFilePath)

  const nativePath = toNativePath(normalizedFilePath)
  const stats = await fs.stat(nativePath)

  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${normalizedFilePath}`)
  }

  await fs.unlink(nativePath)
  markPathWrittenByApp(normalizedFilePath)

  return {
    path: normalizedFilePath,
    deleted: true,
  }
}

export async function getFileMetadata(filePath: string): Promise<FileMetadata> {
  const normalizedFilePath = normalizePath(filePath)
  assertPathAllowed(normalizedFilePath)

  const stats = await fs.stat(toNativePath(normalizedFilePath))

  return {
    path: normalizedFilePath,
    name: path.basename(normalizedFilePath),
    size: stats.size,
    modifiedAt: stats.mtimeMs,
    createdAt: stats.birthtimeMs,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
  }
}

function assertPathAllowed(targetPath: string): void {
  if (!workspaceRootPath) {
    throw new Error('No workspace root is open')
  }

  const resolvedTarget = path.resolve(toNativePath(targetPath))
  const resolvedRoot = path.resolve(toNativePath(workspaceRootPath))
  const relative = path.relative(resolvedRoot, resolvedTarget)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Access denied: path is outside workspace root (${targetPath})`)
  }
}

function isSupportedTextFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase()

  if (TEXT_FILE_EXTENSIONS.has(extension)) {
    return true
  }

  const baseName = path.basename(filePath).toLowerCase()
  return baseName === '.gitignore' || baseName === '.editorconfig' || baseName === 'dockerfile'
}

function compareFileSystemEntries(a: FileSystemEntry, b: FileSystemEntry): number {
  if (a.kind !== b.kind) {
    return a.kind === 'directory' ? -1 : 1
  }

  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export function normalizePath(value: string): string {
  return path.normalize(value).replace(/\\/g, '/')
}

export function toNativePath(appPath: string): string {
  return path.normalize(appPath)
}
