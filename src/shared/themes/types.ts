import type { editor } from 'monaco-editor'

export type ThemeKind = 'dark' | 'light'

export type MonacoBaseTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'

export type ThemeSource = 'builtin' | 'extension'

/** Semantic shell palette mapped to --deadeye-* CSS custom properties. */
export interface ThemeShellPalette {
  readonly accent: string
  readonly accentMuted: string
  readonly accentSubtle: string
  readonly accentGhost: string
  readonly danger: string
  readonly warning: string
  readonly success: string
  readonly bgBase: string
  readonly bgSurface: string
  readonly bgElevated: string
  readonly bgPanel: string
  readonly bgHover: string
  readonly bgActive: string
  readonly bgInput: string
  readonly textPrimary: string
  readonly textSecondary: string
  readonly textMuted: string
  readonly textDisabled: string
  readonly borderSubtle: string
  readonly borderDefault: string
  readonly borderStrong: string
  readonly shadowGlow: string
}

/** Syntax highlighting palette used to build Monaco token rules. */
export interface ThemeSyntaxPalette {
  readonly foreground: string
  readonly background: string
  readonly comment: string
  readonly keyword: string
  readonly string: string
  readonly number: string
  readonly constant: string
  readonly function: string
  readonly type: string
  readonly variable: string
  readonly parameter: string
  readonly operator: string
  readonly tag: string
  readonly attribute: string
  readonly invalid: string
  readonly invalidBackground: string
}

export interface ThemeDefinition {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly kind: ThemeKind
  readonly monacoBase: MonacoBaseTheme
  readonly shell: ThemeShellPalette
  readonly syntax: ThemeSyntaxPalette
  readonly source: ThemeSource
}

export interface ThemeShellChrome {
  readonly backgroundColor: string
  readonly titleBarColor: string
  readonly titleBarSymbolColor: string
  readonly colorScheme: ThemeKind
}

export interface ApplyShellThemePayload extends ThemeShellChrome {
  readonly titleBarHeight: number
}

export type RegisteredMonacoTheme = editor.IStandaloneThemeData
