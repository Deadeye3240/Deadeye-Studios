import { BUILTIN_THEMES } from './definitions'
import type { ThemeDefinition } from './types'

export const DEFAULT_THEME_ID = 'deadeye-dark'
export const DEADEYE_DARK_THEME_ID = DEFAULT_THEME_ID

const themeRegistry = new Map<string, ThemeDefinition>()

for (const theme of BUILTIN_THEMES) {
  themeRegistry.set(theme.id, theme)
}

export function registerTheme(theme: ThemeDefinition): void {
  themeRegistry.set(theme.id, theme)
}

export function unregisterTheme(themeId: string): void {
  const existing = themeRegistry.get(themeId)
  if (existing?.source === 'builtin') {
    return
  }

  themeRegistry.delete(themeId)
}

export function getTheme(themeId: string): ThemeDefinition | undefined {
  return themeRegistry.get(themeId)
}

export function getThemeOrDefault(themeId: string | undefined): ThemeDefinition {
  const resolvedId = resolveThemeId(themeId)
  return themeRegistry.get(resolvedId) ?? themeRegistry.get(DEFAULT_THEME_ID)!
}

export function resolveThemeId(themeId: string | undefined): string {
  if (themeId && themeRegistry.has(themeId)) {
    return themeId
  }

  return DEFAULT_THEME_ID
}

export function isKnownThemeId(themeId: string): boolean {
  return themeRegistry.has(themeId)
}

export function getAllThemes(): readonly ThemeDefinition[] {
  return Array.from(themeRegistry.values()).sort((left, right) => {
    if (left.id === DEFAULT_THEME_ID) {
      return -1
    }

    if (right.id === DEFAULT_THEME_ID) {
      return 1
    }

    return left.label.localeCompare(right.label)
  })
}

export function getThemeSelectOptions(): Array<{ value: string; label: string }> {
  return getAllThemes().map((theme) => ({
    value: theme.id,
    label: theme.label,
  }))
}
