import { APP_DESCRIPTION, APP_NAME, APP_VERSION } from '../../shared/version'
import { createCrosshairLogoMarkup } from '../ui/brand-logo'
import { deriveRootName } from '../workspace/path-utils'
import type { RecentProjectEntry } from '../../shared/workspace-state'

export interface WelcomeScreenCallbacks {
  readonly onNewTextFile: () => void | Promise<void>
  readonly onOpenFile: () => void | Promise<void>
  readonly onOpenFolder: () => void | Promise<void>
  readonly onOpenWorkspace: () => void | Promise<void>
  readonly onOpenRecent: (path: string) => void | Promise<void>
  readonly onShowDocumentation: () => void
  readonly onShowCommandPalette: () => void
  readonly onCheckForUpdates: () => void
}

const TRANSITION_MS = 240
const BUILD_TYPE = import.meta.env.DEV ? 'Development' : 'Production'

const ICON_FILE = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>`
const ICON_FOLDER = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`
const ICON_WORKSPACE = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 6h7V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v-2H4V6zm10 0h6c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zm0 2v10h6V8h-6z"/></svg>`
const ICON_RECENT = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`
const ICON_ROCKET = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 9.11L2 20c-.09.65.07 1.32.45 1.84.38.52.95.84 1.55.84.41 0 .81-.12 1.16-.35l4.54-2.24c3.53-.13 6.82-1.53 9.11-3.57 2.77-2.47 4.19-5.61 4.19-8.68 0-.34-.02-.67-.05-1-.34.03-.66.05-1 .05-3.07 0-6.21-1.42-8.68-4.19zM11 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`
const ICON_KEYBOARD = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>`
const ICON_DOCS = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`
const ICON_UPDATE = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`

interface QuickActionDefinition {
  readonly action: string
  readonly label: string
  readonly icon: string
  readonly primary?: boolean
}

interface GettingStartedCardDefinition {
  readonly action: string
  readonly title: string
  readonly description: string
  readonly icon: string
}

interface ShortcutTipDefinition {
  readonly keys: string
  readonly label: string
}

const QUICK_ACTIONS: readonly QuickActionDefinition[] = [
  { action: 'new-text-file', label: 'New Text File', icon: ICON_FILE, primary: true },
  { action: 'open-file', label: 'Open File', icon: ICON_FILE },
  { action: 'open-folder', label: 'Open Folder', icon: ICON_FOLDER },
  { action: 'open-workspace', label: 'Open Workspace', icon: ICON_WORKSPACE },
]

const GETTING_STARTED_CARDS: readonly GettingStartedCardDefinition[] = [
  {
    action: 'create-project',
    title: 'Create your first project',
    description: 'Start with a new text file and build from scratch.',
    icon: ICON_ROCKET,
  },
  {
    action: 'open-workspace',
    title: 'Open an existing workspace',
    description: 'Pick up where you left off with a saved workspace folder.',
    icon: ICON_WORKSPACE,
  },
  {
    action: 'keyboard-shortcuts',
    title: 'Learn keyboard shortcuts',
    description: 'Open the command palette to discover powerful shortcuts.',
    icon: ICON_KEYBOARD,
  },
  {
    action: 'documentation',
    title: 'View documentation',
    description: 'Read guides and references to get the most from Deadeye Studio.',
    icon: ICON_DOCS,
  },
  {
    action: 'check-updates',
    title: 'Check for updates',
    description: 'Make sure you are running the latest version.',
    icon: ICON_UPDATE,
  },
]

const SHORTCUT_TIPS: readonly ShortcutTipDefinition[] = [
  { keys: 'Ctrl+P', label: 'Quick Open' },
  { keys: 'Ctrl+Shift+P', label: 'Command Palette' },
  { keys: 'Ctrl+S', label: 'Save' },
  { keys: 'Ctrl+F', label: 'Find' },
]

export class WelcomeScreen {
  private readonly container: HTMLElement
  private readonly root: HTMLElement
  private recentList: HTMLElement | null = null
  private callbacks: WelcomeScreenCallbacks | null = null
  private visible = false
  private transitionTimer: ReturnType<typeof setTimeout> | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.root = globalThis.document.createElement('div')
    this.root.className = 'welcome-screen'
    this.root.setAttribute('role', 'region')
    this.root.setAttribute('aria-label', 'Welcome')
    this.root.hidden = true
    this.container.hidden = true
    this.container.append(this.root)
    this.render()
  }

  setCallbacks(callbacks: WelcomeScreenCallbacks): void {
    this.callbacks = callbacks
  }

  async setRecentProjects(projects: readonly RecentProjectEntry[]): Promise<void> {
    if (!this.recentList) {
      return
    }

    this.recentList.replaceChildren()

    if (projects.length === 0) {
      const empty = globalThis.document.createElement('div')
      empty.className = 'welcome-recent-empty'
      empty.textContent = 'No recent projects yet. Open a folder to get started.'
      this.recentList.append(empty)
      return
    }

    for (const project of projects.slice(0, 8)) {
      const item = globalThis.document.createElement('button')
      item.type = 'button'
      item.className = 'welcome-recent-item'
      item.title = project.path

      const icon = globalThis.document.createElement('span')
      icon.className = 'welcome-recent-item__icon'
      icon.innerHTML = ICON_RECENT

      const text = globalThis.document.createElement('span')
      text.className = 'welcome-recent-item__text'

      const name = globalThis.document.createElement('span')
      name.className = 'welcome-recent-name'
      name.textContent = deriveRootName(project.path)

      const path = globalThis.document.createElement('span')
      path.className = 'welcome-recent-path'
      path.textContent = project.path

      text.append(name, path)
      item.append(icon, text)
      item.addEventListener('click', () => {
        void this.callbacks?.onOpenRecent(project.path)
      })

      this.recentList.append(item)
    }
  }

  show(): void {
    if (this.transitionTimer) {
      globalThis.clearTimeout(this.transitionTimer)
      this.transitionTimer = null
    }

    this.visible = true
    this.container.hidden = false
    this.root.hidden = false
    this.container.classList.remove('welcome-host--exit')
    this.root.classList.remove('welcome-screen--exit')

    globalThis.requestAnimationFrame(() => {
      this.container.classList.add('welcome-host--enter')
      this.root.classList.add('welcome-screen--enter')
    })
  }

  hide(): Promise<void> {
    if (!this.visible) {
      return Promise.resolve()
    }

    if (this.transitionTimer) {
      globalThis.clearTimeout(this.transitionTimer)
      this.transitionTimer = null
    }

    this.container.classList.remove('welcome-host--enter')
    this.root.classList.remove('welcome-screen--enter')
    this.container.classList.add('welcome-host--exit')
    this.root.classList.add('welcome-screen--exit')

    return new Promise((resolve) => {
      this.transitionTimer = globalThis.setTimeout(() => {
        this.visible = false
        this.root.hidden = true
        this.container.hidden = true
        this.container.classList.remove('welcome-host--exit')
        this.root.classList.remove('welcome-screen--exit')
        this.transitionTimer = null
        resolve()
      }, TRANSITION_MS)
    })
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    if (this.transitionTimer) {
      globalThis.clearTimeout(this.transitionTimer)
    }

    this.root.remove()
  }

  private render(): void {
    const quickActionsMarkup = QUICK_ACTIONS.map(
      (action) => `
        <button
          type="button"
          class="welcome-quick-action${action.primary ? ' welcome-quick-action--primary' : ''}"
          data-action="${action.action}"
        >
          <span class="welcome-quick-action__icon">${action.icon}</span>
          <span class="welcome-quick-action__label">${action.label}</span>
        </button>
      `,
    ).join('')

    const gettingStartedMarkup = GETTING_STARTED_CARDS.map(
      (card) => `
        <button type="button" class="welcome-card" data-action="${card.action}">
          <span class="welcome-card__icon">${card.icon}</span>
          <span class="welcome-card__body">
            <span class="welcome-card__title">${card.title}</span>
            <span class="welcome-card__description">${card.description}</span>
          </span>
        </button>
      `,
    ).join('')

    const tipsMarkup = SHORTCUT_TIPS.map(
      (tip) => `
        <div class="welcome-shortcut">
          <dt>${tip.label}</dt>
          <dd>${tip.keys}</dd>
        </div>
      `,
    ).join('')

    this.root.innerHTML = `
      <div class="welcome-screen__glow" aria-hidden="true"></div>
      <div class="welcome-screen__layout">
        <main class="welcome-main">
          <header class="welcome-brand">
            ${createCrosshairLogoMarkup('welcome-brand__logo')}
            <h1 class="welcome-brand__title">${APP_NAME}</h1>
            <p class="welcome-brand__description">${APP_DESCRIPTION}</p>
          </header>

          <section class="welcome-section" aria-labelledby="welcome-quick-actions-title">
            <h2 class="welcome-section-title" id="welcome-quick-actions-title">Quick Actions</h2>
            <div class="welcome-quick-actions" role="group" aria-label="Quick actions">
              ${quickActionsMarkup}
            </div>
          </section>

          <section class="welcome-section" aria-labelledby="welcome-getting-started-title">
            <h2 class="welcome-section-title" id="welcome-getting-started-title">Getting Started</h2>
            <div class="welcome-card-grid">
              ${gettingStartedMarkup}
            </div>
          </section>

          <section class="welcome-section" aria-labelledby="welcome-tips-title">
            <h2 class="welcome-section-title" id="welcome-tips-title">Tips</h2>
            <dl class="welcome-shortcut-list">
              ${tipsMarkup}
            </dl>
          </section>
        </main>

        <aside class="welcome-recent-panel" aria-labelledby="welcome-recent-title">
          <h2 class="welcome-section-title" id="welcome-recent-title">Recent Projects</h2>
          <div class="welcome-recent-list"></div>
        </aside>
      </div>

      <footer class="welcome-screen__footer">
        <span class="welcome-footer__brand">${APP_NAME}</span>
        <span class="welcome-footer__divider" aria-hidden="true">·</span>
        <span class="welcome-footer__version">Version ${APP_VERSION}</span>
        <span class="welcome-footer__divider" aria-hidden="true">·</span>
        <span class="welcome-footer__build">${BUILD_TYPE}</span>
      </footer>
    `

    this.recentList = this.root.querySelector<HTMLElement>('.welcome-recent-list')
    if (!this.recentList) {
      throw new Error('Failed to render welcome screen')
    }

    this.bindActionHandlers()
  }

  private bindActionHandlers(): void {
    const actions: Record<string, () => void | Promise<void>> = {
      'new-text-file': () => this.callbacks?.onNewTextFile(),
      'open-file': () => this.callbacks?.onOpenFile(),
      'open-folder': () => this.callbacks?.onOpenFolder(),
      'open-workspace': () => this.callbacks?.onOpenWorkspace(),
      'create-project': () => this.callbacks?.onNewTextFile(),
      'keyboard-shortcuts': () => this.callbacks?.onShowCommandPalette(),
      documentation: () => this.callbacks?.onShowDocumentation(),
      'check-updates': () => this.callbacks?.onCheckForUpdates(),
    }

    for (const [action, handler] of Object.entries(actions)) {
      const elements = this.root.querySelectorAll<HTMLElement>(`[data-action="${action}"]`)
      for (const element of elements) {
        element.addEventListener('click', () => {
          void handler()
        })
      }
    }
  }
}
