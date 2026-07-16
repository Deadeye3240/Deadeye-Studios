import { getFilesystemClient } from '../filesystem'
import { getRecentFiles } from './recent-files'

export interface QuickOpenItem {
  readonly path: string
  readonly label: string
  readonly kind: 'workspace' | 'recent'
}

export async function collectQuickOpenItems(workspaceRoot: string | null): Promise<QuickOpenItem[]> {
  const items: QuickOpenItem[] = []
  const seen = new Set<string>()

  if (workspaceRoot) {
    const workspaceFiles = await listWorkspaceFiles(workspaceRoot)
    for (const filePath of workspaceFiles) {
      if (seen.has(filePath)) {
        continue
      }

      seen.add(filePath)
      items.push({
        path: filePath,
        label: filePath.replace(workspaceRoot, '').replace(/^\/+/, '') || filePath,
        kind: 'workspace',
      })
    }
  }

  for (const filePath of getRecentFiles()) {
    if (seen.has(filePath)) {
      continue
    }

    seen.add(filePath)
    items.push({
      path: filePath,
      label: filePath.split('/').pop() ?? filePath,
      kind: 'recent',
    })
  }

  return items
}

async function listWorkspaceFiles(rootPath: string): Promise<string[]> {
  const filesystem = getFilesystemClient()
  const files: string[] = []
  const queue = [rootPath]

  while (queue.length > 0) {
    const directoryPath = queue.shift()
    if (!directoryPath) {
      continue
    }

    try {
      const result = await filesystem.readDirectory(directoryPath)

      for (const entry of result.entries) {
        if (entry.kind === 'directory') {
          queue.push(entry.path)
          continue
        }

        files.push(entry.path)
      }
    } catch {
      continue
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

export function filterQuickOpenItems(items: readonly QuickOpenItem[], query: string): QuickOpenItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...items]
  }

  return items.filter((item) => {
    return item.path.toLowerCase().includes(normalized) || item.label.toLowerCase().includes(normalized)
  })
}
