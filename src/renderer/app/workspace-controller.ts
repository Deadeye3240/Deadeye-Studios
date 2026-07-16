import type { AppShellElements } from './shell'
import { AppLayoutManager } from './layout-manager'
import { formatLanguageLabel } from './formatters'
import { CommandPalette, CommandRegistry } from '../commands'
import { COMMAND_IDS } from '../../shared/commands'
import { APP_NAME, APP_VERSION } from '../../shared/version'
import type { CommandDefinition } from '../../shared/commands'
import type { CommandId } from '../../shared/commands'
import type { DeadeyeSettings } from '../../shared/settings'
import type { EditorManager } from '../editor'
import { getDialogService } from '../dialogs'
import { ExtensionLoader } from '../extensions'
import { FileExplorer } from '../explorer'
import { GitDiffViewer, SourceControlPanel } from '../git'
import { LanguageIntelligenceManager } from '../language'
import { GoToLinePanel, QuickOpenPanel, recordRecentFile } from '../navigation'
import { ToastManager } from '../notifications'
import { getOverlayHost } from '../overlay'
import { WorkspaceSearchPanel } from '../search'
import { getSettingsClient, SettingsApplier, SettingsPanel } from '../settings'
import { TabBar } from '../tabs'
import { TerminalPanel } from '../terminal'
import { ApplicationMenuBar } from '../menu'
import { BreadcrumbsBar } from '../ui'
import { WelcomeScreen, showAboutDialog } from '../welcome'
import { getWorkspaceHistoryClient } from '../workspace/workspace-history-client'
import type { WorkspaceManager, WorkspaceUnsubscribe } from '../workspace'
import { createNewTextFile, recordWorkspaceFile, recordWorkspaceProject } from '../workspace'
import { dirname, normalizeWorkspacePath } from '../workspace/path-utils'
import { getFilesystemClient } from '../filesystem'
import { recoverLastSession } from '../workspace/session-recovery'
import { registerTheme, type ThemeDefinition } from '../../shared/themes'
import type { ExtensionThemeContribution } from '../../shared/extensions'
import { registerMonacoTheme } from '../themes'

export class WorkspaceEditorController {
  private readonly workspace: WorkspaceManager
  private readonly editorManager: EditorManager
  private readonly shell: AppShellElements
  private readonly unsubscribers: WorkspaceUnsubscribe[] = []
  private readonly commandRegistry: CommandRegistry
  private readonly toastManager: ToastManager
  private readonly layoutManager: AppLayoutManager
  private readonly commandPalette: CommandPalette
  private readonly quickOpen: QuickOpenPanel
  private readonly goToLine: GoToLinePanel
  private readonly searchPanel: WorkspaceSearchPanel
  private readonly settingsPanel: SettingsPanel
  private readonly terminalPanel: TerminalPanel
  private readonly settingsApplier = new SettingsApplier()
  private readonly languageManager = new LanguageIntelligenceManager()
  private readonly sourceControlPanel: SourceControlPanel
  private readonly gitDiffViewer: GitDiffViewer
  private readonly extensionLoader = new ExtensionLoader()
  private readonly welcomeScreen: WelcomeScreen
  private readonly breadcrumbs: BreadcrumbsBar
  private readonly startupSettings: DeadeyeSettings
  private applicationMenuBar: ApplicationMenuBar | null = null
  private tabBar: TabBar | null = null
  private fileExplorer: FileExplorer | null = null
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  private currentSettings: DeadeyeSettings | null = null
  private editorStatusBound = false
  private disposed = false
  private welcomeExitPromise: Promise<void> | null = null

  constructor(
    workspace: WorkspaceManager,
    editorManager: EditorManager,
    shell: AppShellElements,
    startupSettings: DeadeyeSettings,
  ) {
    this.workspace = workspace
    this.editorManager = editorManager
    this.shell = shell
    this.startupSettings = startupSettings
    this.toastManager = new ToastManager(shell.toastContainer)
    this.layoutManager = new AppLayoutManager(shell, () => {
      this.editorManager.layout()
    })
    this.commandRegistry = new CommandRegistry({
      onError: (error, commandId) => {
        const message = error instanceof Error ? error.message : String(error)
        this.toastManager.error(`Command failed (${commandId}): ${message}`)
      },
    })
    this.commandPalette = new CommandPalette(shell.overlayRoot)
    this.quickOpen = new QuickOpenPanel(shell.overlayRoot)
    this.goToLine = new GoToLinePanel(shell.overlayRoot)
    this.searchPanel = new WorkspaceSearchPanel(shell.overlayRoot)
    this.settingsPanel = new SettingsPanel(shell.settingsDrawerHost)
    this.terminalPanel = new TerminalPanel(shell.terminalPanel)
    this.sourceControlPanel = new SourceControlPanel(shell.sourceControlContainer)
    this.gitDiffViewer = new GitDiffViewer(shell.overlayRoot)
    this.welcomeScreen = new WelcomeScreen(shell.welcomeContainer)
    this.breadcrumbs = new BreadcrumbsBar(shell.breadcrumbsContainer)
  }

