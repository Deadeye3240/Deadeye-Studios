import type { editor } from 'monaco-editor'
import type { DeadeyeSettings } from '../../shared/settings'
import type { EditorManager } from '../editor'
import { createEditorOptionsFromSettings } from '../editor/editor-config'
import { applyDensityAppearance } from '../density'
import { applyApplicationTheme } from '../themes'

export class SettingsApplier {
  apply(settings: DeadeyeSettings, editorManager: EditorManager): void {
    applyApplicationTheme(settings.appearance.theme, editorManager)
    applyDensityAppearance(settings.appearance)

    const editor = editorManager.getEditor()
    if (!editor) {
      return
    }

    editor.updateOptions(createEditorOptionsFromSettings(settings))
    editorManager.layout()
  }

  toEditorOptions(settings: DeadeyeSettings): editor.IStandaloneEditorConstructionOptions {
    return createEditorOptionsFromSettings(settings)
  }
}
