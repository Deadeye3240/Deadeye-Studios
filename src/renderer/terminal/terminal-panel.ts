import type { TerminalShell } from '../../shared/terminal'

interface TerminalSessionView {
  readonly id: string
  readonly shell: TerminalShell
  readonly output: HTMLElement
  readonly tab: HTMLButtonElement
  inputLine: string
}

function getTerminalBridge() {
  if (!window.deadeye?.terminal) {
    throw new Error('Deadeye terminal bridge is unavailable')
  }

  return window.deadeye.terminal
}

export class TerminalPanel {
  private readonly root: HTMLElement
  private readonly tabList: HTMLElement
  private readonly outputContainer: HTMLElement
  private readonly input: HTMLInputElement
  private readonly resizeHandle: HTMLElement
  private readonly sessions = new Map<string, TerminalSessionView>()
  private activeSessionId: string | null = null
  private unsubscribers: Array<() => void> = []
  private visible = false
  private disposed = false
  private panelHeight = 220

  constructor(container: HTMLElement) {
    container.className = 'terminal-panel'
    container.innerHTML = `
      <div class="terminal-panel-header">
        <div class="terminal-tab-list" role="tablist" aria-label="Terminals"></div>
        <div class="terminal-panel-actions">
          <button type="button" class="terminal-action" data-shell="powershell" title="New PowerShell">PS</button>
          <button type="button" class="terminal-action" data-shell="cmd" title="New CMD">CMD</button>
        </div>
      </div>
      <div class="terminal-output-container"></div>
      <div class="terminal-input-row">
        <span class="terminal-prompt">&gt;</span>
        <input class="terminal-input" type="text" aria-label="Terminal input" autocomplete="off" spellcheck="false" />
      </div>
      <div class="terminal-resize-handle" title="Resize terminal"></div>
    `

    const tabList = container.querySelector<HTMLElement>('.terminal-tab-list')
    const outputContainer = container.querySelector<HTMLElement>('.terminal-output-container')
    const input = container.querySelector<HTMLInputElement>('.terminal-input')
    const resizeHandle = container.querySelector<HTMLElement>('.terminal-resize-handle')

    if (!tabList || !outputContainer || !input || !resizeHandle) {
      throw new Error('Failed to mount terminal panel')
    }

    this.root = container
    this.tabList = tabList
    this.outputContainer = outputContainer
    this.input = input
    this.resizeHandle = resizeHandle

    this.bindShellButtons(container)
    this.bindInput()
    this.bindResize()
    this.bindBridgeEvents()
  }

  isVisible(): boolean {
    return this.visible
  }

  show(): void {
    this.visible = true
    this.root.hidden = false
    this.applyHeight()

    if (this.sessions.size === 0) {
      void this.createSession('powershell')
      return
    }

    this.input.focus()
  }

  hide(): void {
    this.visible = false
    this.root.hidden = true
  }

  toggle(): void {
    if (this.visible) {
      this.hide()
      return
    }

    this.show()
  }

  newTerminal(): void {
    this.show()
    void this.createSession('powershell')
  }

  splitTerminal(): void {
    this.show()
    void this.createSession('powershell')
  }

  clearActiveTerminal(): void {
    if (!this.activeSessionId) {
      return
    }

    const session = this.sessions.get(this.activeSessionId)
    if (!session) {
      return
    }

    session.output.textContent = ''
    session.inputLine = ''
  }

