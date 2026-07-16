import type { SupportedLanguageId } from '../../shared/language'
import { monaco } from '../editor/monaco-setup'

type MonacoDisposable = { dispose(): void }

/**
 * Language intelligence foundation for Deadeye Studio.
 *
 * Uses Monaco's built-in language workers as the initial LSP-compatible layer.
 * Providers are registered centrally so external language servers can replace them later.
 */
export class LanguageIntelligenceManager {
  private readonly disposables: MonacoDisposable[] = []
  private initialized = false

  initialize(workspaceRoot: string | null): void {
    if (this.initialized) {
      this.rebindWorkspace(workspaceRoot)
      return
    }

    this.configureTypeScriptDefaults(workspaceRoot)
    this.registerTypeScriptProviders('typescript')
    this.registerTypeScriptProviders('javascript')
    this.registerJsonProviders()
    this.registerHtmlProviders()
    this.registerCssProviders()

    this.initialized = true
  }

  rebindWorkspace(workspaceRoot: string | null): void {
    this.configureTypeScriptDefaults(workspaceRoot)
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }

    this.disposables.length = 0
    this.initialized = false
  }

  private configureTypeScriptDefaults(workspaceRoot: string | null): void {
    const compilerOptions: monaco.languages.typescript.CompilerOptions = {
      allowJs: true,
      checkJs: false,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.React,
      noEmit: true,
      esModuleInterop: true,
      allowNonTsExtensions: true,
    }

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions)
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    if (workspaceRoot) {
      monaco.languages.typescript.typescriptDefaults.setExtraLibs([
        {
          content: `// Workspace root: ${workspaceRoot}`,
          filePath: `inmemory:///workspace-root.ts`,
        },
      ])
    }
  }

  private registerTypeScriptProviders(languageId: SupportedLanguageId): void {
    this.disposables.push(
      monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.', '"', "'", '/', '<', '@'],
        provideCompletionItems: async (model, position) => {
          const worker =
            languageId === 'typescript'
              ? await monaco.languages.typescript.getTypeScriptWorker()
              : await monaco.languages.typescript.getJavaScriptWorker()

          const uri = model.uri
          const client = await worker(uri)
          const offset = model.getOffsetAt(position)
          const completions = await client.getCompletionsAtPosition(uri.toString(), offset)

          if (!completions?.entries) {
            return { suggestions: [] }
          }

          const word = model.getWordUntilPosition(position)
          const range = new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          )

          return {
            suggestions: completions.entries.map((entry: { name: string; kind: string }) => ({
              label: entry.name,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: entry.name,
              range,
              detail: entry.kind,
            })),
          }
        },
      }),
    )

    this.disposables.push(
      monaco.languages.registerHoverProvider(languageId, {
        provideHover: async (model, position) => {
          const worker =
            languageId === 'typescript'
              ? await monaco.languages.typescript.getTypeScriptWorker()
              : await monaco.languages.typescript.getJavaScriptWorker()

          const uri = model.uri
          const client = await worker(uri)
          const offset = model.getOffsetAt(position)
          const quickInfo = await client.getQuickInfoAtPosition(uri.toString(), offset)

          if (!quickInfo?.displayParts) {
            return null
          }

          const contents = quickInfo.displayParts.map((part: { text: string }) => part.text).join('')
          return {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column,
            ),
            contents: [{ value: `\`\`\`typescript\n${contents}\n\`\`\`` }],
          }
        },
      }),
    )

    this.disposables.push(
      monaco.languages.registerDefinitionProvider(languageId, {
        provideDefinition: async (model, position) => {
          const worker =
            languageId === 'typescript'
              ? await monaco.languages.typescript.getTypeScriptWorker()
              : await monaco.languages.typescript.getJavaScriptWorker()

          const uri = model.uri
          const client = await worker(uri)
          const offset = model.getOffsetAt(position)
          const definition = await client.getDefinitionAtPosition(uri.toString(), offset)

          if (!definition?.length) {
            return null
          }

          return definition.map((entry) => ({
            uri: monaco.Uri.parse(entry.fileName),
            range: new monaco.Range(
              entry.textSpan.start.line + 1,
              entry.textSpan.start.character + 1,
              entry.textSpan.end.line + 1,
              entry.textSpan.end.character + 1,
            ),
          }))
        },
      }),
    )
  }

  private registerJsonProviders(): void {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [],
    })
  }

  private registerHtmlProviders(): void {
    monaco.languages.html.htmlDefaults.setOptions({
      suggest: { html5: true },
    })
  }

  private registerCssProviders(): void {
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
    })
  }
}
