import { BrowserWindow, ipcMain } from 'electron'
import type { DeadeyeSettings } from '../../shared/settings'
import { SETTINGS_IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  getCachedSettings,
  loadSettings,
  resetSettings,
  updateSettings,
} from './settings-service'

export function registerSettingsIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  void loadSettings()

  ipcMain.handle(SETTINGS_IPC_CHANNELS.get, async (): Promise<DeadeyeSettings> => {
    return loadSettings()
  })

  ipcMain.handle(
    SETTINGS_IPC_CHANNELS.update,
    async (_event, partial: Partial<DeadeyeSettings>): Promise<DeadeyeSettings> => {
      const next = await updateSettings(partial)
      broadcastSettingsChanged(getMainWindow(), next)
      return next
    },
  )

  ipcMain.handle(SETTINGS_IPC_CHANNELS.reset, async (): Promise<DeadeyeSettings> => {
    const next = await resetSettings()
    broadcastSettingsChanged(getMainWindow(), next)
    return next
  })
}

function broadcastSettingsChanged(window: BrowserWindow | null, settings: DeadeyeSettings): void {
  if (!window || window.isDestroyed()) {
    return
  }

  window.webContents.send(SETTINGS_IPC_CHANNELS.changed, settings)
}

export { getCachedSettings }