  async createSession(shell: TerminalShell, cwd?: string): Promise<void> {
    const bridge = getTerminalBridge()
    const result = await bridge.create({ shell, cwd })

    const tab = globalThis.document.createElement('button')
    tab.type = 'button'
    tab.className = 'terminal-tab'
    tab.textContent = `${shell.toUpperCase()}`
    tab.dataset.sessionId = result.id

    const output = globalThis.document.createElement('pre')
    output.className = 'terminal-output'
    output.hidden = true

    tab.addEventListener('click', () => {
      this.setActiveSession(result.id)
    })

    const close = globalThis.document.createElement('span')
    close.className = 'terminal-tab-close'
    close.textContent = '×'
    close.addEventListener('click', (event) => {
      event.stopPropagation()
      void this.closeSession(result.id)
    })

    tab.append(close)

    const session: TerminalSessionView = {
      id: result.id,
      shell: result.shell,
      output,
      tab,
      inputLine: '',
    }

    this.sessions.set(result.id, session)
    this.tabList.append(tab)
    this.outputContainer.append(output)
    this.setActiveSession(result.id)
    this.appendOutput(result.id, `[Deadeye Studio] ${shell} terminal ready.\r\n`)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true

    for (const unsubscribe of this.unsubscribers) {
      unsubscribe()
    }

    this.unsubscribers = []

    const bridge = getTerminalBridge()
    for (const id of this.sessions.keys()) {
      void bridge.kill(id)
    }

    this.sessions.clear()
    this.root.replaceChildren()
  }

  private bindShellButtons(container: HTMLElement): void {
    const buttons = container.querySelectorAll<HTMLButtonElement>('.terminal-action[data-shell]')

    for (const button of buttons) {
      const shell = button.dataset.shell as TerminalShell | undefined
      if (!shell) {
        continue
      }

      button.addEventListener('click', () => {
        void this.createSession(shell)
      })
    }
  }

  private bindInput(): void {
    this.input.addEventListener('keydown', (event) => {
      if (!this.activeSessionId) {
        return
      }

      const session = this.sessions.get(this.activeSessionId)
      if (!session) {
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const command = this.input.value
        this.input.value = ''
        void this.sendLine(this.activeSessionId, command)
        return
      }

      if (event.key === 'c' && event.ctrlKey) {
        event.preventDefault()
        void getTerminalBridge().write(this.activeSessionId, '\u0003')
      }
    })
  }

  private bindResize(): void {
    let startY = 0
    let startHeight = this.panelHeight

    const onMouseMove = (event: MouseEvent): void => {
      const delta = startY - event.clientY
      this.panelHeight = Math.max(120, Math.min(500, startHeight + delta))
      this.applyHeight()
    }

    const onMouseUp = (): void => {
      globalThis.document.removeEventListener('mousemove', onMouseMove)
      globalThis.document.removeEventListener('mouseup', onMouseUp)
    }

    this.resizeHandle.addEventListener('mousedown', (event) => {
      startY = event.clientY
      startHeight = this.panelHeight
      globalThis.document.addEventListener('mousemove', onMouseMove)
      globalThis.document.addEventListener('mouseup', onMouseUp)
    })
  }

  private bindBridgeEvents(): void {
    const bridge = getTerminalBridge()

    this.unsubscribers.push(
      bridge.onData((event) => {
        this.appendOutput(event.id, event.data)
      }),
    )

    this.unsubscribers.push(
      bridge.onExit((event) => {
        this.appendOutput(event.id, `\r\n[Process exited with code ${event.code ?? 'unknown'}]\r\n`)
      }),
    )
  }

  private async sendLine(sessionId: string, line: string): Promise<void> {
    this.appendOutput(sessionId, `> ${line}\r\n`)
    await getTerminalBridge().write(sessionId, `${line}\r\n`)
  }

  private appendOutput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    session.output.textContent += data
    session.output.scrollTop = session.output.scrollHeight
  }

  private setActiveSession(sessionId: string): void {
    this.activeSessionId = sessionId

    for (const session of this.sessions.values()) {
      const isActive = session.id === sessionId
      session.tab.classList.toggle('terminal-tab--active', isActive)
      session.output.hidden = !isActive
    }

    this.input.focus()
  }

  private async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    await getTerminalBridge().kill(sessionId)
    session.tab.remove()
    session.output.remove()
    this.sessions.delete(sessionId)

    if (this.activeSessionId === sessionId) {
      const next = this.sessions.keys().next().value ?? null
      this.activeSessionId = next
      if (next) {
        this.setActiveSession(next)
      }
    }
  }

  private applyHeight(): void {
    this.root.style.height = `${this.panelHeight}px`
  }
}
