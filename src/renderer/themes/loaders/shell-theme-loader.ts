import type { ApplyShellThemePayload } from '../../../shared/themes'
import { THEME_IPC_CHANNELS } from '../../../shared/ipc-channels'

export async function applyElectronShellTheme(payload: ApplyShellThemePayload): Promise<void> {
  if (!window.deadeye?.theme) {
    return
  }

  await window.deadeye.theme.applyShell(payload)
}

export function getThemeBridge(): typeof window.deadeye.theme | undefined {
  return window.deadeye?.theme
}

export { THEME_IPC_CHANNELS }
