import { buildMonacoTheme, getAllThemes, resolveThemeId } from '../../../shared/themes'
import type { ThemeDefinition } from '../../../shared/themes'
import { monaco } from '../../editor/monaco-setup'

let monacoThemesRegistered = false

export function registerAllMonacoThemes(monacoApi: typeof monaco = monaco): void {
  for (const theme of getAllThemes()) {
    registerMonacoTheme(theme, monacoApi)
  }

  monacoThemesRegistered = true
}

export function registerMonacoTheme(
  theme: ThemeDefinition,
  monacoApi: typeof monaco = monaco,
): void {
  monacoApi.editor.defineTheme(theme.id, buildMonacoTheme(theme))
}

export function setMonacoTheme(themeId: string | undefined, monacoApi: typeof monaco = monaco): void {
  if (!monacoThemesRegistered) {
    registerAllMonacoThemes(monacoApi)
  }

  monacoApi.editor.setTheme(resolveThemeId(themeId))
}

export function isMonacoThemesRegistered(): boolean {
  return monacoThemesRegistered
}
