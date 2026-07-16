import type { ThemeDefinition } from '../../../shared/themes'
import { shellPaletteToCssVariables } from '../../../shared/themes'

export function applyCssTheme(theme: ThemeDefinition): void {
  const root = document.documentElement
  root.dataset.theme = theme.id
  root.style.colorScheme = theme.kind

  const variables = shellPaletteToCssVariables(theme.shell)
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value)
  }

  const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.content = theme.shell.bgPanel
  }
}

export function resetCssTheme(): void {
  const root = document.documentElement
  delete root.dataset.theme
}
