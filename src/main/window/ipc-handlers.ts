import { app, BrowserWindow, ipcMain } from 'electron'
import { WINDOW_IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerWindowIpcHandlers(
  createWindow: () => void,
  getMainWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle(WINDOW_IPC_CHANNELS.newWindow, () => {
    createWindow()
  })

  ipcMain.handle(WINDOW_IPC_CHANNELS.exit, () => {
    app.quit()
  })

  ipcMain.handle(WINDOW_IPC_CHANNELS.toggleFullScreen, () => {
    const window = getMainWindow()
    if (!window || window.isDestroyed()) {
      return
    }

    window.setFullScreen(!window.isFullScreen())
  })
}
