import { COMMAND_IDS, type CommandId } from './commands'

export interface ApplicationMenuItemDefinition {
  readonly label?: string
  readonly commandId?: CommandId
  readonly accelerator?: string
  readonly type?: 'separator'
  readonly mainProcessOnly?: boolean
}

export interface ApplicationMenuDefinition {
  readonly label: string
  readonly items: readonly ApplicationMenuItemDefinition[]
}

/**
 * Single source of truth for the application menu.
 * Used by the Electron main-process menu and the visible renderer menu bar.
 */
export const APPLICATION_MENU_DEFINITION: readonly ApplicationMenuDefinition[] = [
  {
    label: 'File',
    items: [
      { label: 'New Text File', commandId: COMMAND_IDS.newFile, accelerator: 'Ctrl+N' },
      { label: 'Open File', commandId: COMMAND_IDS.openFile, accelerator: 'Ctrl+O' },
      { label: 'Open Folder', commandId: COMMAND_IDS.openFolder, accelerator: 'Ctrl+Shift+O' },
      { label: 'Open Workspace', commandId: COMMAND_IDS.openWorkspace },
      { type: 'separator' },
      { label: 'Save', commandId: COMMAND_IDS.save, accelerator: 'Ctrl+S' },
      { label: 'Save As', commandId: COMMAND_IDS.saveAs, accelerator: 'Ctrl+Shift+S' },
      { label: 'Save All', commandId: COMMAND_IDS.saveAll },
      { type: 'separator' },
      { label: 'Close Editor', commandId: COMMAND_IDS.closeEditor, accelerator: 'Ctrl+W' },
      { type: 'separator' },
      { label: 'Exit', commandId: COMMAND_IDS.exit, accelerator: 'Alt+F4', mainProcessOnly: true },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', commandId: COMMAND_IDS.undo, accelerator: 'Ctrl+Z' },
      { label: 'Redo', commandId: COMMAND_IDS.redo, accelerator: 'Ctrl+Y' },
      { type: 'separator' },
      { label: 'Cut', commandId: COMMAND_IDS.cut, accelerator: 'Ctrl+X' },
      { label: 'Copy', commandId: COMMAND_IDS.copy, accelerator: 'Ctrl+C' },
      { label: 'Paste', commandId: COMMAND_IDS.paste, accelerator: 'Ctrl+V' },
      { type: 'separator' },
      { label: 'Select All', commandId: COMMAND_IDS.selectAll, accelerator: 'Ctrl+A' },
      { label: 'Find', commandId: COMMAND_IDS.find, accelerator: 'Ctrl+F' },
      { label: 'Replace', commandId: COMMAND_IDS.replace, accelerator: 'Ctrl+H' },
    ],
  },
  {
    label: 'Selection',
    items: [
      { label: 'Select All', commandId: COMMAND_IDS.selectAll, accelerator: 'Ctrl+A' },
      { label: 'Expand Selection', commandId: COMMAND_IDS.expandSelection, accelerator: 'Shift+Alt+Right' },
      { label: 'Shrink Selection', commandId: COMMAND_IDS.shrinkSelection, accelerator: 'Shift+Alt+Left' },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Explorer', commandId: COMMAND_IDS.toggleExplorer, accelerator: 'Ctrl+Shift+E' },
      { label: 'Search', commandId: COMMAND_IDS.showSearch, accelerator: 'Ctrl+Shift+F' },
      { label: 'Source Control', commandId: COMMAND_IDS.toggleSourceControl, accelerator: 'Ctrl+Shift+G' },
      { label: 'Run', commandId: COMMAND_IDS.showRun },
      { label: 'Terminal', commandId: COMMAND_IDS.toggleTerminal, accelerator: 'Ctrl+`' },
      { type: 'separator' },
      { label: 'Appearance', commandId: COMMAND_IDS.openAppearance },
    ],
  },
  {
    label: 'Go',
    items: [
      { label: 'Back', commandId: COMMAND_IDS.goBack, accelerator: 'Alt+Left' },
      { label: 'Forward', commandId: COMMAND_IDS.goForward, accelerator: 'Alt+Right' },
      { type: 'separator' },
      { label: 'Go to File', commandId: COMMAND_IDS.showQuickOpen, accelerator: 'Ctrl+P' },
      { label: 'Go to Line', commandId: COMMAND_IDS.goToLine, accelerator: 'Ctrl+G' },
    ],
  },
  {
    label: 'Run',
    items: [
      { label: 'Start Debugging', commandId: COMMAND_IDS.startDebugging, accelerator: 'F5' },
      { label: 'Run Without Debugging', commandId: COMMAND_IDS.runWithoutDebugging, accelerator: 'Ctrl+F5' },
    ],
  },
  {
    label: 'Terminal',
    items: [
      { label: 'New Terminal', commandId: COMMAND_IDS.newTerminal, accelerator: 'Ctrl+Shift+`' },
      { label: 'Split Terminal', commandId: COMMAND_IDS.splitTerminal, accelerator: 'Ctrl+\\' },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Documentation', commandId: COMMAND_IDS.showDocumentation },
      { label: 'About Deadeye Studio', commandId: COMMAND_IDS.showAbout },
    ],
  },
]
