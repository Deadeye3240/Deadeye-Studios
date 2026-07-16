import { BrowserWindow, ipcMain } from 'electron'
import type {
  CreateTerminalOptions,
  CreateTerminalResult,
} from '../../shared/terminal'
import { TERMINAL_IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createTerminal,
  disposeAllTerminals,
  killTerminal,
  resizeTerminal,
  setTerminalCallbacks,
  writeTerminal,
} from './terminal-service'

export function registerTerminalIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  setTerminalCallbacks(
    (id, data) => {
      const window = getMainWindow()
      if (!window || window.isDestroyed()) {
        return
      }

      window.webContents.send(TERMINAL_IPC_CHANNELS.data, { id, data })
    },
    (id, code) => {
      const window = getMainWindow()
      if (!window || window.isDestroyed()) {
        return
      }

      window.webContents.send(TERMINAL_IPC_CHANNELS.exit, { id, code })
    },
  )

  ipcMain.handle(
    TERMINAL_IPC_CHANNELS.create,
    async (_event, options?: CreateTerminalOptions): Promise<CreateTerminalResult> => {
      return createTerminal(options ?? {})
    },
  )

  ipcMain.handle(TERMINAL_IPC_CHANNELS.write, async (_event, id: string, data: string) => {
    if (typeof id !== 'string' || typeof data !== 'string') {
      throw new Error('terminal write requires id and data strings')
    }

    writeTerminal(id, data)
  })

  ipcMain.handle(
    TERMINAL_IPC_CHANNELS.resize,
    async (_event, id: string, cols: number, rows: number) => {
      if (typeof id !== 'string' || typeof cols !== 'number' || typeof rows !== 'number') {
        throw new Error('terminal resize requires id, cols, and rows')
      }

      resizeTerminal(id, cols, rows)
    },
  )

  ipcMain.handle(TERMINAL_IPC_CHANNELS.kill, async (_event, id: string) => {
    if (typeof id !== 'string') {
      throw new Error('terminal kill requires an id string')
    }

    killTerminal(id)
  })
}

export function disposeTerminalService(): void {
  disposeAllTerminals()
}
