export { detectLanguageFromPath } from '../../shared/language-registry'

export function normalizeWorkspacePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

export function isDiskFilePath(filePath: string): boolean {
  return /^([a-zA-Z]:\/|\/)/.test(normalizeWorkspacePath(filePath))
}

export function isInMemoryDocumentPath(filePath: string): boolean {
  return !isDiskFilePath(filePath)
}

export function joinWorkspacePath(rootPath: string, relativePath: string): string {
  const normalizedRoot = normalizeWorkspacePath(rootPath).replace(/\/$/, '')
  const normalizedRelative = relativePath.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${normalizedRoot}/${normalizedRelative}`
}

export function deriveRootName(rootPath: string): string {
  const normalized = normalizeWorkspacePath(rootPath)
  const segments = normalized.split('/').filter(Boolean)
  return segments.at(-1) ?? rootPath
}

export function basename(filePath: string): string {
  const normalized = normalizeWorkspacePath(filePath).replace(/\/$/, '')
  const segments = normalized.split('/').filter(Boolean)
  return segments.at(-1) ?? filePath
}

export function dirname(filePath: string): string {
  const normalized = normalizeWorkspacePath(filePath).replace(/\/$/, '')
  const segments = normalized.split('/').filter(Boolean)
  if (segments.length <= 1) {
    return normalized
  }

  return segments.slice(0, -1).join('/')
}

