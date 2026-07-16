import { getThemeOrDefault, themeToShellChrome } from '../../shared/themes'
import type { ThemeDefinition } from '../../shared/themes'
import { getTitleBarHeightForDensity, normalizeDensityMode } from '../../shared/density'
import type { EditorManager } from '../editor'
import { applyCssTheme } from './loaders/css-theme-loader'
import { registerMonacoTheme, setMonacoTheme } from './loaders/monaco-theme-loader'
import { applyElectronShellTheme } from './loaders/shell-theme-loader'

export class ThemeApplier {
  private activeThemeId: string | null = null

  apply(themeId: string | undefined, editorManager?: EditorManager | null): ThemeDefinition {
    const theme = getThemeOrDefault(themeId)

    if (this.activeThemeId === theme.id) {
      return theme
    }

    applyCssTheme(theme)
    registerMonacoTheme(theme)
    setMonacoTheme(theme.id)
    void applyElectronShellTheme({
      ...themeToShellChrome(theme),
      titleBarHeight: getCurrentTitleBarHeight(),
    })

    this.activeThemeId = theme.id

    if (editorManager) {
      editorManager.layout()
    }

    return theme
  }

  getActiveThemeId(): string | null {
    return this.activeThemeId
  }
}

let sharedThemeApplier: ThemeApplier | null = null

export function getThemeApplier(): ThemeApplier {
  if (!sharedThemeApplier) {
    sharedThemeApplier = new ThemeApplier()
  }

  return sharedThemeApplier
}

export function applyApplicationTheme(
  themeId: string | undefined,
  editorManager?: EditorManager | null,
): ThemeDefinition {
  return getThemeApplier().apply(themeId, editorManager)
}

function getCurrentTitleBarHeight(): number {
  const densityMode = normalizeDensityMode(document.documentElement.dataset.density)
  return getTitleBarHeightForDensity(densityMode)
}
