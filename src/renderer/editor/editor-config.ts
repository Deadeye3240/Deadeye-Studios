import type { editor } from 'monaco-editor'
import type { DeadeyeSettings } from '../../shared/settings'
import { computeEditorLineHeight } from '../../shared/density'
import { DEFAULT_THEME_ID, resolveThemeId } from '../../shared/themes'

/**
 * Production editor defaults for Deadeye Studio.
 * Centralized so future phases can extend configuration without scattering options.
 */
export function createDefaultEditorOptions(): editor.IStandaloneEditorConstructionOptions {
  return {
    theme: DEFAULT_THEME_ID,
    automaticLayout: true,
    fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 20,
    fontLigatures: true,
    fontWeight: 'normal',
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: true,
    lineNumbers: 'on',
    lineNumbersMinChars: 4,
    lineDecorationsWidth: 12,
    glyphMargin: true,
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover',
    renderLineHighlight: 'line',
    renderLineHighlightOnlyWhenFocus: false,
    minimap: {
      enabled: true,
      scale: 1,
      showSlider: 'mouseover',
      renderCharacters: false,
      maxColumn: 80,
    },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    cursorStyle: 'line',
    cursorWidth: 1,
    renderWhitespace: 'selection',
    renderControlCharacters: false,
    bracketPairColorization: {
      enabled: true,
      independentColorPoolPerBracketType: true,
    },
    guides: {
      bracketPairs: true,
      bracketPairsHorizontal: 'active',
      indentation: true,
      highlightActiveIndentation: true,
    },
    matchBrackets: 'always',
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    autoClosingOvertype: 'auto',
    autoClosingDelete: 'auto',
    autoSurround: 'languageDefined',
    autoIndent: 'full',
    'semanticHighlighting.enabled': true,
    formatOnPaste: true,
    formatOnType: true,
    wordWrap: 'off',
    wordWrapColumn: 120,
    wrappingStrategy: 'advanced',
    padding: {
      top: 4,
      bottom: 4,
    },
    overviewRulerLanes: 3,
    overviewRulerBorder: false,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    find: {
      addExtraSpaceOnTop: false,
      seedSearchStringFromSelection: 'selection',
      autoFindInSelection: 'multiline',
    },
    suggest: {
      showIcons: true,
      preview: true,
      previewMode: 'subwordSmart',
      shareSuggestSelections: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    parameterHints: {
      enabled: true,
      cycle: true,
    },
    hover: {
      enabled: true,
      above: false,
    },
    links: true,
    colorDecorators: true,
    contextmenu: true,
    mouseWheelZoom: false,
    multiCursorModifier: 'alt',
    accessibilitySupport: 'auto',
    renderValidationDecorations: 'on',
  }
}

export function createEditorOptionsFromSettings(
  settings: DeadeyeSettings,
): editor.IStandaloneEditorConstructionOptions {
  const fontSize = settings.editor.fontSize

  return {
    ...createDefaultEditorOptions(),
    fontSize,
    fontFamily: settings.editor.fontFamily,
    wordWrap: settings.editor.wordWrap,
    tabSize: settings.editor.tabSize,
    lineNumbers: settings.editor.lineNumbers,
    lineHeight: computeEditorLineHeight(fontSize),
    theme: resolveThemeId(settings.appearance.theme),
    minimap: {
      enabled: settings.editor.minimap,
      scale: 1,
      showSlider: 'mouseover',
      renderCharacters: false,
      maxColumn: 80,
    },
  }
}
