# Changelog

## v1.0.1 — 2026-07-16

### Fixed

- **Startup hang on "Starting interface..."** — Session restore ran while the loading overlay was still on screen. The "Restore Session?" dialog appeared behind it, blocking startup with no visible prompt. Loading now dismisses before restore; dialogs render above the loader; missing workspace folders skip restore silently.

## v1.0.0 — 2026-07-16

### Added

- Initial public release: Electron + Monaco desktop IDE for Windows and Linux.
- Windows NSIS installer and portable executable.
- Linux AppImage and `.deb` package.
- GitHub Actions release workflow.
