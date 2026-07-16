import { createAppShell, renderFatalError } from './shell'

import { WorkspaceEditorController } from './workspace-controller'

import { EditorManager } from '../editor'

import { createDefaultEditorOptions } from '../editor/editor-config'

import { initDialogService } from '../dialogs'

import { getSettingsClient, SettingsApplier } from '../settings'

import { applyApplicationTheme } from '../themes'

import { applyDensityAppearance } from '../density'

import { WorkspaceManager } from '../workspace'

import { persistSessionSnapshot } from '../workspace/session-recovery'

import { getOverlayHost } from '../overlay'

import { LoadingScreen } from '../welcome'



export interface ApplicationRuntime {

  readonly workspace: WorkspaceManager

  readonly editorManager: EditorManager

  readonly controller: WorkspaceEditorController

}



let activeRuntime: ApplicationRuntime | null = null



/**

 * Bootstraps the Deadeye Studio renderer application.

 *

 * Application → WorkspaceManager → WorkspaceDocument → EditorManager → Monaco Model

 */

export async function bootstrapApp(root: HTMLElement): Promise<ApplicationRuntime> {

  const shell = createAppShell(root)

  const loadingScreen = new LoadingScreen()

  loadingScreen.setStatus('Preparing workspace...')



  initDialogService(getOverlayHost())



  const workspace = WorkspaceManager.createEmpty()

  const settingsClient = getSettingsClient()

  loadingScreen.setStatus('Loading settings...')

  const settings = await settingsClient.get()

  applyApplicationTheme(settings.appearance.theme)
  applyDensityAppearance(settings.appearance)

  const settingsApplier = new SettingsApplier()

  const editorConstructionOptions = {

    ...createDefaultEditorOptions(),

    ...settingsApplier.toEditorOptions(settings),

  }



  const editorManager = new EditorManager({

    container: shell.editorContainer,

  })



  shell.statusLabel.textContent = 'Initializing editor...'



  let controller: WorkspaceEditorController | null = null



  try {

    loadingScreen.setStatus('Initializing editor...')

    await editorManager.initialize()

    editorManager.mount(editorConstructionOptions)

    settingsApplier.apply(settings, editorManager)



    loadingScreen.setStatus('Starting interface...')

    controller = new WorkspaceEditorController(workspace, editorManager, shell, settings)

    await controller.initialize()

    loadingScreen.hide()

    await controller.finishStartup()

    const runtime: ApplicationRuntime = {

      workspace,

      editorManager,

      controller,

    }



    activeRuntime = runtime

    return runtime

  } catch (error) {

    loadingScreen.hide()

    controller?.dispose()

    editorManager.dispose()

    workspace.dispose()

    throw error

  }

}



export function disposeActiveApplication(): void {

  activeRuntime?.controller.dispose()

  activeRuntime?.editorManager.dispose()

  activeRuntime?.workspace.dispose()

  activeRuntime = null

}



function applyShellDocumentClasses(): void {
  const rootElement = document.documentElement
  rootElement.classList.add('deadeye-shell')

  const platform = window.deadeye?.platform
  if (platform) {
    rootElement.classList.add(`platform-${platform}`)
  }
}

export async function startApplication(): Promise<void> {
  applyShellDocumentClasses()

  const root = document.querySelector<HTMLElement>('#app')

  if (!root) {
    throw new Error('Application root element #app was not found')
  }



  window.addEventListener('beforeunload', () => {

    if (activeRuntime) {

      void persistSessionSnapshot(activeRuntime.workspace)

    }



    disposeActiveApplication()

  })



  try {

    await bootstrapApp(root)

  } catch (error) {

    console.error('[Deadeye Studio] Application bootstrap failed:', error)

    renderFatalError(root, error)

    disposeActiveApplication()

  }

}


