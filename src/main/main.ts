import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHELL_BG_BASE, SHELL_TITLE_BAR } from '../shared/shell-theme'
import { APP_VERSION } from '../shared/version'
import { registerFilesystemIpcHandlers } from './filesystem'
import { registerGitIpcHandlers } from './git'
import { installApplicationMenu } from './menu'
import { registerWindowIpcHandlers } from './window/ipc-handlers'
import { registerSettingsIpcHandlers } from './settings'
import { disposeTerminalService, registerTerminalIpcHandlers } from './terminal'
import { registerAppearanceIpcHandlers, applyInitialWindowZoom } from './appearance/ipc-handlers'
import { registerExtensionIpcHandlers } from './extensions/ipc-handlers'
import { registerThemeIpcHandlers } from './themes/ipc-handlers'
import { loadSettings } from './settings/settings-service'
import { registerWorkspaceStateIpcHandlers } from './workspace-state'
import { getThemeOrDefault, themeToShellChrome } from '../shared/themes'
import {
  getTitleBarOverlayHeight,
  normalizeDensityMode,
  normalizeUiScale,
} from '../shared/density'
import { DEFAULT_SETTINGS } from '../shared/settings'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

const isDev = !app.isPackaged

function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function resolveAppIcon(): string | undefined {
  const iconPath = path.join(__dirname, '../assets/icon.png')
  return fs.existsSync(iconPath) ? iconPath : undefined
}

function showMainWindow(
  window: BrowserWindow,
  settings: Awaited<ReturnType<typeof loadSettings>>,
): void {
  try {
    const chrome = themeToShellChrome(getThemeOrDefault(settings.appearance.theme))
    window.setBackgroundColor(chrome.backgroundColor)
    applyInitialWindowZoom(window, normalizeUiScale(settings.appearance.uiScale))
  } catch (error) {
    console.error('[Deadeye Studio] Failed to apply startup appearance:', error)
  }

  if (!window.isDestroyed()) {
    window.show()
  }
}

function createWindow(initialSettings: Awaited<ReturnType<typeof loadSettings>>): void {
  const icon = resolveAppIcon()
  const densityMode = normalizeDensityMode(initialSettings.appearance.densityMode)
  const titleBarOverlayHeight = getTitleBarOverlayHeight(densityMode)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: `Deadeye Studio v${APP_VERSION}`,
    backgroundColor: SHELL_BG_BASE,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const }
      : {}),
    ...(process.platform === 'win32' || process.platform === 'linux'
      ? {
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: {
            color: SHELL_TITLE_BAR.color,
            symbolColor: SHELL_TITLE_BAR.symbolColor,
            height: titleBarOverlayHeight,
          },
        }
      : {}),
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.setMenuBarVisibility(true)
  mainWindow.setAutoHideMenuBar(false)

  const revealWindow = (): void => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    showMainWindow(mainWindow, initialSettings)
  }

  mainWindow.once('ready-to-show', revealWindow)

  // Fallback: if ready-to-show never fires (e.g. renderer hang), still surface the window.
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow?.setMenuBarVisibility(true)
    mainWindow?.setAutoHideMenuBar(false)

    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        console.warn('[Deadeye Studio] ready-to-show did not reveal the window; showing after load.')
        revealWindow()
      }
    }, 5000)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(
      '[Deadeye Studio] Renderer failed to load:',
      errorCode,
      errorDescription,
      validatedURL,
    )
    revealWindow()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    if (process.env.DEADEYE_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  let settings: Awaited<ReturnType<typeof loadSettings>>

  try {
    settings = await loadSettings()
  } catch (error) {
    console.error('[Deadeye Studio] Failed to load settings; using defaults:', error)
    settings = structuredClone(DEFAULT_SETTINGS)
  }

  const startupTheme = getThemeOrDefault(settings.appearance.theme)
  nativeTheme.themeSource = startupTheme.kind

  registerThemeIpcHandlers()
  registerAppearanceIpcHandlers()
  registerExtensionIpcHandlers()
  registerFilesystemIpcHandlers(getMainWindow)
  registerTerminalIpcHandlers(getMainWindow)
  registerSettingsIpcHandlers(getMainWindow)
  registerGitIpcHandlers()
  registerWorkspaceStateIpcHandlers()
  registerWindowIpcHandlers(() => {
    createWindow(settings)
  }, getMainWindow)
  installApplicationMenu(getMainWindow, {
    onToggleFullScreen: () => {
      const window = getMainWindow()
      if (!window || window.isDestroyed()) {
        return
      }

      window.setFullScreen(!window.isFullScreen())
    },
    onExit: () => {
      app.quit()
    },
  })
  createWindow(settings)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void loadSettings()
        .then((savedSettings) => {
          createWindow(savedSettings)
        })
        .catch((error) => {
          console.error('[Deadeye Studio] Failed to restore window on activate:', error)
          createWindow(settings)
        })
    }
  })
}).catch((error) => {
  console.error('[Deadeye Studio] Application failed to start:', error)
  app.exit(1)
})

app.on('window-all-closed', () => {
  disposeTerminalService()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  disposeTerminalService()
})
