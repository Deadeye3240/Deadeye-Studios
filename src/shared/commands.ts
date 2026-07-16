export const COMMAND_IDS = {
  newFile: 'deadeye.newFile',
  newWindow: 'deadeye.newWindow',
  openFile: 'deadeye.openFile',
  openFolder: 'deadeye.openFolder',
  openWorkspace: 'deadeye.openWorkspace',
  save: 'deadeye.save',
  saveAs: 'deadeye.saveAs',
  saveAll: 'deadeye.saveAll',
  closeEditor: 'deadeye.closeEditor',
  closeTab: 'deadeye.closeTab',
  refreshExplorer: 'deadeye.refreshExplorer',
  toggleExplorer: 'deadeye.toggleExplorer',
  toggleSourceControl: 'deadeye.toggleSourceControl',
  toggleTerminal: 'deadeye.toggleTerminal',
  openSettings: 'deadeye.openSettings',
  showCommandPalette: 'deadeye.showCommandPalette',
  showQuickOpen: 'deadeye.showQuickOpen',
  goToLine: 'deadeye.goToLine',
  goToSymbol: 'deadeye.goToSymbol',
  goBack: 'deadeye.goBack',
  goForward: 'deadeye.goForward',
  showSearch: 'deadeye.showSearch',
  showExtensions: 'deadeye.showExtensions',
  showRun: 'deadeye.showRun',
  openAppearance: 'deadeye.openAppearance',
  toggleFullScreen: 'deadeye.toggleFullScreen',
  undo: 'deadeye.undo',
  redo: 'deadeye.redo',
  cut: 'deadeye.cut',
  copy: 'deadeye.copy',
  paste: 'deadeye.paste',
  find: 'deadeye.find',
  replace: 'deadeye.replace',
  selectAll: 'deadeye.selectAll',
  expandSelection: 'deadeye.expandSelection',
  shrinkSelection: 'deadeye.shrinkSelection',
  startDebugging: 'deadeye.startDebugging',
  runWithoutDebugging: 'deadeye.runWithoutDebugging',
  stopDebugging: 'deadeye.stopDebugging',
  newTerminal: 'deadeye.newTerminal',
  splitTerminal: 'deadeye.splitTerminal',
  clearTerminal: 'deadeye.clearTerminal',
  showDocumentation: 'deadeye.showDocumentation',
  showAbout: 'deadeye.showAbout',
  exit: 'deadeye.exit',
} as const

export type CommandId = (typeof COMMAND_IDS)[keyof typeof COMMAND_IDS]

export interface CommandDefinition {
  readonly id: CommandId
  readonly title: string
  readonly category?: string
  readonly shortcut?: string
  readonly handler: () => void | Promise<void>
}
