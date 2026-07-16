import type { DeadeyeSettings } from '../../shared/settings'
import { DEFAULT_SETTINGS } from '../../shared/settings'
import { getDensityModeSelectOptions, getUiScaleSelectOptions } from '../../shared/density'
import { getThemeSelectOptions } from '../../shared/themes'
import { getSettingsClient } from './settings-client'

export interface SettingsPanelCallbacks {
  readonly onSettingsSaved: (settings: DeadeyeSettings) => void
  readonly onError: (message: string) => void
}

const LINE_NUMBER_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'relative', label: 'Relative' },
] as const

const AUTO_SAVE_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'afterDelay', label: 'After Delay' },
  { value: 'onFocusChange', label: 'On Focus Change' },
] as const

export class SettingsPanel {
  private readonly host: HTMLElement
  private readonly drawer: HTMLElement
  private readonly backdrop: HTMLElement
  private readonly fields: {
    fontSize: HTMLInputElement
    fontFamily: HTMLInputElement
    wordWrap: HTMLInputElement
    minimap: HTMLInputElement
    tabSize: HTMLInputElement
    lineNumbers: HTMLSelectElement
    theme: HTMLSelectElement
    uiScale: HTMLSelectElement
    densityMode: HTMLSelectElement
    autoSaveMode: HTMLSelectElement
    autoSaveDelay: HTMLInputElement
    defaultWorkspace: HTMLInputElement
  }

  private callbacks: SettingsPanelCallbacks | null = null
  private currentSettings: DeadeyeSettings = structuredClone(DEFAULT_SETTINGS)
  private visible = false
  private readonly handleKeyDown: (event: KeyboardEvent) => void

