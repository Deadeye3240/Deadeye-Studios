import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { DeadeyeSettings, WorkspaceSettings } from '../../shared/settings'
import { DEFAULT_SETTINGS } from '../../shared/settings'
import { normalizeDensityMode, normalizeUiScale } from '../../shared/density'
import { resolveThemeId } from '../../shared/themes'

function normalizeAutoSave(value: string | undefined): WorkspaceSettings['autoSave'] {
  if (value === 'afterDelay' || value === 'onFocusChange') {
    return value
  }

  return 'off'
}

function normalizeLineNumbers(value: string | undefined): DeadeyeSettings['editor']['lineNumbers'] {
  if (value === 'off' || value === 'relative') {
    return value
  }

  return 'on'
}

const SETTINGS_DIR = path.join(os.homedir(), '.deadeye')
const SETTINGS_PATH = path.join(SETTINGS_DIR, 'settings.json')

let cachedSettings: DeadeyeSettings = structuredClone(DEFAULT_SETTINGS)

export function getSettingsPath(): string {
  return SETTINGS_PATH
}

export async function loadSettings(): Promise<DeadeyeSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<DeadeyeSettings>
    cachedSettings = mergeSettings(DEFAULT_SETTINGS, parsed)
    return cachedSettings
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code === 'ENOENT') {
      await saveSettings(DEFAULT_SETTINGS)
      cachedSettings = structuredClone(DEFAULT_SETTINGS)
      return cachedSettings
    }

    console.error('[Deadeye Studio] Failed to read settings; using defaults:', error)
    cachedSettings = structuredClone(DEFAULT_SETTINGS)
    return cachedSettings
  }
}

export async function saveSettings(settings: DeadeyeSettings): Promise<DeadeyeSettings> {
  await fs.mkdir(SETTINGS_DIR, { recursive: true })
  await fs.writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
  cachedSettings = settings
  return settings
}

export async function updateSettings(partial: Partial<DeadeyeSettings>): Promise<DeadeyeSettings> {
  const current = await loadSettings()
  const next = mergeSettings(current, partial)
  return saveSettings(next)
}

export async function resetSettings(): Promise<DeadeyeSettings> {
  return saveSettings(structuredClone(DEFAULT_SETTINGS))
}

export function getCachedSettings(): DeadeyeSettings {
  return cachedSettings
}

function mergeSettings(
  base: DeadeyeSettings,
  partial: Partial<DeadeyeSettings>,
): DeadeyeSettings {
  return {
    editor: {
      ...base.editor,
      ...partial.editor,
      lineNumbers: normalizeLineNumbers(partial.editor?.lineNumbers ?? base.editor.lineNumbers),
    },
    appearance: {
      ...base.appearance,
      ...partial.appearance,
      theme: resolveThemeId(partial.appearance?.theme ?? base.appearance.theme),
      uiScale: normalizeUiScale(partial.appearance?.uiScale ?? base.appearance.uiScale),
      densityMode: normalizeDensityMode(
        partial.appearance?.densityMode ?? base.appearance.densityMode,
      ),
    },
    workspace: {
      ...base.workspace,
      ...partial.workspace,
      autoSave: normalizeAutoSave(partial.workspace?.autoSave ?? base.workspace.autoSave),
    },
  }
}
