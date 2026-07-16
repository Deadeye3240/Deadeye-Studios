# Releasing Deadeye Studio

## Version 1.0.0

Application version is defined in `package.json` and `src/shared/version.ts`.

## Automated release (recommended)

1. Ensure `package.json` version matches the tag (e.g. `1.0.0` → tag `v1.0.0`).
2. Commit and push to `main`.
3. Create and push the tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The [Release workflow](.github/workflows/release.yml) builds and publishes:

| Platform | Artifacts |
|----------|-----------|
| Windows | `Deadeye-Studio-{version}-Setup.exe`, `Deadeye-Studio-{version}-Portable.exe` |
| Linux | `Deadeye-Studio-{version}-x86_64.AppImage`, `Deadeye-Studio-{version}-amd64.deb` |

You can also trigger a release manually from **Actions → Release → Run workflow**.

## Local builds

```bash
npm run dist          # Windows Setup + Portable
npm run dist:win      # Windows only
npm run dist:linux    # Linux AppImage + deb (best on Linux)
npm run dist:portable # Windows portable only
npm run dist:installer # Windows NSIS only
```

Artifacts are written to `release/` (not committed to git).

## Manual GitHub release upload

If CI is unavailable, build locally and upload with GitHub CLI:

```bash
gh release create v1.0.0 \
  release/Deadeye-Studio-1.0.0-Setup.exe \
  release/Deadeye-Studio-1.0.0-Portable.exe \
  --title "Deadeye Studio v1.0.0" \
  --notes-file RELEASE_NOTES.md
```

Linux packages must be built on Linux (or via CI).
