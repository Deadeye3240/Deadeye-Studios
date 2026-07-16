import { getFilesystemClient } from '../filesystem'

export interface SearchMatch {
  readonly filePath: string
  readonly line: number
  readonly column: number
  readonly preview: string
}

export interface WorkspaceSearchOptions {
  readonly query: string
  readonly replaceWith?: string
  readonly useRegex?: boolean
  readonly caseSensitive?: boolean
  readonly fileFilter?: string
}

export async function searchWorkspace(
  workspaceRoot: string,
  options: WorkspaceSearchOptions,
): Promise<SearchMatch[]> {
  const files = await listAllFiles(workspaceRoot)
  const matches: SearchMatch[] = []
  const filter = options.fileFilter?.trim().toLowerCase() ?? ''

  for (const filePath of files) {
    if (filter && !filePath.toLowerCase().includes(filter)) {
      continue
    }

    try {
      const content = await getFilesystemClient().readFile(filePath)
      const fileMatches = findMatchesInContent(filePath, content.content, options)
      matches.push(...fileMatches)
    } catch {
      continue
    }
  }

  return matches
}

export async function replaceInWorkspace(
  workspaceRoot: string,
  options: WorkspaceSearchOptions,
): Promise<number> {
  if (!options.replaceWith && options.replaceWith !== '') {
    return 0
  }

  const files = await listAllFiles(workspaceRoot)
  const filter = options.fileFilter?.trim().toLowerCase() ?? ''
  let replacementCount = 0

  for (const filePath of files) {
    if (filter && !filePath.toLowerCase().includes(filter)) {
      continue
    }

    try {
      const filesystem = getFilesystemClient()
      const file = await filesystem.readFile(filePath)
      const { nextContent, count } = replaceInContent(file.content, options)

      if (count > 0) {
        await filesystem.writeFile(filePath, nextContent)
        replacementCount += count
      }
    } catch {
      continue
    }
  }

  return replacementCount
}

function findMatchesInContent(
  filePath: string,
  content: string,
  options: WorkspaceSearchOptions,
): SearchMatch[] {
  const pattern = buildPattern(options)
  if (!pattern) {
    return []
  }

  const matches: SearchMatch[] = []
  const lines = content.split('\n')

  for (const [index, line] of lines.entries()) {
    if (options.useRegex) {
      const regex = new RegExp(pattern.source, pattern.flags + (pattern.global ? '' : 'g'))
      let match: RegExpExecArray | null

      while ((match = regex.exec(line)) !== null) {
        matches.push({
          filePath,
          line: index + 1,
          column: match.index + 1,
          preview: line.trim(),
        })

        if (match[0].length === 0) {
          regex.lastIndex += 1
        }
      }

      continue
    }

    let searchIndex = 0
    while (searchIndex < line.length) {
      const foundIndex = options.caseSensitive
        ? line.indexOf(options.query, searchIndex)
        : line.toLowerCase().indexOf(options.query.toLowerCase(), searchIndex)

      if (foundIndex === -1) {
        break
      }

      matches.push({
        filePath,
        line: index + 1,
        column: foundIndex + 1,
        preview: line.trim(),
      })

      searchIndex = foundIndex + options.query.length
    }
  }

  return matches
}

function replaceInContent(
  content: string,
  options: WorkspaceSearchOptions,
): { nextContent: string; count: number } {
  const pattern = buildPattern(options)
  if (!pattern) {
    return { nextContent: content, count: 0 }
  }

  if (options.useRegex) {
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
    const count = (content.match(globalPattern) ?? []).length
    return {
      nextContent: content.replace(globalPattern, options.replaceWith ?? ''),
      count,
    }
  }

  const flags = options.caseSensitive ? 'g' : 'gi'
  const escaped = escapeRegExp(options.query)
  const regex = new RegExp(escaped, flags)
  const count = (content.match(regex) ?? []).length

  return {
    nextContent: content.replace(regex, options.replaceWith ?? ''),
    count,
  }
}

function buildPattern(options: WorkspaceSearchOptions): RegExp | null {
  if (!options.query) {
    return null
  }

  if (options.useRegex) {
    try {
      const flags = options.caseSensitive ? 'g' : 'gi'
      return new RegExp(options.query, flags)
    } catch {
      return null
    }
  }

  const flags = options.caseSensitive ? 'g' : 'gi'
  return new RegExp(escapeRegExp(options.query), flags)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function listAllFiles(rootPath: string): Promise<string[]> {
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

  return files
}
