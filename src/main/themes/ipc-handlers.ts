import { BrowserWindow, ipcMain, nativeTheme } from 'electron'
import type { ApplyShellThemePayload } from '../../shared/themes'
import { THEME_IPC_CHANNELS } from '../../shared/ipc-channels'
import { SHELL_TITLE_BAR } from '../../shared/shell-theme'
export function registerThemeIpcHandlers(): void {
  ipcMain.handle(THEME_IPC_CHANNELS.applyShell, (event, payload: ApplyShellThemePayload) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window || window.isDestroyed()) {
      return
    }

    nativeTheme.themeSource = payload.colorScheme
    window.setBackgroundColor(payload.backgroundColor)

    if (process.platform === 'win32' || process.platform === 'linux') {
      try {
        window.setTitleBarOverlay({
          color: payload.titleBarColor,
          symbolColor: payload.titleBarSymbolColor,
          height: payload.titleBarHeight ?? SHELL_TITLE_BAR.height,
        })
      } catch {
        // Title bar overlay may be unavailable on some window configurations.
      }
    }
  })
}
