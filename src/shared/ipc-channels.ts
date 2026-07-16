export const FILESYSTEM_IPC_CHANNELS = {
  openFolderDialog: 'deadeye:fs:open-folder-dialog',
  openFileDialog: 'deadeye:fs:open-file-dialog',
  readDirectory: 'deadeye:fs:read-directory',
  readFile: 'deadeye:fs:read-file',
  writeFile: 'deadeye:fs:write-file',
  createFile: 'deadeye:fs:create-file',
  renameFile: 'deadeye:fs:rename-file',
  deleteFile: 'deadeye:fs:delete-file',
  getFileMetadata: 'deadeye:fs:get-file-metadata',
  saveFileDialog: 'deadeye:fs:save-file-dialog',
  setWorkspaceRoot: 'deadeye:fs:set-workspace-root',
  fileChanged: 'deadeye:fs:file-changed',
} as const

export const MENU_IPC_CHANNELS = {
  executeCommand: 'deadeye:menu:execute-command',
} as const

export const WINDOW_IPC_CHANNELS = {
  newWindow: 'deadeye:window:new',
  exit: 'deadeye:window:exit',
  toggleFullScreen: 'deadeye:window:toggle-fullscreen',
} as const

export const TERMINAL_IPC_CHANNELS = {
  create: 'deadeye:terminal:create',
  write: 'deadeye:terminal:write',
  resize: 'deadeye:terminal:resize',
  kill: 'deadeye:terminal:kill',
  data: 'deadeye:terminal:data',
  exit: 'deadeye:terminal:exit',
} as const

export const SETTINGS_IPC_CHANNELS = {
  get: 'deadeye:settings:get',
  update: 'deadeye:settings:update',
  reset: 'deadeye:settings:reset',
  changed: 'deadeye:settings:changed',
} as const

export const GIT_IPC_CHANNELS = {
  findRepository: 'deadeye:git:find-repository',
  getStatus: 'deadeye:git:get-status',
  stageFile: 'deadeye:git:stage-file',
  unstageFile: 'deadeye:git:unstage-file',
  commit: 'deadeye:git:commit',
  getDiff: 'deadeye:git:get-diff',
} as const

export const WORKSPACE_STATE_IPC_CHANNELS = {
  get: 'deadeye:workspace-state:get',
  recordProject: 'deadeye:workspace-state:record-project',
  recordFile: 'deadeye:workspace-state:record-file',
  saveSession: 'deadeye:workspace-state:save-session',
  clearSession: 'deadeye:workspace-state:clear-session',
} as const

export const THEME_IPC_CHANNELS = {
  applyShell: 'deadeye:theme:apply-shell',
} as const

export const APPEARANCE_IPC_CHANNELS = {
  setZoomFactor: 'deadeye:appearance:set-zoom-factor',
} as const

export const EXTENSION_IPC_CHANNELS = {
  discoverUser: 'deadeye:extensions:discover-user',
} as const