  async initialize(): Promise<void> {
    if (this.disposed) {
      throw new Error('Cannot initialize a disposed WorkspaceEditorController')
    }

    this.tabBar = new TabBar(this.workspace, {
      container: this.shell.tabBarContainer,
    })
    this.tabBar.initialize()

    this.fileExplorer = new FileExplorer(this.workspace, {
      container: this.shell.explorerContainer,
    })
    this.fileExplorer.initialize()

    this.sourceControlPanel.setCallbacks({
      onOpenFile: (filePath) => {
        void this.openFileFromQuickOpen(filePath)
      },
      onShowDiff: (filePath, diff) => {
        this.gitDiffViewer.show(filePath, diff)
      },
      onError: (message) => {
        this.toastManager.error(message)
      },
      onStatusChanged: () => {
        this.updateGitStatusLabel()
      },
    })

    await this.extensionLoader.initialize({
      onThemeRegistered: (theme, extension) => {
        this.registerExtensionTheme(theme, extension.rootPath)
      },
      onCommandRegistered: () => {},
      onPanelRegistered: () => {},
    })

    this.welcomeScreen.setCallbacks({
      onNewTextFile: () => this.handleNewTextFile(),
      onOpenFile: () => this.handleOpenFile(),
      onOpenFolder: () => this.handleOpenFolder(),
      onOpenWorkspace: () => this.handleOpenFolder(),
      onOpenRecent: (path) => this.handleOpenRecentProject(path),
      onShowDocumentation: () => {
        void globalThis.open('https://github.com', '_blank', 'noopener,noreferrer')
      },
      onShowCommandPalette: () => this.showCommandPalette(),
      onCheckForUpdates: () => {
        this.toastManager.info(`${APP_NAME} ${APP_VERSION} is up to date.`)
      },
    })

    this.layoutManager.setActivityHandlers({
      onSearch: () => this.showSearch(),
      onTerminal: () => this.handleToggleTerminal(),
      onSettings: () => this.showSettings(),
    })

    const history = await getWorkspaceHistoryClient().get()
    await this.welcomeScreen.setRecentProjects(history.recentProjects)

    this.bindWorkspaceSyncEvents()
    this.registerCommands()
    this.bindCommandInfrastructure()
    this.mountApplicationMenuBar()

    await this.initializeSettings()
    this.languageManager.initialize(this.workspace.getWorkspaceRootSnapshot().path)
    await this.sourceControlPanel.bindWorkspaceRoot(this.workspace.getWorkspaceRootSnapshot().path)
    this.updateGitStatusLabel()
  }

  /** Runs after the loading screen is dismissed so session dialogs are visible. */
  async finishStartup(): Promise<void> {
    if (this.disposed) {
      throw new Error('Cannot finish startup on a disposed WorkspaceEditorController')
    }

    await this.runStartupRecovery()

    if (this.workspace.getOpenDocuments().length === 0) {
      this.enterWelcomeMode()
    }

    this.applyInitialDocumentState()
  }

  getWorkspace(): WorkspaceManager {
    return this.workspace
  }

  getEditorManager(): EditorManager {
    return this.editorManager
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.tabBar?.dispose()
    this.tabBar = null
    this.fileExplorer?.dispose()
    this.fileExplorer = null
    this.commandPalette.dispose()
    this.quickOpen.dispose()
    this.goToLine.dispose()
    this.searchPanel.dispose()
    this.settingsPanel.dispose()
    this.sourceControlPanel.dispose()
    this.gitDiffViewer.dispose()
    this.welcomeScreen.dispose()
    this.breadcrumbs.dispose()
    this.applicationMenuBar?.dispose()
    this.applicationMenuBar = null
    this.languageManager.dispose()
    this.clearAutoSaveTimer()
    this.commandRegistry.dispose()
    this.terminalPanel.dispose()
    this.toastManager.dispose()

    for (const unsubscribe of this.unsubscribers) {
      unsubscribe()
    }

    this.unsubscribers.length = 0
  }

