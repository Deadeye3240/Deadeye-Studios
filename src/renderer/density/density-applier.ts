import type { AppearanceSettings } from '../../shared/settings'
import {
  DENSITY_LAYOUT_VARS,
  getTitleBarHeightForDensity,
  normalizeDensityMode,
  normalizeUiScale,
  type DensityMode,
} from '../../shared/density'
import { getThemeOrDefault, themeToShellChrome } from '../../shared/themes'
import { applyElectronShellTheme } from '../themes/loaders/shell-theme-loader'

export function applyDensityAppearance(appearance: AppearanceSettings): void {
  const densityMode = normalizeDensityMode(appearance.densityMode)
  const uiScale = normalizeUiScale(appearance.uiScale)
  const root = document.documentElement

  root.dataset.density = densityMode
  root.style.setProperty('--deadeye-ui-scale', String(uiScale))

  const layoutVars = DENSITY_LAYOUT_VARS[densityMode]
  for (const [name, value] of Object.entries(layoutVars)) {
    root.style.setProperty(name, value)
  }

  void applyUiZoomFactor(uiScale)
  void syncShellChromeForDensity(appearance, densityMode)
}

async function applyUiZoomFactor(scale: number): Promise<void> {
  if (!window.deadeye?.appearance) {
    return
  }

  await window.deadeye.appearance.setZoomFactor(scale)
}

async function syncShellChromeForDensity(
  appearance: AppearanceSettings,
  densityMode: DensityMode,
): Promise<void> {
  const theme = getThemeOrDefault(appearance.theme)
  const chrome = themeToShellChrome(theme)

  await applyElectronShellTheme({
    ...chrome,
    titleBarHeight: getTitleBarHeightForDensity(densityMode),
  })
}
