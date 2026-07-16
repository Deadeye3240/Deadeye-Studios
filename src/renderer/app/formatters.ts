import { getLanguageLabel } from '../../shared/language-registry'

export function formatTabTitle(document: { displayName: string }): string {
  return document.displayName
}

export function formatLanguageLabel(language: string): string {
  return getLanguageLabel(language)
}

export function formatEditorStatus(
  lineNumber: number,
  column: number,
  lineCount: number,
  isDirty: boolean,
): string {
  const dirtySuffix = isDirty ? ' · Modified' : ''
  return `Ln ${lineNumber}, Col ${column} · ${lineCount} lines${dirtySuffix}`
}
