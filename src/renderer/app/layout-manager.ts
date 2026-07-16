import type { AppShellElements } from './shell'

export type SidebarPanel = 'explorer' | 'source-control'
export type ActivityId = 'explorer' | 'search' | 'source-control' | 'terminal' | 'settings'

export interface ActivityBarHandlers {
  readonly onSearch: () => void
  readonly onTerminal: () => void
  readonly onSettings: () => void
}

export class AppLayoutManager {
  private readonly shell: AppShellElements
  private readonly onLayoutChange: () => void
  private explorerVisible = true
  private activeSidebarPanel: SidebarPanel = 'explorer'
  private activeActivity: ActivityId = 'explorer'
  private activityHandlers: ActivityBarHandlers | null = null

  constructor(shell: AppShellElements, onLayoutChange: () => void) {
    this.shell = shell
    this.onLayoutChange = onLayoutChange
    this.bindSidebarTabs()
    this.bindActivityBar()
  }

  setActivityHandlers(handlers: ActivityBarHandlers): void {
    this.activityHandlers = handlers
  }

  toggleExplorer(): void {
    this.explorerVisible = !this.explorerVisible
    this.shell.appBody.classList.toggle('app-body--explorer-hidden', !this.explorerVisible)
    this.onLayoutChange()
  }

  showSidebarPanel(panel: SidebarPanel): void {
    this.activeSidebarPanel = panel
    this.explorerVisible = true
    this.shell.appBody.classList.remove('app-body--explorer-hidden')
    this.setActiveActivity(panel === 'source-control' ? 'source-control' : 'explorer')

    const isExplorer = panel === 'explorer'
    this.shell.explorerContainer.hidden = !isExplorer
    this.shell.sourceControlContainer.hidden = isExplorer

    const tabs = this.shell.sidebarTabs.querySelectorAll<HTMLButtonElement>('.sidebar-tab')
    for (const tab of tabs) {
      const isActive = tab.dataset.panel === panel
      tab.classList.toggle('sidebar-tab--active', isActive)
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
    }

    this.onLayoutChange()
  }

  toggleSourceControl(): void {
    if (this.activeSidebarPanel === 'source-control' && this.explorerVisible) {
      this.toggleExplorer()
      return
    }

    this.showSidebarPanel('source-control')
  }

  setActiveActivity(activity: ActivityId): void {
    this.activeActivity = activity

    const items = this.shell.activityBar.querySelectorAll<HTMLButtonElement>('.activity-bar__item')
    for (const item of items) {
      const isActive = item.dataset.activity === activity
      item.classList.toggle('activity-bar__item--active', isActive)
      item.setAttribute('aria-current', isActive ? 'page' : 'false')
    }
  }

  isExplorerVisible(): boolean {
    return this.explorerVisible
  }

  getActiveSidebarPanel(): SidebarPanel {
    return this.activeSidebarPanel
  }

  private bindSidebarTabs(): void {
    const tabs = this.shell.sidebarTabs.querySelectorAll<HTMLButtonElement>('.sidebar-tab')

    for (const tab of tabs) {
      tab.addEventListener('click', () => {
        const panel = tab.dataset.panel
        if (panel === 'explorer' || panel === 'source-control') {
          this.showSidebarPanel(panel)
        }
      })
    }
  }

  private bindActivityBar(): void {
    const items = this.shell.activityBar.querySelectorAll<HTMLButtonElement>('.activity-bar__item')

    for (const item of items) {
      item.addEventListener('click', () => {
        const activity = item.dataset.activity as ActivityId | undefined
        if (!activity) {
          return
        }

        switch (activity) {
          case 'explorer':
            this.showSidebarPanel('explorer')
            break
          case 'source-control':
            this.showSidebarPanel('source-control')
            break
          case 'search':
            this.setActiveActivity('search')
            this.activityHandlers?.onSearch()
            break
          case 'terminal':
            this.setActiveActivity('terminal')
            this.activityHandlers?.onTerminal()
            break
          case 'settings':
            this.setActiveActivity('settings')
            this.activityHandlers?.onSettings()
            break
        }
      })
    }
  }
}
