import { app, BrowserWindow, Menu } from 'electron'
import type { CommandId } from '../../shared/commands'
import { COMMAND_IDS } from '../../shared/commands'
import {
  APPLICATION_MENU_DEFINITION,
  type ApplicationMenuItemDefinition,
} from '../../shared/menu-definition'
import { MENU_IPC_CHANNELS } from '../../shared/ipc-channels'

export interface ApplicationMenuOptions {
  readonly onToggleFullScreen?: () => void
  readonly onExit?: () => void
}

function toElectronAccelerator(accelerator: string | undefined): string | undefined {
  if (!accelerator) {
    return undefined
  }

  return accelerator.replace(/Ctrl\+/g, 'CmdOrCtrl+')
}

function mapMenuItem(
  entry: ApplicationMenuItemDefinition,
  sendCommand: (commandId: CommandId) => void,
  options: ApplicationMenuOptions,
): Electron.MenuItemConstructorOptions | null {
  if (entry.type === 'separator') {
    return { type: 'separator' }
  }

  if (!entry.commandId) {
    return null
  }

  if (entry.commandId === COMMAND_IDS.exit) {
    return {
      label: entry.label ?? '',
      accelerator: toElectronAccelerator(entry.accelerator),
      click: () => {
        if (options.onExit) {
          options.onExit()
          return
        }

        app.quit()
      },
    }
  }

  return {
    label: entry.label ?? '',
    accelerator: toElectronAccelerator(entry.accelerator),
    click: () => sendCommand(entry.commandId!),
  }
}

export function createApplicationMenu(
  getMainWindow: () => BrowserWindow | null,
  options: ApplicationMenuOptions = {},
): Menu {
  const sendCommand = (commandId: CommandId): void => {
    const window = getMainWindow()
    if (!window || window.isDestroyed()) {
      return
    }

    window.webContents.send(MENU_IPC_CHANNELS.executeCommand, commandId)
  }

  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: 'About Deadeye Studio',
                click: () => sendCommand(COMMAND_IDS.showAbout),
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    ...APPLICATION_MENU_DEFINITION.map((menu) => ({
      label: menu.label,
      submenu: menu.items
        .map((item) => mapMenuItem(item, sendCommand, options))
        .filter((item): item is Electron.MenuItemConstructorOptions => item !== null),
    })),
  ]

  return Menu.buildFromTemplate(template)
}

export function installApplicationMenu(
  getMainWindow: () => BrowserWindow | null,
  options: ApplicationMenuOptions = {},
): void {
  const menu = createApplicationMenu(getMainWindow, options)
  Menu.setApplicationMenu(menu)
}
