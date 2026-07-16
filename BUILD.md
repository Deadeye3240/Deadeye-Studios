# Build & Release Notes — Deadeye Studio v1.0.0

## Verified build environment

| Check | Result |
|-------|--------|
| TypeScript (`npm run typecheck`) | Pass |
| Production build (`npm run build`) | Pass |
| Packaged installer + portable (`npm run dist`) | Pass |
| Output path | `C:\dev\deadeye-studio` (no `#` in path) |

## Release artifacts

After `npm run dist`:

```
release/
  Deadeye-Studio-1.0.0-Setup.exe      (~86 MB)
  Deadeye-Studio-1.0.0-Portable.exe   (~85 MB)
  win-unpacked/                        Unpacked app for smoke testing
```

## Documented warnings (not errors)

These appear during build but do not block release:

### Vite chunk size

```
Some chunks are larger than 500 kB after minification.
```

Monaco Editor and its language workers produce large bundles. This is expected for a Monaco-based editor. Future optimization could use dynamic imports for rarely used language workers.

### npm `devdir` config

```
npm warn Unknown env config "devdir"
```

Comes from a global or user npm configuration entry, not from this project. Remove the obsolete `devdir` key from your npm config if you want to silence it.

### electron-builder code signing

Installers are built **unsigned** (`signAndEditExecutable: false`). Windows SmartScreen may show a warning on first launch. For public distribution, sign with a code-signing certificate.

### electron-builder cache on paths with `#`

If your user profile contains `#` (e.g. `Stream Shack PC#2`), set:

```
ELECTRON_BUILDER_CACHE=C:\dev\electron-builder-cache
```

`scripts/safe-dist.mjs` sets this automatically.

## Windows path `#` bug

If the project or user profile path contains `#`, Vite/esbuild may read the wrong file (often a SQLite cookie database at the truncated path). Symptoms:

```
ERROR: Expected ";" but found "format"
SQLite format 3...
```

**Fix:** Build from `C:\dev\deadeye-studio` or let `scripts/safe-build.mjs` stage the project to `C:\deadeye-studio-build`.

## Smoke test checklist

- [ ] Launch `Deadeye-Studio-1.0.0-Portable.exe` or `npm start`
- [ ] Welcome screen appears
- [ ] Open folder → file explorer populates
- [ ] Open/edit/save file
- [ ] Syntax highlighting for `.ts`, `.py`, `.rs`, `.lua`
- [ ] Terminal opens and accepts input
- [ ] Quick Open (`Ctrl+P`) finds files
- [ ] Settings panel opens and persists changes
- [ ] Git panel loads in a Git repository

## Version

Application version: **1.0.0** (`src/shared/version.ts`, `package.json`)
