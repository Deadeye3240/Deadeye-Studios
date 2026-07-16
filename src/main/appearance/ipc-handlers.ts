import { BrowserWindow, ipcMain } from 'electron'
import { normalizeUiScale } from '../../shared/density'
import { APPEARANCE_IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerAppearanceIpcHandlers(): void {
  ipcMain.handle(APPEARANCE_IPC_CHANNELS.setZoomFactor, (event, factor: number) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window || window.isDestroyed()) {
      return
    }

    window.webContents.setZoomFactor(normalizeUiScale(factor))
  })
}

export function applyInitialWindowZoom(window: BrowserWindow, factor: number): void {
  window.webContents.setZoomFactor(normalizeUiScale(factor))
  window.webContents.setVisualZoomLevelLimits(1, 1)
}
