export type SupportedLanguageId =
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'html'
  | 'css'
  | 'lua'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'python'

/**
 * Languages with intelligence providers wired today.
 * Syntax highlighting for all registry languages is handled via Monaco tokenizers.
 */
export const SUPPORTED_LANGUAGE_IDS: readonly SupportedLanguageId[] = [
  'typescript',
  'javascript',
  'json',
  'html',
  'css',
  'lua',
  'cpp',
  'c',
  'csharp',
  'python',
]

export interface LanguageServerCapabilities {
  readonly completion: boolean
  readonly diagnostics: boolean
  readonly hover: boolean
  readonly definition: boolean
}

export interface LanguageServerDescriptor {
  readonly languageId: SupportedLanguageId
  readonly label: string
  readonly capabilities: LanguageServerCapabilities
}

export interface LspPosition {
  readonly line: number
  readonly character: number
}

export interface LspRange {
  readonly start: LspPosition
  readonly end: LspPosition
}

export interface LspLocation {
  readonly uri: string
  readonly range: LspRange
}

export interface LspDiagnostic {
  readonly message: string
  readonly severity: 'error' | 'warning' | 'info' | 'hint'
  readonly range: LspRange
}

export interface LspCompletionItem {
  readonly label: string
  readonly kind?: string
  readonly detail?: string
  readonly insertText?: string
}

export interface LspHoverResult {
  readonly contents: string
  readonly range?: LspRange
}