  constructor(host: HTMLElement) {
    this.host = host
    this.host.className = 'settings-drawer-host'

    this.handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && this.visible) {
        event.preventDefault()
        this.hide()
      }
    }

    this.backdrop = globalThis.document.createElement('div')
    this.backdrop.className = 'settings-drawer-backdrop'
    this.backdrop.hidden = true

    this.drawer = globalThis.document.createElement('div')
    this.drawer.className = 'settings-drawer'
    this.drawer.setAttribute('role', 'dialog')
    this.drawer.setAttribute('aria-label', 'Settings')
    this.drawer.hidden = true

    const header = globalThis.document.createElement('div')
    header.className = 'settings-drawer__header'

    const title = globalThis.document.createElement('h2')
    title.className = 'settings-drawer__title'
    title.textContent = 'Settings'

    const closeButton = globalThis.document.createElement('button')
    closeButton.type = 'button'
    closeButton.className = 'settings-drawer__close'
    closeButton.setAttribute('aria-label', 'Close settings')
    closeButton.textContent = '×'
    closeButton.addEventListener('click', () => this.hide())

    header.append(title, closeButton)

    const body = globalThis.document.createElement('div')
    body.className = 'settings-drawer__body'

    this.fields = {
      minimap: this.createToggleField(body, 'Minimap', 'editor-minimap'),
      wordWrap: this.createToggleField(body, 'Word Wrap', 'editor-word-wrap'),
      fontSize: this.createNumberField(body, 'Editor Font Size', 'editor-font-size'),
      tabSize: this.createNumberField(body, 'Tab Size', 'editor-tab-size'),
      lineNumbers: this.createSelectField(body, 'Line Numbers', 'editor-line-numbers', [
        ...LINE_NUMBER_OPTIONS,
      ]),
      fontFamily: this.createTextField(body, 'Font Family', 'editor-font-family'),
      theme: this.createSelectField(body, 'Color Theme', 'appearance-theme', getThemeSelectOptions()),
      uiScale: this.createSelectField(body, 'UI Scale', 'appearance-ui-scale', getUiScaleSelectOptions()),
      densityMode: this.createSelectField(
        body,
        'Density',
        'appearance-density-mode',
        getDensityModeSelectOptions(),
      ),
      autoSaveMode: this.createSelectField(body, 'Auto Save', 'workspace-auto-save-mode', [
        ...AUTO_SAVE_OPTIONS,
      ]),
      autoSaveDelay: this.createNumberField(body, 'Auto Save Delay (ms)', 'workspace-auto-save-delay'),
      defaultWorkspace: this.createTextField(body, 'Default Workspace Path', 'workspace-default'),
    }

    this.fields.fontSize.min = '10'
    this.fields.fontSize.max = '24'

    const footer = globalThis.document.createElement('div')
    footer.className = 'settings-drawer__footer'

    const saveButton = globalThis.document.createElement('button')
    saveButton.type = 'button'
    saveButton.className = 'settings-drawer__save'
    saveButton.textContent = 'Save'
    saveButton.addEventListener('click', () => {
      void this.handleSave()
    })

    const resetButton = globalThis.document.createElement('button')
    resetButton.type = 'button'
    resetButton.className = 'settings-drawer__reset'
    resetButton.textContent = 'Reset Defaults'
    resetButton.addEventListener('click', () => {
      void this.handleReset()
    })

    footer.append(saveButton, resetButton)
    this.drawer.append(header, body, footer)
    this.host.append(this.backdrop, this.drawer)

    this.backdrop.addEventListener('click', () => this.hide())
  }

  async show(callbacks: SettingsPanelCallbacks): Promise<void> {
    this.callbacks = callbacks
    this.visible = true
    this.host.hidden = false
    this.backdrop.hidden = false
    this.drawer.hidden = false
    this.host.classList.add('settings-drawer-host--open')
    globalThis.document.addEventListener('keydown', this.handleKeyDown)

    try {
      this.currentSettings = await getSettingsClient().get()
      this.populateForm(this.currentSettings)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      callbacks.onError(message)
    }
  }

  hide(): void {
    this.visible = false
    this.host.hidden = true
    this.backdrop.hidden = true
    this.drawer.hidden = true
    this.host.classList.remove('settings-drawer-host--open')
    globalThis.document.removeEventListener('keydown', this.handleKeyDown)
    this.callbacks = null
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    this.host.replaceChildren()
  }

  private async handleSave(): Promise<void> {
    const autoSaveMode = this.fields.autoSaveMode.value
    const lineNumbers = this.fields.lineNumbers.value

    const partial: Partial<DeadeyeSettings> = {
      editor: {
        fontSize: Number(this.fields.fontSize.value),
        fontFamily: this.fields.fontFamily.value,
        wordWrap: this.fields.wordWrap.checked ? 'on' : 'off',
        minimap: this.fields.minimap.checked,
        tabSize: Number(this.fields.tabSize.value),
        lineNumbers:
          lineNumbers === 'off' || lineNumbers === 'relative' ? lineNumbers : 'on',
      },
      appearance: {
        theme: this.fields.theme.value,
        uiScale: Number(this.fields.uiScale.value),
        densityMode: this.fields.densityMode.value === 'comfortable' ? 'comfortable' : 'compact',
      },
      workspace: {
        autoSave:
          autoSaveMode === 'afterDelay' || autoSaveMode === 'onFocusChange'
            ? autoSaveMode
            : 'off',
        autoSaveDelayMs: Number(this.fields.autoSaveDelay.value),
        defaultWorkspace: this.fields.defaultWorkspace.value.trim() || null,
      },
    }

    try {
      const next = await getSettingsClient().update(partial)
      this.currentSettings = next
      this.callbacks?.onSettingsSaved(next)
      this.hide()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  private async handleReset(): Promise<void> {
    try {
      const next = await getSettingsClient().reset()
      this.currentSettings = next
      this.populateForm(next)
      this.callbacks?.onSettingsSaved(next)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  private populateForm(settings: DeadeyeSettings): void {
    this.fields.fontSize.value = String(settings.editor.fontSize)
    this.fields.fontFamily.value = settings.editor.fontFamily
    this.fields.wordWrap.checked = settings.editor.wordWrap !== 'off'
    this.fields.minimap.checked = settings.editor.minimap
    this.fields.tabSize.value = String(settings.editor.tabSize)
    this.fields.lineNumbers.value = settings.editor.lineNumbers
    this.fields.theme.value = settings.appearance.theme
    this.fields.uiScale.value = String(settings.appearance.uiScale)
    this.fields.densityMode.value = settings.appearance.densityMode
    this.fields.autoSaveMode.value = settings.workspace.autoSave
    this.fields.autoSaveDelay.value = String(settings.workspace.autoSaveDelayMs)
    this.fields.defaultWorkspace.value = settings.workspace.defaultWorkspace ?? ''
  }

  private createToggleField(container: HTMLElement, label: string, id: string): HTMLInputElement {
    const row = globalThis.document.createElement('label')
    row.className = 'settings-drawer__row settings-drawer__row--toggle'
    row.setAttribute('for', id)

    const text = globalThis.document.createElement('span')
    text.className = 'settings-drawer__label'
    text.textContent = label

    const toggle = globalThis.document.createElement('span')
    toggle.className = 'settings-toggle'

    const input = globalThis.document.createElement('input')
    input.type = 'checkbox'
    input.className = 'settings-toggle__input'
    input.id = id

    const track = globalThis.document.createElement('span')
    track.className = 'settings-toggle__track'
    track.setAttribute('aria-hidden', 'true')

    toggle.append(input, track)
    row.append(text, toggle)
    container.append(row)
    return input
  }

  private createNumberField(container: HTMLElement, label: string, id: string): HTMLInputElement {
    const row = this.createRow(container, label, id)
    const input = globalThis.document.createElement('input')
    input.type = 'number'
    input.className = 'settings-drawer__input'
    input.id = id
    row.append(input)
    return input
  }

  private createTextField(container: HTMLElement, label: string, id: string): HTMLInputElement {
    const row = this.createRow(container, label, id)
    const input = globalThis.document.createElement('input')
    input.type = 'text'
    input.className = 'settings-drawer__input'
    input.id = id
    row.append(input)
    return input
  }

  private createSelectField(
    container: HTMLElement,
    label: string,
    id: string,
    options: Array<{ value: string; label: string }>,
  ): HTMLSelectElement {
    const row = this.createRow(container, label, id)
    const select = globalThis.document.createElement('select')
    select.className = 'settings-drawer__input'
    select.id = id

    for (const option of options) {
      const element = globalThis.document.createElement('option')
      element.value = option.value
      element.textContent = option.label
      select.append(element)
    }

    row.append(select)
    return select
  }

  private createRow(container: HTMLElement, label: string, id: string): HTMLElement {
    const row = globalThis.document.createElement('div')
    row.className = 'settings-drawer__row'

    const text = globalThis.document.createElement('label')
    text.className = 'settings-drawer__label'
    text.textContent = label
    text.setAttribute('for', id)

    row.append(text)
    container.append(row)
    return row
  }
}
