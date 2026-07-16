/**
 * Central language registry for Deadeye Studio.
 *
 * Extension → language ID → Monaco mode → theme rules → editor profile.
 * Future languages register here without touching detection or explorer code.
 */

export interface LanguageDescriptor {
  readonly id: string
  readonly label: string
  readonly extensions: readonly string[]
  readonly filenames?: readonly string[]
  readonly icon: string
  readonly tabSize?: number
  readonly insertSpaces?: boolean
  readonly semanticHighlighting?: boolean
}

export const LANGUAGE_REGISTRY: readonly LanguageDescriptor[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    icon: 'typescript',
    tabSize: 2,
    insertSpaces: true,
    semanticHighlighting: true,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    icon: 'javascript',
    tabSize: 2,
    insertSpaces: true,
    semanticHighlighting: true,
  },
  {
    id: 'json',
    label: 'JSON',
    extensions: ['.json', '.jsonc'],
    icon: 'json',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'lua',
    label: 'Lua',
    extensions: ['.lua'],
    icon: 'lua',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'cpp',
    label: 'C++',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.hh', '.ino'],
    icon: 'cpp',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'c',
    label: 'C',
    extensions: ['.c', '.h'],
    icon: 'c',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'csharp',
    label: 'C#',
    extensions: ['.cs'],
    icon: 'csharp',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'python',
    label: 'Python',
    extensions: ['.py', '.pyw', '.pyi'],
    icon: 'python',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'html',
    label: 'HTML',
    extensions: ['.html', '.htm'],
    icon: 'html',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'css',
    label: 'CSS',
    extensions: ['.css'],
    icon: 'css',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'scss',
    label: 'SCSS',
    extensions: ['.scss'],
    icon: 'scss',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'less',
    label: 'Less',
    extensions: ['.less'],
    icon: 'less',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    extensions: ['.md', '.markdown'],
    icon: 'markdown',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'xml',
    label: 'XML',
    extensions: ['.xml', '.svg'],
    icon: 'xml',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'yaml',
    label: 'YAML',
    extensions: ['.yaml', '.yml'],
    icon: 'yaml',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'sql',
    label: 'SQL',
    extensions: ['.sql'],
    icon: 'sql',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'shell',
    label: 'Shell',
    extensions: ['.sh', '.bash'],
    icon: 'shell',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'powershell',
    label: 'PowerShell',
    extensions: ['.ps1'],
    icon: 'powershell',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'bat',
    label: 'Batch',
    extensions: ['.bat', '.cmd'],
    icon: 'bat',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'rust',
    label: 'Rust',
    extensions: ['.rs'],
    icon: 'rust',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'go',
    label: 'Go',
    extensions: ['.go'],
    icon: 'go',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'java',
    label: 'Java',
    extensions: ['.java'],
    icon: 'java',
    tabSize: 4,
    insertSpaces: true,
  },
  {
    id: 'toml',
    label: 'TOML',
    extensions: ['.toml'],
    icon: 'toml',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'glsl',
    label: 'GLSL',
    extensions: ['.glsl', '.frag', '.vert', '.fs', '.vs'],
    icon: 'shader',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'hlsl',
    label: 'HLSL',
    extensions: ['.hlsl', '.fx', '.fxh', '.hlsli'],
    icon: 'shader',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'dockerfile',
    label: 'Dockerfile',
    extensions: [],
    filenames: ['dockerfile'],
    icon: 'docker',
    tabSize: 2,
    insertSpaces: true,
  },
  {
    id: 'plaintext',
    label: 'Plain Text',
    extensions: ['.txt', '.log'],
    icon: 'text',
    tabSize: 2,
    insertSpaces: true,
  },
] as const

const extensionIndex = new Map<string, LanguageDescriptor>()
const filenameIndex = new Map<string, LanguageDescriptor>()
const idIndex = new Map<string, LanguageDescriptor>()

for (const descriptor of LANGUAGE_REGISTRY) {
  idIndex.set(descriptor.id, descriptor)

  for (const extension of descriptor.extensions) {
    extensionIndex.set(extension.toLowerCase(), descriptor)
  }

  for (const filename of descriptor.filenames ?? []) {
    filenameIndex.set(filename.toLowerCase(), descriptor)
  }
}

export function getLanguageDescriptor(languageId: string): LanguageDescriptor | null {
  return idIndex.get(languageId) ?? null
}

export function resolveLanguageFromPath(filePath: string): LanguageDescriptor | null {
  const normalized = filePath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop()?.toLowerCase() ?? ''

  if (!fileName) {
    return null
  }

  const byFilename = filenameIndex.get(fileName)
  if (byFilename) {
    return byFilename
  }

  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1) {
    return null
  }

  const extension = fileName.slice(dotIndex)
  return extensionIndex.get(extension) ?? null
}

export function detectLanguageFromPath(filePath: string): string {
  return resolveLanguageFromPath(filePath)?.id ?? 'plaintext'
}

export function getLanguageLabel(languageId: string): string {
  return getLanguageDescriptor(languageId)?.label ?? formatFallbackLabel(languageId)
}

export function getFileIconClass(filePath: string): string {
  const descriptor = resolveLanguageFromPath(filePath)
  if (descriptor) {
    return `tree-icon--${descriptor.icon}`
  }

  return 'tree-icon--file'
}

function formatFallbackLabel(languageId: string): string {
  if (!languageId) {
    return 'Plain Text'
  }

  return languageId.charAt(0).toUpperCase() + languageId.slice(1)
}

export function getRegistryLanguagesForExtensions(): Array<{
  id: string
  extensions: string[]
}> {
  return LANGUAGE_REGISTRY.filter((descriptor) => descriptor.id !== 'plaintext').map(
    (descriptor) => ({
      id: descriptor.id,
      extensions: [...descriptor.extensions],
    }),
  )
}
