import type { editor, languages } from 'monaco-editor'
import {
  LANGUAGE_REGISTRY,
  getLanguageDescriptor,
  type LanguageDescriptor,
} from '../../shared/language-registry'
import { monaco } from '../editor/monaco-setup'

const CUSTOM_LANGUAGE_CONFIG_IDS = new Set([
  'lua',
  'cpp',
  'c',
  'csharp',
  'python',
  'json',
  'html',
  'css',
  'scss',
  'less',
])

const BRACE_PAIRS: languages.CharacterPair[] = [
  ['{', '}'],
  ['[', ']'],
  ['(', ')'],
]

const ANGLE_PAIRS: languages.CharacterPair[] = [['<', '>']]

type MonacoDisposable = { dispose(): void }

/**
 * Registers Monaco language configurations and formatting hooks per registry entry.
 * Uses Monaco's built-in tokenizers — no custom editor engine.
 */
export class LanguageProfileManager {
  private readonly disposables: MonacoDisposable[] = []
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }

    for (const descriptor of LANGUAGE_REGISTRY) {
      if (descriptor.id === 'plaintext') {
        continue
      }

      if (CUSTOM_LANGUAGE_CONFIG_IDS.has(descriptor.id)) {
        this.registerLanguageConfiguration(descriptor)
      }

      this.registerFormattingHook(descriptor.id)
    }

    this.initialized = true
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }

    this.disposables.length = 0
    this.initialized = false
  }

  getEditorOptionsForLanguage(languageId: string): editor.IStandaloneEditorConstructionOptions {
    const descriptor = getLanguageDescriptor(languageId)
    if (!descriptor) {
      return {}
    }

    const options: editor.IStandaloneEditorConstructionOptions = {
      tabSize: descriptor.tabSize ?? 2,
      insertSpaces: descriptor.insertSpaces ?? true,
      detectIndentation: true,
    }

    if (descriptor.semanticHighlighting) {
      options['semanticHighlighting.enabled'] = true
    }

    return options
  }

  private registerFormattingHook(languageId: string): void {
    this.disposables.push(
      monaco.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits: () => [],
      }),
    )

    this.disposables.push(
      monaco.languages.registerDocumentRangeFormattingEditProvider(languageId, {
        provideDocumentRangeFormattingEdits: () => [],
      }),
    )
  }

  private registerLanguageConfiguration(descriptor: LanguageDescriptor): void {
    const configuration = this.buildConfiguration(descriptor)
    if (!configuration) {
      return
    }

    monaco.languages.setLanguageConfiguration(descriptor.id, configuration)
  }

  private buildConfiguration(descriptor: LanguageDescriptor): languages.LanguageConfiguration | null {
    switch (descriptor.id) {
      case 'lua':
        return {
          comments: {
            lineComment: '--',
            blockComment: ['--[[', ']]'],
          },
          brackets: BRACE_PAIRS,
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string'] },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        }

      case 'cpp':
      case 'c':
        return {
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
          },
          brackets: [...BRACE_PAIRS, ...ANGLE_PAIRS],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string'] },
            { open: '/*', close: ' */', notIn: ['string'] },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        }

      case 'csharp':
        return {
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
          },
          brackets: [...BRACE_PAIRS, ...ANGLE_PAIRS],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string'] },
            { open: '/*', close: ' */', notIn: ['string'] },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '<', close: '>' },
          ],
        }

      case 'python':
        return {
          comments: {
            lineComment: '#',
          },
          brackets: BRACE_PAIRS,
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string'] },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
          onEnterRules: [
            {
              beforeText: /^\s*(?:def|class|for|if|elif|else|while|try|except|finally|with)\b.*:\s*$/,
              action: { indentAction: monaco.languages.IndentAction.Indent },
            },
          ],
        }

      case 'typescript':
      case 'javascript':
        return null

      case 'json':
        return {
          brackets: BRACE_PAIRS,
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '"', close: '"' },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '"', close: '"' },
          ],
        }

      case 'html':
        return {
          comments: {
            blockComment: ['<!--', '-->'],
          },
          brackets: [...BRACE_PAIRS, ...ANGLE_PAIRS],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '<', close: '>', notIn: ['string'] },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '<', close: '>' },
          ],
        }

      case 'css':
      case 'scss':
      case 'less':
        return {
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
          },
          brackets: BRACE_PAIRS,
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        }

      default:
        return {
          brackets: BRACE_PAIRS,
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        }
    }
  }
}

let profileManager: LanguageProfileManager | null = null

export function getLanguageProfileManager(): LanguageProfileManager {
  if (!profileManager) {
    profileManager = new LanguageProfileManager()
  }

  return profileManager
}
