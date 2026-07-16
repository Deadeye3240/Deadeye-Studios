import { getThemeOrDefault, themeToShellChrome } from './themes'

const defaultTheme = getThemeOrDefault(undefined)
const defaultChrome = themeToShellChrome(defaultTheme)

/** Shared shell colors — derived from the default built-in theme. */
export const SHELL_BG_BASE = defaultTheme.shell.bgBase
export const SHELL_BG_SURFACE = defaultTheme.shell.bgSurface
export const SHELL_BG_PANEL = defaultTheme.shell.bgPanel
export const SHELL_TEXT_SECONDARY = defaultTheme.shell.textSecondary

/** Native title bar overlay (Windows/Linux custom chrome). */
export const SHELL_TITLE_BAR = {
  color: defaultChrome.titleBarColor,
  symbolColor: defaultChrome.titleBarSymbolColor,
  height: 32,
} as const
