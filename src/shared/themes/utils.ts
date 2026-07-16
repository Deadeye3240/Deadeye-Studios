import type { ThemeDefinition, ThemeShellChrome, ThemeShellPalette } from './types'

const CSS_VAR_MAP: Readonly<Record<keyof ThemeShellPalette, string>> = {
  accent: '--deadeye-accent',
  accentMuted: '--deadeye-accent-muted',
  accentSubtle: '--deadeye-accent-subtle',
  accentGhost: '--deadeye-accent-ghost',
  danger: '--deadeye-danger',
  warning: '--deadeye-warning',
  success: '--deadeye-success',
  bgBase: '--deadeye-bg-base',
  bgSurface: '--deadeye-bg-surface',
  bgElevated: '--deadeye-bg-elevated',
  bgPanel: '--deadeye-bg-panel',
  bgHover: '--deadeye-bg-hover',
  bgActive: '--deadeye-bg-active',
  bgInput: '--deadeye-bg-input',
  textPrimary: '--deadeye-text-primary',
  textSecondary: '--deadeye-text-secondary',
  textMuted: '--deadeye-text-muted',
  textDisabled: '--deadeye-text-disabled',
  borderSubtle: '--deadeye-border-subtle',
  borderDefault: '--deadeye-border-default',
  borderStrong: '--deadeye-border-strong',
  shadowGlow: '--deadeye-shadow-glow',
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '').trim()
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.slice(0, 6)

  const parsed = Number.parseInt(value, 16)
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  }
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  const clamped = Math.min(1, Math.max(0, alpha))
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}${Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')}`
}

export function deriveAccentVariants(accent: string): Pick<
  ThemeShellPalette,
  'accentMuted' | 'accentSubtle' | 'accentGhost' | 'shadowGlow'
> {
  const { r, g, b } = hexToRgb(accent)
  return {
    accentMuted: withAlpha(accent, 0.4),
    accentSubtle: withAlpha(accent, 0.13),
    accentGhost: withAlpha(accent, 0.07),
    shadowGlow: `0 0 24px rgba(${r}, ${g}, ${b}, 0.08)`,
  }
}

export function shellPaletteToCssVariables(shell: ThemeShellPalette): Record<string, string> {
  const variables: Record<string, string> = {}

  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as Array<
    [keyof ThemeShellPalette, string]
  >) {
    variables[cssVar] = shell[key]
  }

  variables['--deadeye-border-focus'] = shell.accentMuted
  return variables
}

export function themeToShellChrome(theme: ThemeDefinition): ThemeShellChrome {
  return {
    backgroundColor: theme.shell.bgBase,
    titleBarColor: theme.shell.bgPanel,
    titleBarSymbolColor: theme.shell.textSecondary,
    colorScheme: theme.kind,
  }
}

export function stripHash(color: string): string {
  return color.replace('#', '')
}
