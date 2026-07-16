import { ipcMain } from 'electron'
import { EXTENSION_IPC_CHANNELS } from '../../shared/ipc-channels'
import { discoverUserExtensions, type DiscoveredExtension } from './extension-discovery'

export function registerExtensionIpcHandlers(): void {
  ipcMain.handle(EXTENSION_IPC_CHANNELS.discoverUser, async (): Promise<DiscoveredExtension[]> => {
    return discoverUserExtensions()
  })
}
