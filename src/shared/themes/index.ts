export {
  BUILTIN_THEMES,
  DEADEYE_CARBON_THEME,
  DEADEYE_DARK_THEME,
  DEADEYE_LIGHT_THEME,
  DEADEYE_MIDNIGHT_THEME,
  DRACULA_THEME,
  MONOKAI_THEME,
  NORD_THEME,
} from './definitions'
export { buildMonacoTheme } from './monaco-builder'
export {
  DEFAULT_THEME_ID,
  DEADEYE_DARK_THEME_ID,
  getAllThemes,
  getTheme,
  getThemeOrDefault,
  getThemeSelectOptions,
  isKnownThemeId,
  registerTheme,
  resolveThemeId,
  unregisterTheme,
} from './registry'
export type {
  ApplyShellThemePayload,
  MonacoBaseTheme,
  RegisteredMonacoTheme,
  ThemeDefinition,
  ThemeKind,
  ThemeShellChrome,
  ThemeShellPalette,
  ThemeSource,
  ThemeSyntaxPalette,
} from './types'
export {
  deriveAccentVariants,
  shellPaletteToCssVariables,
  stripHash,
  themeToShellChrome,
  withAlpha,
} from './utils'
