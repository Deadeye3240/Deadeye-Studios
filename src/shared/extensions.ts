export type ExtensionContributionKind = 'theme' | 'command' | 'panel' | 'language'

export interface ExtensionThemeContribution {
  readonly id: string
  readonly label: string
  readonly path: string
}

export interface ExtensionCommandContribution {
  readonly id: string
  readonly title: string
  readonly category?: string
}

export interface ExtensionPanelContribution {
  readonly id: string
  readonly title: string
  readonly icon?: string
}

export interface ExtensionLanguageContribution {
  readonly id: string
  readonly extensions: readonly string[]
  readonly aliases?: readonly string[]
}

export interface ExtensionContributions {
  readonly themes?: readonly ExtensionThemeContribution[]
  readonly commands?: readonly ExtensionCommandContribution[]
  readonly panels?: readonly ExtensionPanelContribution[]
  readonly languages?: readonly ExtensionLanguageContribution[]
}

export interface DeadeyeExtensionManifest {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description?: string
  readonly publisher?: string
  readonly contributes?: ExtensionContributions
}

export interface LoadedExtension {
  readonly manifest: DeadeyeExtensionManifest
  readonly rootPath: string
}

export const EXTENSION_MANIFEST_FILENAME = 'deadeye-extension.json'