  private bindWorkspaceSyncEvents(): void {
    this.unsubscribers.push(
      this.workspace.onDidChangeActiveDocument((document) => {
        if (!document) {
          this.refreshWelcomeState()
          return
        }

        this.exitWelcomeMode()
        this.editorManager.setActiveDocument(document)
        this.updateShellForActiveDocument()
        globalThis.requestAnimationFrame(() => {
          this.editorManager.layout()
          this.editorManager.focus()
        })
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidAddDocument((document) => {
        this.editorManager.attachDocument(document)
        this.exitWelcomeMode()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidRemoveDocument((documentId) => {
        this.editorManager.detachDocument(documentId)
        this.refreshWelcomeState()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeDocumentDirtyState(() => {
        this.updateShellForActiveDocument()
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeDocumentPath((document) => {
        this.editorManager.updateDocumentPath(document)
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidExternallyUpdateDocument((document) => {
        this.editorManager.refreshDocumentContent(document)
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeWorkspaceRoot((snapshot) => {
        this.languageManager.rebindWorkspace(snapshot.path)
        void this.sourceControlPanel.bindWorkspaceRoot(snapshot.path)

        if (snapshot.path) {
          void recordWorkspaceProject(snapshot.path)
        }

        void this.sourceControlPanel.refresh()
        this.updateWorkspaceStatus()
        this.updateGitStatusLabel()
      }),
    )
  }

  private enterWelcomeMode(): void {
    this.shell.welcomeContainer.style.pointerEvents = ''
    this.welcomeScreen.show()
    this.shell.root.classList.add('app-shell--welcome')
    this.shell.editorWorkspace.classList.add('editor-workspace--welcome')
    this.shell.editorContainer.hidden = true
    this.shell.editorContainer.classList.remove('editor-container--revealing')
    this.shell.breadcrumbsContainer.hidden = true
    this.shell.tabBarContainer.classList.add('tab-bar-container--hidden')
    this.shell.languageLabel.textContent = 'Welcome'
    this.shell.positionLabel.textContent = ''
    this.setStatusMessage('Ready')
    this.updateWorkspaceStatus()
    this.breadcrumbs.update(null, null)
  }

  private exitWelcomeMode(): void {
    if (!this.welcomeScreen.isVisible()) {
      this.revealEditorSurface()
      return
    }

    if (this.welcomeExitPromise) {
      return
    }

    this.welcomeExitPromise = this.exitWelcomeModeAsync().finally(() => {
      this.welcomeExitPromise = null
    })
  }

  private revealEditorSurface(): void {
    this.shell.root.classList.remove('app-shell--welcome')
    this.shell.editorWorkspace.classList.remove('editor-workspace--welcome')
    this.shell.breadcrumbsContainer.hidden = false
    this.shell.tabBarContainer.classList.remove('tab-bar-container--hidden')
    this.shell.editorContainer.hidden = false
    this.shell.welcomeContainer.style.pointerEvents = 'none'
    this.editorManager.layout()
  }

  private async exitWelcomeModeAsync(): Promise<void> {
    this.revealEditorSurface()

    await this.welcomeScreen.hide()

    this.shell.welcomeContainer.style.pointerEvents = ''
    this.shell.editorContainer.classList.remove('editor-container--revealing')
    this.editorManager.layout()
    this.editorManager.focus()

    if (!this.editorStatusBound) {
      this.bindEditorStatusEvents()
      this.editorStatusBound = true
    }
  }

  private refreshWelcomeState(): void {
    if (this.workspace.getOpenDocuments().length > 0) {
      return
    }

    void this.refreshWelcomeStateAsync()
  }

  private async refreshWelcomeStateAsync(): Promise<void> {
    const history = await getWorkspaceHistoryClient().get()
    await this.welcomeScreen.setRecentProjects(history.recentProjects)
    this.enterWelcomeMode()
  }

  private async runStartupRecovery(): Promise<void> {
    try {
      const recovered = await recoverLastSession(this.workspace)
      if (recovered) {
        return
      }
    } catch (error) {
      console.warn('[Deadeye Studio] Session recovery failed:', error)
    }

    const defaultWorkspace = this.startupSettings.workspace.defaultWorkspace
    if (!defaultWorkspace) {
      return
    }

    try {
      await this.workspace.openWorkspaceRoot(defaultWorkspace)
    } catch (error) {
      console.warn('[Deadeye Studio] Failed to open default workspace:', error)
    }
  }

  private applyInitialDocumentState(): void {
    for (const document of this.workspace.getOpenDocuments()) {
      this.editorManager.attachDocument(document)
    }

    const activeDocument = this.workspace.getActiveDocument()
    if (!activeDocument) {
      return
    }

    this.editorManager.setActiveDocument(activeDocument)
    this.exitWelcomeMode()
    this.updateShellForActiveDocument()
    this.editorManager.layout()
  }

  private updateWorkspaceStatus(): void {
    const snapshot = this.workspace.getWorkspaceRootSnapshot()
    const label = snapshot.isOpen
      ? (snapshot.name ?? snapshot.path ?? 'Workspace')
      : 'No Folder'

    this.shell.workspaceLabel.textContent = label
    this.shell.workspaceLabel.title = snapshot.path ?? 'No workspace folder open'

    const headerWorkspace = this.shell.root.querySelector<HTMLElement>('#header-workspace-label')
    if (headerWorkspace) {
      headerWorkspace.textContent = snapshot.isOpen ? label : ''
    }
  }

  private updateGitStatusLabel(): void {
    this.shell.gitStatusLabel.textContent = this.sourceControlPanel.getStatusBarLabel()
    this.shell.gitStatusLabel.title = this.sourceControlPanel.getStatusBarTitle()
  }

  private showAbout(): void {
    if (this.settingsPanel.isVisible()) {
      this.settingsPanel.hide()
    }

    showAboutDialog(getOverlayHost())
  }

  private registerExtensionTheme(
    contribution: ExtensionThemeContribution,
    extensionRootPath: string,
  ): void {
    void this.loadExtensionTheme(contribution, extensionRootPath)
  }

  private async loadExtensionTheme(
    contribution: ExtensionThemeContribution,
    extensionRootPath: string,
  ): Promise<void> {
    if (contribution.path.startsWith('builtin://')) {
      return
    }

    try {
      const normalizedRoot = extensionRootPath.replace(/\\/g, '/')
      const themePath = `${normalizedRoot}/${contribution.path.replace(/^\//, '')}`
      const file = await getFilesystemClient().readFile(themePath)
      const parsed = JSON.parse(file.content) as ThemeDefinition
      if (!parsed.id || !parsed.shell || !parsed.syntax) {
        console.warn(`[Deadeye Studio] Extension theme file is missing required fields: ${themePath}`)
        return
      }

      const themeDefinition: ThemeDefinition = {
        ...parsed,
        id: contribution.id || parsed.id,
        label: contribution.label || parsed.label,
        source: 'extension',
      }

      registerTheme(themeDefinition)
      registerMonacoTheme(themeDefinition)
    } catch (error) {
      console.warn('[Deadeye Studio] Extension theme registration failed:', error)
    }
  }

  private async handleOpenRecentProject(path: string): Promise<void> {
    try {
      await this.workspace.openWorkspaceRoot(path)
      void recordWorkspaceProject(path)
      const history = await getWorkspaceHistoryClient().get()
      await this.welcomeScreen.setRecentProjects(history.recentProjects)
      this.updateWorkspaceStatus()
      this.toastManager.info('Recent project opened.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.toastManager.error(message)
    }
  }

  private async initializeSettings(): Promise<void> {
    const settingsClient = getSettingsClient()
    this.currentSettings = await settingsClient.get()
    this.applySettings(this.currentSettings)

    this.unsubscribers.push(
      settingsClient.onDidChange((settings) => {
        this.currentSettings = settings
        this.applySettings(settings)
      }),
    )

    this.bindAutoSaveEvents()
  }

  private applySettings(settings: DeadeyeSettings): void {
    this.settingsApplier.apply(settings, this.editorManager)
    this.configureAutoSave(settings)
  }

  private showSettings(): void {
    for (const modal of getOverlayHost().querySelectorAll('.deadeye-modal-overlay')) {
      modal.remove()
    }

    this.layoutManager.setActiveActivity('settings')

    void this.settingsPanel.show({
      onSettingsSaved: (settings) => {
        this.currentSettings = settings
        this.applySettings(settings)
        this.toastManager.success('Settings saved.')
      },
      onError: (message) => {
        this.toastManager.error(message)
      },
    })
  }

  private bindAutoSaveEvents(): void {
    const editor = this.editorManager.getEditor()
    if (!editor) {
      return
    }

    editor.onDidChangeModelContent(() => {
      this.scheduleAutoSave()
    })

    window.addEventListener('blur', this.handleWindowBlur)
    this.unsubscribers.push(() => {
      window.removeEventListener('blur', this.handleWindowBlur)
    })
  }

  private readonly handleWindowBlur = (): void => {
    if (this.currentSettings?.workspace.autoSave !== 'onFocusChange') {
      return
    }

    void this.saveDirtyDocuments()
  }

  private configureAutoSave(settings: DeadeyeSettings): void {
    if (settings.workspace.autoSave === 'off') {
      this.clearAutoSaveTimer()
    }
  }

  private scheduleAutoSave(): void {
    if (this.currentSettings?.workspace.autoSave !== 'afterDelay') {
      return
    }

    this.clearAutoSaveTimer()
    const delayMs = this.currentSettings.workspace.autoSaveDelayMs

    this.autoSaveTimer = globalThis.setTimeout(() => {
      void this.saveDirtyDocuments()
    }, delayMs)
  }

  private clearAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      globalThis.clearTimeout(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  private async saveDirtyDocuments(): Promise<void> {
    for (const document of this.workspace.getOpenDocuments()) {
      if (!document.isDirty || !document.isDiskBacked) {
        continue
      }

      try {
        await this.workspace.saveDocument(document.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.toastManager.error(`Auto-save failed for ${document.displayName}: ${message}`)
      }
    }
  }

  private registerCommands(): void {
    const commands: CommandDefinition[] = [
      {
        id: COMMAND_IDS.newFile,
        title: 'New Text File',
        category: 'File',
        shortcut: 'Ctrl+N',
        handler: () => this.handleNewTextFile(),
      },
      {
        id: COMMAND_IDS.openFile,
        title: 'Open File',
        category: 'File',
        shortcut: 'Ctrl+O',
        handler: () => this.handleOpenFile(),
      },
      {
        id: COMMAND_IDS.openFolder,
        title: 'Open Folder',
        category: 'File',
        shortcut: 'Ctrl+Shift+O',
        handler: () => this.handleOpenFolder(),
      },
      {
        id: COMMAND_IDS.openWorkspace,
        title: 'Open Workspace',
        category: 'File',
        handler: () => this.handleOpenFolder(),
      },
      {
        id: COMMAND_IDS.save,
        title: 'Save',
        category: 'File',
        shortcut: 'Ctrl+S',
        handler: () => this.handleSave(),
      },
      {
        id: COMMAND_IDS.saveAs,
        title: 'Save As',
        category: 'File',
        shortcut: 'Ctrl+Shift+S',
        handler: () => this.handleSaveAs(),
      },
      {
        id: COMMAND_IDS.saveAll,
        title: 'Save All',
        category: 'File',
        handler: () => this.handleSaveAll(),
      },
      {
        id: COMMAND_IDS.closeEditor,
        title: 'Close Editor',
        category: 'File',
        shortcut: 'Ctrl+W',
        handler: () => void this.handleCloseTab(),
      },
      {
        id: COMMAND_IDS.closeTab,
        title: 'Close Tab',
        category: 'File',
        shortcut: 'Ctrl+W',
        handler: () => void this.handleCloseTab(),
      },
      {
        id: COMMAND_IDS.refreshExplorer,
        title: 'Refresh Explorer',
        category: 'View',
        handler: () => this.fileExplorer?.refresh(),
      },
      {
        id: COMMAND_IDS.toggleExplorer,
        title: 'Toggle Explorer',
        category: 'View',
        shortcut: 'Ctrl+Shift+E',
        handler: () => this.layoutManager.toggleExplorer(),
      },
      {
        id: COMMAND_IDS.toggleSourceControl,
        title: 'Toggle Source Control',
        category: 'View',
        shortcut: 'Ctrl+Shift+G',
        handler: () => this.layoutManager.toggleSourceControl(),
      },
      {
        id: COMMAND_IDS.showSearch,
        title: 'Search in Workspace',
        category: 'Search',
        shortcut: 'Ctrl+Shift+F',
        handler: () => this.showSearch(),
      },
      {
        id: COMMAND_IDS.showRun,
        title: 'Run',
        category: 'View',
        handler: () => this.toastManager.info('Run panel is not configured for this workspace yet.'),
      },
      {
        id: COMMAND_IDS.showExtensions,
        title: 'Extensions',
        category: 'View',
        handler: () => this.showSettings(),
      },
      {
        id: COMMAND_IDS.openAppearance,
        title: 'Appearance',
        category: 'View',
        handler: () => this.showSettings(),
      },
      {
        id: COMMAND_IDS.toggleTerminal,
        title: 'Toggle Terminal',
        category: 'View',
        shortcut: 'Ctrl+`',
        handler: () => this.handleToggleTerminal(),
      },
      {
        id: COMMAND_IDS.toggleFullScreen,
        title: 'Toggle Full Screen',
        category: 'View',
        shortcut: 'F11',
        handler: () => window.deadeye?.window.toggleFullScreen(),
      },
      {
        id: COMMAND_IDS.exit,
        title: 'Exit',
        category: 'File',
        shortcut: 'Alt+F4',
        handler: () => window.deadeye?.window.exit(),
      },
      {
        id: COMMAND_IDS.openSettings,
        title: 'Open Settings',
        category: 'Preferences',
        shortcut: 'Ctrl+,',
        handler: () => this.showSettings(),
      },
      {
        id: COMMAND_IDS.showCommandPalette,
        title: 'Show Command Palette',
        category: 'View',
        shortcut: 'Ctrl+Shift+P',
        handler: () => this.showCommandPalette(),
      },
      {
        id: COMMAND_IDS.showQuickOpen,
        title: 'Quick Open',
        category: 'Navigation',
        shortcut: 'Ctrl+P',
        handler: () => this.showQuickOpen(),
      },
      {
        id: COMMAND_IDS.goToLine,
        title: 'Go to Line',
        category: 'Navigation',
        shortcut: 'Ctrl+G',
        handler: () => this.showGoToLine(),
      },
      {
        id: COMMAND_IDS.goToSymbol,
        title: 'Go to Symbol',
        category: 'Navigation',
        shortcut: 'Ctrl+Shift+O',
        handler: () => this.editorManager.goToSymbol(),
      },
      {
        id: COMMAND_IDS.goBack,
        title: 'Back',
        category: 'Navigation',
        shortcut: 'Alt+Left',
        handler: () => this.editorManager.goBack(),
      },
      {
        id: COMMAND_IDS.goForward,
        title: 'Forward',
        category: 'Navigation',
        shortcut: 'Alt+Right',
        handler: () => this.editorManager.goForward(),
      },
      {
        id: COMMAND_IDS.undo,
        title: 'Undo',
        category: 'Edit',
        shortcut: 'Ctrl+Z',
        handler: () => this.editorManager.undo(),
      },
      {
        id: COMMAND_IDS.redo,
        title: 'Redo',
        category: 'Edit',
        shortcut: 'Ctrl+Y',
        handler: () => this.editorManager.redo(),
      },
      {
        id: COMMAND_IDS.cut,
        title: 'Cut',
        category: 'Edit',
        shortcut: 'Ctrl+X',
        handler: () => this.editorManager.cut(),
      },
      {
        id: COMMAND_IDS.copy,
        title: 'Copy',
        category: 'Edit',
        shortcut: 'Ctrl+C',
        handler: () => this.editorManager.copy(),
      },
      {
        id: COMMAND_IDS.paste,
        title: 'Paste',
        category: 'Edit',
        shortcut: 'Ctrl+V',
        handler: () => this.editorManager.paste(),
      },
      {
        id: COMMAND_IDS.find,
        title: 'Find',
        category: 'Edit',
        shortcut: 'Ctrl+F',
        handler: () => this.editorManager.find(),
      },
      {
        id: COMMAND_IDS.replace,
        title: 'Replace',
        category: 'Edit',
        shortcut: 'Ctrl+H',
        handler: () => this.editorManager.replace(),
      },
      {
        id: COMMAND_IDS.selectAll,
        title: 'Select All',
        category: 'Edit',
        shortcut: 'Ctrl+A',
        handler: () => this.editorManager.selectAll(),
      },
      {
        id: COMMAND_IDS.expandSelection,
        title: 'Expand Selection',
        category: 'Selection',
        shortcut: 'Shift+Alt+Right',
        handler: () => this.editorManager.expandSelection(),
      },
      {
        id: COMMAND_IDS.shrinkSelection,
        title: 'Shrink Selection',
        category: 'Selection',
        shortcut: 'Shift+Alt+Left',
        handler: () => this.editorManager.shrinkSelection(),
      },
      {
        id: COMMAND_IDS.startDebugging,
        title: 'Start Debugging',
        category: 'Run',
        shortcut: 'F5',
        handler: () => this.toastManager.info('Debugger integration is not configured for this workspace yet.'),
      },
      {
        id: COMMAND_IDS.runWithoutDebugging,
        title: 'Run Without Debugging',
        category: 'Run',
        shortcut: 'Ctrl+F5',
        handler: () => this.toastManager.info('Run without debugging is not configured for this workspace yet.'),
      },
      {
        id: COMMAND_IDS.stopDebugging,
        title: 'Stop Debugging',
        category: 'Run',
        shortcut: 'Shift+F5',
        handler: () => this.toastManager.info('No active debug session.'),
      },
      {
        id: COMMAND_IDS.newTerminal,
        title: 'New Terminal',
        category: 'Terminal',
        shortcut: 'Ctrl+Shift+`',
        handler: () => this.handleNewTerminal(),
      },
      {
        id: COMMAND_IDS.splitTerminal,
        title: 'Split Terminal',
        category: 'Terminal',
        shortcut: 'Ctrl+\\',
        handler: () => this.handleSplitTerminal(),
      },
      {
        id: COMMAND_IDS.clearTerminal,
        title: 'Clear Terminal',
        category: 'Terminal',
        handler: () => this.terminalPanel.clearActiveTerminal(),
      },
      {
        id: COMMAND_IDS.showDocumentation,
        title: 'Documentation',
        category: 'Help',
        handler: () => {
          void globalThis.open('https://github.com', '_blank', 'noopener,noreferrer')
        },
      },
      {
        id: COMMAND_IDS.showAbout,
        title: 'About Deadeye Studio',
        category: 'Help',
        handler: () => this.showAbout(),
      },
    ]

    this.commandRegistry.registerMany(commands)
    this.commandPalette.setCommands(this.commandRegistry.getAllCommands())
  }

  private bindCommandInfrastructure(): void {
    this.unsubscribers.push(this.commandRegistry.bindKeyboardShortcuts())
    this.unsubscribers.push(this.commandRegistry.bindMenuCommands())
  }

  private mountApplicationMenuBar(): void {
    this.applicationMenuBar = new ApplicationMenuBar(this.shell.menuBarHost, (commandId) => {
      void this.executeMenuCommand(commandId)
    })
  }

  private async executeMenuCommand(commandId: CommandId): Promise<void> {
    if (commandId === COMMAND_IDS.exit) {
      await window.deadeye?.window.exit()
      return
    }

    if (commandId === COMMAND_IDS.toggleFullScreen) {
      await window.deadeye?.window.toggleFullScreen()
      return
    }

    await this.commandRegistry.execute(commandId)
  }

  private showCommandPalette(): void {
    this.commandPalette.setCommands(this.commandRegistry.getAllCommands())
    this.commandPalette.show((command) => {
      void this.commandRegistry.execute(command.id)
    })
  }

  private showQuickOpen(): void {
    const root = this.workspace.getWorkspaceRootSnapshot().path
    void this.quickOpen.show(root, (item) => {
      void this.openFileFromQuickOpen(item.path)
    })
  }

  private showGoToLine(): void {
    this.goToLine.show((line) => {
      this.editorManager.goToLine(line)
    })
  }

  private showSearch(): void {
    this.searchPanel.show(this.workspace.getWorkspaceRootSnapshot().path, {
      onOpenMatch: (match) => {
        void this.openFileFromQuickOpen(match.filePath).then(() => {
          this.editorManager.goToLine(match.line, match.column)
        })
      },
      onSearchComplete: (count) => {
        this.toastManager.info(`Found ${count} match${count === 1 ? '' : 'es'}.`)
      },
      onReplaceComplete: (count) => {
        this.toastManager.success(`Replaced ${count} occurrence${count === 1 ? '' : 's'}.`)
      },
      onError: (message) => {
        this.toastManager.error(message)
      },
    })
  }

  private handleNewTextFile(): void {
    createNewTextFile(this.workspace)
    this.revealEditorSurface()
    this.editorManager.layout()

    globalThis.requestAnimationFrame(() => {
      this.editorManager.focus()
    })
  }

  private async handleOpenFolder(): Promise<void> {
    const snapshot = await this.workspace.openWorkspaceRootFromDialog()
    if (!snapshot?.path) {
      return
    }

    void recordWorkspaceProject(snapshot.path)
    const history = await getWorkspaceHistoryClient().get()
    await this.welcomeScreen.setRecentProjects(history.recentProjects)
    this.updateWorkspaceStatus()
    this.toastManager.info(`Opened ${snapshot.name ?? 'workspace'}.`)
  }

  private async handleSave(): Promise<void> {
    const document = await this.workspace.saveActiveDocument()
    if (!document) {
      return
    }

    this.toastManager.success(`Saved ${document.displayName}`)
  }

  private async handleSaveAs(): Promise<void> {
    const document = await this.workspace.saveActiveDocumentAs()
    if (!document) {
      return
    }

    this.toastManager.success(`Saved as ${document.displayName}`)
  }

  private async handleCloseTab(): Promise<void> {
    const activeId = this.workspace.getActiveDocumentId()
    if (!activeId) {
      return
    }

    const document = this.workspace.getDocument(activeId)
    if (!document) {
      return
    }

    if (document.isDirty) {
      const confirmed = await getDialogService().confirm({
        title: 'Unsaved Changes',
        message: `"${document.displayName}" has unsaved changes. Close without saving?`,
        confirmLabel: 'Close',
        cancelLabel: 'Cancel',
        variant: 'danger',
      })

      if (!confirmed) {
        return
      }
    }

    this.workspace.removeDocument(activeId)
  }

  private handleToggleTerminal(): void {
    this.terminalPanel.toggle()
    this.editorManager.layout()
  }

  private handleNewTerminal(): void {
    this.terminalPanel.newTerminal()
    this.editorManager.layout()
  }

  private handleSplitTerminal(): void {
    this.terminalPanel.splitTerminal()
    this.editorManager.layout()
  }

  private async handleOpenFile(): Promise<void> {
    const dialogResult = await getFilesystemClient().openFileDialog()
    if (dialogResult.canceled || !dialogResult.path) {
      return
    }

    const filePath = normalizeWorkspacePath(dialogResult.path)
    const workspaceRoot = this.workspace.getWorkspaceRootSnapshot().path

    if (!workspaceRoot) {
      const parentDirectory = dirname(filePath)
      await this.workspace.openWorkspaceRoot(parentDirectory)
      this.updateWorkspaceStatus()
    }

    await this.openFileFromQuickOpen(filePath)
  }

  private async handleSaveAll(): Promise<void> {
    const savedCount = await this.workspace.saveAllDocuments()
    if (savedCount === 0) {
      this.toastManager.info('No unsaved changes.')
      return
    }

    this.toastManager.success(`Saved ${savedCount} file${savedCount === 1 ? '' : 's'}.`)
  }

  private async openFileFromQuickOpen(filePath: string): Promise<void> {
    try {
      await this.workspace.openDocument(filePath)
      recordRecentFile(filePath)
      void recordWorkspaceFile(filePath)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.toastManager.error(message)
    }
  }

  private updateShellForActiveDocument(): void {
    const activeDocument = this.workspace.getActiveDocument()

    if (!activeDocument) {
      return
    }

    this.shell.languageLabel.textContent = formatLanguageLabel(activeDocument.language)
    this.shell.encodingLabel.textContent = 'UTF-8'
    this.breadcrumbs.update(
      activeDocument.filePath,
      this.workspace.getWorkspaceRootSnapshot().path,
    )
    this.updateWorkspaceStatus()
  }

  private bindEditorStatusEvents(): void {
    const editor = this.editorManager.getEditor()

    if (!editor) {
      return
    }

    const updateStatus = (): void => {
      const model = this.editorManager.getActiveModel()
      const position = editor.getPosition()
      const activeDocument = this.workspace.getActiveDocument()

      if (!model) {
        this.shell.positionLabel.textContent = ''
        this.setStatusMessage('Ready')
        return
      }

      const lineCount = model.getLineCount()

      if (!position) {
        this.shell.positionLabel.textContent = ''
        this.setStatusMessage(`${lineCount} lines`)
        return
      }

      this.shell.positionLabel.textContent = `Ln ${position.lineNumber}, Col ${position.column}`
      this.setStatusMessage(activeDocument?.isDirty ? 'Modified' : 'Ready')
    }

    editor.onDidChangeCursorPosition(updateStatus)
    editor.onDidChangeModelContent(updateStatus)

    this.unsubscribers.push(
      this.workspace.onDidChangeDocumentDirtyState((document) => {
        if (document.id === this.workspace.getActiveDocumentId()) {
          updateStatus()
        }
      }),
    )

    this.unsubscribers.push(
      this.workspace.onDidChangeActiveDocument(() => {
        updateStatus()
      }),
    )

    updateStatus()
  }

  private setStatusMessage(message: string): void {
    this.shell.statusLabel.textContent = message
  }
}
