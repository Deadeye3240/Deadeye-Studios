export interface AppShellElements {
  readonly root: HTMLElement
  readonly menuBarHost: HTMLElement
  readonly appBody: HTMLElement
  readonly activityBar: HTMLElement
  readonly sidebarTabs: HTMLElement
  readonly explorerContainer: HTMLElement
  readonly sourceControlContainer: HTMLElement
  readonly appCenter: HTMLElement
  readonly tabBarContainer: HTMLElement
  readonly breadcrumbsContainer: HTMLElement
  readonly editorWorkspace: HTMLElement
  readonly welcomeContainer: HTMLElement
  readonly editorContainer: HTMLElement
  readonly terminalPanel: HTMLElement
  readonly settingsDrawerHost: HTMLElement
  readonly overlayRoot: HTMLElement
  readonly toastContainer: HTMLElement
  readonly gitStatusLabel: HTMLElement
  readonly workspaceLabel: HTMLElement
  readonly statusLabel: HTMLElement
  readonly positionLabel: HTMLElement
  readonly encodingLabel: HTMLElement
  readonly languageLabel: HTMLElement
}

const ACTIVITY_ICON_EXPLORER = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`
const ACTIVITY_ICON_SEARCH = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`
const ACTIVITY_ICON_GIT = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" opacity="0"/><path fill="currentColor" d="M7 7h3v2.13c-.66.32-1.13 1.01-1.13 1.87 0 1.1.9 2 2 2s2-.9 2-2c0-.86-.47-1.55-1.13-1.87V7h4v2.13c-.66.32-1.13 1.01-1.13 1.87 0 1.1.9 2 2 2s2-.9 2-2c0-.86-.47-1.55-1.13-1.87V7h2v10H7V7z"/></svg>`
const ACTIVITY_ICON_TERMINAL = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zM6 13l2.5-2.5L6 8h2l2.5 2.5L10 13H6zm6 2h6v-2h-6v2z"/></svg>`
const ACTIVITY_ICON_SETTINGS = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`

export function createAppShell(root: HTMLElement): AppShellElements {
  root.className = 'app-shell app-shell--welcome'
  root.innerHTML = `
    <header class="app-header" role="banner">
      <div id="app-menubar-host" class="app-menubar-host" aria-label="Application menu"></div>
      <div class="app-header-row">
        <div class="app-brand">
          <span class="app-brand-mark" aria-hidden="true">◈</span>
          <span class="app-brand-name">Deadeye Studio</span>
        </div>
        <div class="app-header-actions">
          <span class="app-header-workspace" id="header-workspace-label"></span>
        </div>
      </div>
    </header>
    <div class="app-body" id="app-body">
      <nav class="activity-bar" id="activity-bar" aria-label="Primary navigation">
        <button type="button" class="activity-bar__item activity-bar__item--active" data-activity="explorer" title="Explorer (Ctrl+Shift+E)" aria-label="Explorer">${ACTIVITY_ICON_EXPLORER}</button>
        <button type="button" class="activity-bar__item" data-activity="search" title="Search (Ctrl+Shift+F)" aria-label="Search">${ACTIVITY_ICON_SEARCH}</button>
        <button type="button" class="activity-bar__item" data-activity="source-control" title="Source Control (Ctrl+Shift+G)" aria-label="Source Control">${ACTIVITY_ICON_GIT}</button>
        <button type="button" class="activity-bar__item" data-activity="terminal" title="Terminal (Ctrl+\`)" aria-label="Terminal">${ACTIVITY_ICON_TERMINAL}</button>
        <div class="activity-bar__spacer" aria-hidden="true"></div>
        <button type="button" class="activity-bar__item activity-bar__item--bottom" data-activity="settings" title="Settings (Ctrl+,)" aria-label="Settings">${ACTIVITY_ICON_SETTINGS}</button>
      </nav>
      <div class="sidebar">
        <div class="sidebar-tabs" role="tablist" aria-label="Sidebar panels">
          <button type="button" class="sidebar-tab sidebar-tab--active" data-panel="explorer" aria-selected="true">Explorer</button>
          <button type="button" class="sidebar-tab" data-panel="source-control" aria-selected="false">Source Control</button>
        </div>
        <aside id="explorer-container" class="explorer-container" aria-label="File explorer"></aside>
        <aside id="source-control-container" class="source-control-container" hidden aria-label="Source control"></aside>
      </div>
      <div class="app-center" id="app-center">
        <div class="app-content">
          <div id="tab-bar-container" class="tab-bar-container"></div>
          <div id="breadcrumbs-container" class="breadcrumbs-host"></div>
          <main class="editor-workspace" id="editor-workspace" role="main">
            <div id="welcome-container" class="welcome-host"></div>
            <div id="editor-container" class="editor-container" hidden aria-label="Code editor"></div>
          </main>
        </div>
        <section id="terminal-panel" class="terminal-panel-host" hidden aria-label="Integrated terminal"></section>
      </div>
    </div>
    <aside id="settings-drawer-host" class="settings-drawer-host" hidden aria-label="Settings"></aside>
    <footer class="status-bar" role="contentinfo">
      <div class="status-bar-section status-bar-section--left">
        <span id="git-status-label" class="status-item status-item--git" title="Source control">No repo</span>
        <span class="status-separator" aria-hidden="true">|</span>
        <span id="workspace-label" class="status-item status-item--workspace" title="Workspace folder">No Folder</span>
      </div>
      <div class="status-bar-section status-bar-section--center">
        <span id="status-label" class="status-item">Ready</span>
      </div>
      <div class="status-bar-section status-bar-section--right">
        <span id="position-label" class="status-item">Ln 1, Col 1</span>
        <span class="status-separator" aria-hidden="true">|</span>
        <span id="encoding-label" class="status-item">UTF-8</span>
        <span class="status-separator" aria-hidden="true">|</span>
        <span id="language-label" class="status-item">Plain Text</span>
      </div>
    </footer>
    <div id="overlay-root" class="overlay-root"></div>
    <div id="toast-container" class="toast-container" aria-live="polite"></div>
  `

  const appBody = root.querySelector<HTMLElement>('#app-body')
  const menuBarHost = root.querySelector<HTMLElement>('#app-menubar-host')
  const activityBar = root.querySelector<HTMLElement>('#activity-bar')
  const sidebarTabs = root.querySelector<HTMLElement>('.sidebar-tabs')
  const explorerContainer = root.querySelector<HTMLElement>('#explorer-container')
  const sourceControlContainer = root.querySelector<HTMLElement>('#source-control-container')
  const appCenter = root.querySelector<HTMLElement>('#app-center')
  const tabBarContainer = root.querySelector<HTMLElement>('#tab-bar-container')
  const breadcrumbsContainer = root.querySelector<HTMLElement>('#breadcrumbs-container')
  const editorWorkspace = root.querySelector<HTMLElement>('#editor-workspace')
  const welcomeContainer = root.querySelector<HTMLElement>('#welcome-container')
  const editorContainer = root.querySelector<HTMLElement>('#editor-container')
  const terminalPanel = root.querySelector<HTMLElement>('#terminal-panel')
  const settingsDrawerHost = root.querySelector<HTMLElement>('#settings-drawer-host')
  const overlayRoot = root.querySelector<HTMLElement>('#overlay-root')
  const toastContainer = root.querySelector<HTMLElement>('#toast-container')
  const gitStatusLabel = root.querySelector<HTMLElement>('#git-status-label')
  const workspaceLabel = root.querySelector<HTMLElement>('#workspace-label')
  const statusLabel = root.querySelector<HTMLElement>('#status-label')
  const positionLabel = root.querySelector<HTMLElement>('#position-label')
  const encodingLabel = root.querySelector<HTMLElement>('#encoding-label')
  const languageLabel = root.querySelector<HTMLElement>('#language-label')

  if (
    !menuBarHost ||
    !appBody ||
    !activityBar ||
    !sidebarTabs ||
    !explorerContainer ||
    !sourceControlContainer ||
    !appCenter ||
    !tabBarContainer ||
    !breadcrumbsContainer ||
    !editorWorkspace ||
    !welcomeContainer ||
    !editorContainer ||
    !terminalPanel ||
    !settingsDrawerHost ||
    !overlayRoot ||
    !toastContainer ||
    !gitStatusLabel ||
    !workspaceLabel ||
    !statusLabel ||
    !positionLabel ||
    !encodingLabel ||
    !languageLabel
  ) {
    throw new Error('Failed to create application shell: required elements are missing')
  }

  return {
    root,
    menuBarHost,
    appBody,
    activityBar,
    sidebarTabs,
    explorerContainer,
    sourceControlContainer,
    appCenter,
    tabBarContainer,
    breadcrumbsContainer,
    editorWorkspace,
    welcomeContainer,
    editorContainer,
    terminalPanel,
    settingsDrawerHost,
    overlayRoot,
    toastContainer,
    gitStatusLabel,
    workspaceLabel,
    statusLabel,
    positionLabel,
    encodingLabel,
    languageLabel,
  }
}

export function renderFatalError(root: HTMLElement, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)

  root.className = 'app-shell app-shell--error'
  root.innerHTML = `
    <main class="fatal-error" role="alert">
      <div class="fatal-error-icon" aria-hidden="true">◈</div>
      <h1>Deadeye Studio failed to start</h1>
      <p class="fatal-error-message">${escapeHtml(message)}</p>
      <p class="fatal-error-hint">Check the developer console for additional details.</p>
    </main>
  `
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
