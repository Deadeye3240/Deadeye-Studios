import type { editor } from 'monaco-editor'
import type { ThemeDefinition } from './types'
import { stripHash, withAlpha } from './utils'

function rule(
  token: string,
  foreground: string,
  options?: { background?: string; fontStyle?: string },
): editor.ITokenThemeRule {
  return {
    token,
    foreground: stripHash(foreground),
    ...(options?.background ? { background: stripHash(options.background) } : {}),
    ...(options?.fontStyle ? { fontStyle: options.fontStyle } : {}),
  }
}

export function buildMonacoTheme(theme: ThemeDefinition): editor.IStandaloneThemeData {
  const { syntax, shell } = theme
  const accent = shell.accent

  const rules: editor.ITokenThemeRule[] = [
    rule('', syntax.foreground, { background: syntax.background }),
    rule('comment', syntax.comment, { fontStyle: 'italic' }),
    rule('comment.doc', syntax.comment, { fontStyle: 'italic' }),
    rule('comment.block', syntax.comment, { fontStyle: 'italic' }),
    rule('comment.line', syntax.comment, { fontStyle: 'italic' }),
    rule('keyword', syntax.keyword),
    rule('keyword.control', syntax.keyword),
    rule('keyword.operator', syntax.operator),
    rule('keyword.storage', syntax.keyword),
    rule('keyword.storage.type', syntax.type, { fontStyle: 'bold' }),
    rule('storage', syntax.keyword),
    rule('storage.type', syntax.type, { fontStyle: 'bold' }),
    rule('constant', syntax.constant),
    rule('constant.language', syntax.constant),
    rule('constant.numeric', syntax.number),
    rule('number', syntax.number),
    rule('string', syntax.string),
    rule('string.quoted', syntax.string),
    rule('string.template', syntax.string),
    rule('string.regexp', syntax.constant),
    rule('variable', syntax.variable),
    rule('variable.parameter', syntax.parameter),
    rule('variable.language', syntax.constant, { fontStyle: 'italic' }),
    rule('entity.name.function', syntax.function),
    rule('entity.name.type', syntax.type, { fontStyle: 'bold' }),
    rule('entity.name.class', syntax.type, { fontStyle: 'bold' }),
    rule('entity.name.tag', syntax.tag),
    rule('entity.other.attribute-name', syntax.attribute),
    rule('support.function', syntax.function),
    rule('support.type', syntax.type),
    rule('support.constant', syntax.constant),
    rule('operator', syntax.operator),
    rule('delimiter', shell.textMuted),
    rule('tag', syntax.tag),
    rule('attribute.name', syntax.attribute),
    rule('attribute.value', syntax.constant),
    rule('type', syntax.type, { fontStyle: 'bold' }),
    rule('function', syntax.function),
    rule('method', syntax.function),
    rule('parameter', syntax.parameter),
    rule('property', syntax.variable),
    rule('invalid', syntax.invalid, { background: syntax.invalidBackground }),
    rule('class', syntax.type, { fontStyle: 'bold' }),
    rule('interface', syntax.type, { fontStyle: 'bold' }),
    rule('enum', syntax.type, { fontStyle: 'bold' }),
  ]

  const colors: Record<string, string> = {
    foreground: syntax.foreground,
    focusBorder: shell.accentMuted,
    errorForeground: shell.danger,

    'editor.background': syntax.background,
    'editor.foreground': syntax.foreground,
    'editor.lineHighlightBackground': shell.bgElevated,
    'editor.lineHighlightBorder': `${shell.bgElevated}00`,
    'editor.selectionBackground': withAlpha(accent, 0.2),
    'editor.selectionHighlightBackground': withAlpha(accent, 0.1),
    'editor.inactiveSelectionBackground': withAlpha(accent, 0.08),
    'editor.selectionForeground': shell.textPrimary,
    'editor.wordHighlightBackground': withAlpha(accent, 0.12),
    'editor.wordHighlightStrongBackground': withAlpha(accent, 0.18),
    'editor.findMatchBackground': withAlpha(accent, 0.27),
    'editor.findMatchHighlightBackground': withAlpha(accent, 0.13),
    'editor.findRangeHighlightBackground': withAlpha(accent, 0.09),
    'editor.hoverHighlightBackground': withAlpha(accent, 0.1),
    'editor.rangeHighlightBackground': withAlpha(accent, 0.07),

    'editorLineNumber.foreground': shell.textDisabled,
    'editorLineNumber.activeForeground': accent,
    'editorLineNumber.dimmedForeground': shell.borderSubtle,

    'editorCursor.foreground': accent,
    'editorCursor.background': syntax.background,

    'editorWhitespace.foreground': shell.borderStrong,
    'editorIndentGuide.background1': shell.borderSubtle,
    'editorIndentGuide.activeBackground1': shell.borderDefault,
    'editorRuler.foreground': shell.borderDefault,

    'editorBracketMatch.background': withAlpha(accent, 0.13),
    'editorBracketMatch.border': shell.accentMuted,

    'editorGutter.background': syntax.background,
    'editorGutter.modifiedBackground': accent,
    'editorGutter.addedBackground': shell.success,
    'editorGutter.deletedBackground': shell.danger,

    'editorError.foreground': shell.danger,
    'editorWarning.foreground': shell.warning,
    'editorInfo.foreground': accent,
    'editorHint.foreground': shell.success,

    'minimap.background': shell.bgBase,
    'minimap.selectionHighlight': withAlpha(accent, 0.27),
    'minimap.errorHighlight': shell.danger,
    'minimap.warningHighlight': shell.warning,

    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': theme.kind === 'light' ? '#00000014' : '#ffffff14',
    'scrollbarSlider.hoverBackground': theme.kind === 'light' ? '#00000024' : '#ffffff24',
    'scrollbarSlider.activeBackground': withAlpha(accent, 0.27),

    'editorWidget.background': shell.bgPanel,
    'editorWidget.foreground': shell.textPrimary,
    'editorWidget.border': shell.borderStrong,

    'editorSuggestWidget.background': shell.bgPanel,
    'editorSuggestWidget.border': shell.borderStrong,
    'editorSuggestWidget.foreground': shell.textPrimary,
    'editorSuggestWidget.focusHighlightForeground': accent,
    'editorSuggestWidget.highlightForeground': accent,
    'editorSuggestWidget.selectedBackground': withAlpha(accent, 0.13),
    'editorSuggestWidget.selectedForeground': shell.textPrimary,

    'editorHoverWidget.background': shell.bgPanel,
    'editorHoverWidget.border': shell.borderStrong,
    'editorHoverWidget.foreground': shell.textPrimary,

    'editorGhostText.foreground': shell.textDisabled,

    'peekView.border': shell.accentMuted,
    'peekViewEditor.background': shell.bgInput,
    'peekViewResult.background': shell.bgPanel,
    'peekViewTitle.background': shell.bgHover,
    'peekViewTitleLabel.foreground': shell.textPrimary,
    'peekViewTitleDescription.foreground': shell.textMuted,

    'diffEditor.insertedTextBackground': withAlpha(shell.success, 0.09),
    'diffEditor.removedTextBackground': withAlpha(shell.danger, 0.09),

    'list.activeSelectionBackground': withAlpha(accent, 0.13),
    'list.activeSelectionForeground': shell.textPrimary,
    'list.hoverBackground': theme.kind === 'light' ? '#0000000a' : '#ffffff0a',
    'list.inactiveSelectionBackground': theme.kind === 'light' ? '#00000008' : '#ffffff08',
    'list.focusOutline': withAlpha(accent, 0.27),
  }

  return {
    base: theme.monacoBase,
    inherit: true,
    rules,
    colors,
  }
}
